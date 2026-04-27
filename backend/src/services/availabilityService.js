
const prisma = require('../config/database');
const { 
  combineDateAndTime, 
  addMinutes, 
  doTimeRangesOverlap,
  getDayOfWeek,
  isDateInBookableRange,
  meetsMinimumAdvanceTime,
  generateTimeSlots,
  getDaysInMonth
} = require('../utils/dateHelpers');
const { filterTablesByCapacity, calculateDuration } = require('../utils/tableHelpers');
const { BOOKING_STATUS, AVAILABILITY } = require('../config/constants');
const { BusinessError } = require('../middleware/errorHandler');

function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function getDateContext(dateStr) {
  return {
    date: combineDateAndTime(dateStr, '12:00'),
    dayStart: combineDateAndTime(dateStr, '00:00'),
    dayEnd: combineDateAndTime(dateStr, '23:59')
  };
}

async function getClosuresForDate(dateStr) {
  const { dayStart, dayEnd } = getDateContext(dateStr);

  return prisma.closure.findMany({
    where: {
      startDate: { lte: dayEnd },
      OR: [
        { endDate: { gte: dayStart } },
        { endDate: null, startDate: { lte: dayEnd } }
      ]
    }
  });
}

function isShiftBlockedByClosure(shift, closures) {
  return closures.some((closure) =>
    closure.shiftId === shift.id || (closure.isFullDay && !closure.shiftId)
  );
}

async function getActiveShiftsForDate(dateStr) {
  const { date } = getDateContext(dateStr);
  const dayOfWeek = getDayOfWeek(date);
  const openingDays = await getOpeningDays();

  if (openingDays && !openingDays.includes(dayOfWeek)) {
    return {
      shifts: [],
      message: 'El restaurante está cerrado este día'
    };
  }

  const [shifts, closures] = await Promise.all([
    prisma.shift.findMany({
      where: {
        isActive: true,
        daysOfWeek: { has: dayOfWeek }
      },
      orderBy: { startTime: 'asc' }
    }),
    getClosuresForDate(dateStr)
  ]);

  if (shifts.length === 0) {
    return {
      shifts: [],
      message: 'No hay turnos configurados para este día'
    };
  }

  const availableShifts = shifts.filter((shift) => !isShiftBlockedByClosure(shift, closures));

  if (availableShifts.length === 0) {
    return {
      shifts: [],
      message: 'El restaurante está cerrado este día'
    };
  }

  return { shifts: availableShifts, message: null };
}

function findMatchingShift(timeStr, pax, shifts) {
  const requestedMinutes = timeToMinutes(timeStr);
  const duration = calculateDuration(pax);

  for (const shift of shifts) {
    const startMinutes = timeToMinutes(shift.startTime);
    const endMinutes = timeToMinutes(shift.endTime);

    if (requestedMinutes < startMinutes || requestedMinutes >= endMinutes) {
      continue;
    }

    if ((requestedMinutes - startMinutes) % shift.slotInterval !== 0) {
      continue;
    }

    if (requestedMinutes + duration > endMinutes) {
      continue;
    }

    return shift;
  }

  return null;
}

async function validateBookableSlot(dateStr, timeStr, pax) {
  if (!isDateInBookableRange(dateStr)) {
    return {
      valid: false,
      message: 'La fecha está fuera del rango permitido para reservas'
    };
  }

  if (!meetsMinimumAdvanceTime(dateStr, timeStr)) {
    return {
      valid: false,
      message: `Debe reservar con al menos ${AVAILABILITY.MIN_HOURS_AHEAD} horas de antelación`
    };
  }

  const { shifts, message } = await getActiveShiftsForDate(dateStr);
  if (shifts.length === 0) {
    return { valid: false, message };
  }

  const shift = findMatchingShift(timeStr, pax, shifts);
  if (!shift) {
    return {
      valid: false,
      message: 'La hora seleccionada no pertenece a un turno disponible'
    };
  }

  return { valid: true, shift };
}

async function assertBookableSlot(dateStr, timeStr, pax) {
  const result = await validateBookableSlot(dateStr, timeStr, pax);

  if (!result.valid) {
    throw new BusinessError(result.message, 'INVALID_BOOKING_SLOT', 409);
  }

  return result.shift;
}

/**
 * Obtiene los días disponibles en un mes para un número de comensales
 * @param {number} year
 * @param {number} month - 1-12
 * @param {number} pax
 * @param {number?} zoneId - Opcional
 * @returns {Promise<string[]>} Array de fechas "YYYY-MM-DD"
 */
async function getAvailableDaysInMonth(year, month, pax, zoneId = null) {
  const allDays = getDaysInMonth(year, month);
  const availableDays = [];
  
  for (const dateStr of allDays) {
    // Comprobar si está en rango reservable
    if (!isDateInBookableRange(dateStr)) continue;

    const { shifts } = await getActiveShiftsForDate(dateStr);
    if (shifts.length === 0) continue;
    
    // Comprobar si hay al menos una mesa disponible en algún momento del día
    const hasCapacity = await hasAvailabilityOnDate(dateStr, pax, zoneId);
    
    if (hasCapacity) {
      availableDays.push(dateStr);
    }
  }
  
  return availableDays;
}

/**
 * Comprueba si hay disponibilidad en un día específico
 */
async function hasAvailabilityOnDate(dateStr, pax, zoneId) {
  // Obtener mesas candidatas
  const tables = await getCandidateTables(pax, zoneId);
  if (tables.length === 0) return false;
  
  // Obtener turnos activos para este día
  const { shifts } = await getActiveShiftsForDate(dateStr);
  
  // Comprobar si hay disponibilidad en algún turno
  for (const shift of shifts) {
    const duration = calculateDuration(pax);
    const timeSlots = generateTimeSlots(shift.startTime, shift.endTime, shift.slotInterval)
      .filter((time) => timeToMinutes(time) + duration <= timeToMinutes(shift.endTime));
    
    for (const time of timeSlots) {
      const freeTables = await findFreeTablesAtTime(tables, dateStr, time, pax);
      if (freeTables.length > 0) return true;
    }
  }
  
  return false;
}

/**
 * Obtiene las horas disponibles para un día específico
 * @param {string} dateStr - "YYYY-MM-DD"
 * @param {number} pax
 * @param {number?} zoneId
 * @returns {Promise<Object>} { times: [...], shifts: [...] }
 */
async function getAvailableTimesForDay(dateStr, pax, zoneId = null) {
  // Validar fecha
  if (!isDateInBookableRange(dateStr)) {
    return { times: [], shifts: [], message: 'Fecha fuera del rango permitido' };
  }

  const { shifts, message: shiftsMessage } = await getActiveShiftsForDate(dateStr);
  if (shifts.length === 0) {
    return { times: [], shifts: [], message: shiftsMessage };
  }
  
  // Obtener mesas candidatas
  const tables = await getCandidateTables(pax, zoneId);
  if (tables.length === 0) {
    return { times: [], shifts: [], message: 'No hay mesas disponibles con esa capacidad' };
  }
  
  const availableTimes = [];
  const shiftInfo = [];
  const duration = calculateDuration(pax);
  
  for (const shift of shifts) {
    const timeSlots = generateTimeSlots(shift.startTime, shift.endTime, shift.slotInterval)
      .filter((time) => timeToMinutes(time) + duration <= timeToMinutes(shift.endTime));
    const shiftAvailableTimes = [];
    
    for (const time of timeSlots) {
      // Comprobar antelación mínima
      if (!meetsMinimumAdvanceTime(dateStr, time)) continue;
      
      // Buscar mesas libres
      const freeTables = await findFreeTablesAtTime(tables, dateStr, time, pax);
      
      if (freeTables.length > 0) {
        shiftAvailableTimes.push(time);
        availableTimes.push(time);
      }
    }
    
    if (shiftAvailableTimes.length > 0) {
      shiftInfo.push({
        name: shift.name,
        times: shiftAvailableTimes
      });
    }
  }
  
  return {
    times: availableTimes,
    shifts: shiftInfo,
    message: availableTimes.length > 0 ? null : 'No hay disponibilidad para este día'
  };
}

/**
 * Comprueba disponibilidad en una hora específica y sugiere alternativas
 * @param {string} dateStr
 * @param {string} timeStr
 * @param {number} pax
 * @param {number?} zoneId
 * @returns {Promise<Object>}
 */
async function checkAvailability(dateStr, timeStr, pax, zoneId = null) {
  const slotValidation = await validateBookableSlot(dateStr, timeStr, pax);
  if (!slotValidation.valid) {
    return {
      available: false,
      message: slotValidation.message,
      suggestions: []
    };
  }
  
  // Obtener mesas candidatas
  const tables = await getCandidateTables(pax, zoneId);
  if (tables.length === 0) {
    return {
      available: false,
      message: 'No existen mesas con esa capacidad en esta zona',
      suggestions: []
    };
  }
  
  // Comprobar hora solicitada
  const freeTables = await findFreeTablesAtTime(tables, dateStr, timeStr, pax);
  
  if (freeTables.length > 0) {
    return {
      available: true,
      time: timeStr,
      tables: freeTables.map(t => ({
        id: t.id,
        name: t.name,
        capacity: `${t.minCapacity}-${t.maxCapacity}`,
        zone: t.zone?.name
      }))
    };
  }
  
  // Si no hay disponibilidad, buscar sugerencias
  const suggestions = await findAlternativeTimes(tables, dateStr, timeStr, pax);
  
  return {
    available: false,
    message: 'Lo sentimos, a esa hora estamos completos',
    requestedTime: timeStr,
    suggestions
  };
}

/**
 * Obtiene mesas candidatas por capacidad y zona
 */
async function getCandidateTables(pax, zoneId = null) {
  const whereClause = {
    isActive: true,
    minCapacity: { lte: pax },
    maxCapacity: { gte: pax }
  };
  
  if (zoneId) {
    whereClause.zoneId = parseInt(zoneId);
  }
  
  return await prisma.table.findMany({
    where: whereClause,
    include: { zone: true }
  });
}

async function getOpeningDays() {
  const openingDaysConfig = await prisma.systemConfig.findUnique({
    where: { key: 'opening_days' }
  });

  if (!openingDaysConfig?.value) {
    return null;
  }

  return openingDaysConfig.value.split(',').map(Number);
}

/**
 * Encuentra mesas libres en un momento específico
 */
async function findFreeTablesAtTime(tables, dateStr, timeStr, pax) {
  const duration = calculateDuration(pax);
  const startDateTime = combineDateAndTime(dateStr, timeStr);
  const endDateTime = addMinutes(startDateTime, duration);
  
  const freeTables = [];
  
  for (const table of tables) {
    const isFree = await isTableFreeAtTime(table.id, startDateTime, endDateTime);
    if (isFree) {
      freeTables.push(table);
    }
  }
  
  return freeTables;
}

/**
 * Comprueba si una mesa está libre en un rango de tiempo
 */
async function isTableFreeAtTime(tableId, startTime, endTime) {
  const conflictingBookings = await prisma.booking.findMany({
    where: {
      tableId,
      status: {
        notIn: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.NO_SHOW]
      },
      date: { lt: endTime } // Optimización: solo traer reservas que podrían solaparse
    }
  });
  
  // Comprobar solapamientos
  for (const booking of conflictingBookings) {
    const bookingStart = new Date(booking.date);
    const bookingEnd = addMinutes(bookingStart, booking.duration);
    
    if (doTimeRangesOverlap(startTime, endTime, bookingStart, bookingEnd)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Busca horarios alternativos cercanos
 */
async function findAlternativeTimes(tables, dateStr, requestedTime, pax) {
  const suggestions = [];
  const offsets = AVAILABILITY.SUGGESTION_OFFSETS; // [-30, 30, -60, 60]
  
  for (const offset of offsets) {
    const baseDate = combineDateAndTime(dateStr, requestedTime);
    const newDateTime = addMinutes(baseDate, offset);
    const newTimeStr = newDateTime.toTimeString().slice(0, 5);
    
    // Comprobar antelación mínima
    if (!meetsMinimumAdvanceTime(dateStr, newTimeStr)) continue;
    
    // Buscar mesas libres
    const freeTables = await findFreeTablesAtTime(tables, dateStr, newTimeStr, pax);
    
    if (freeTables.length > 0) {
      suggestions.push({
        time: newTimeStr,
        availableTables: freeTables.length,
        difference: offset > 0 ? `+${offset} min` : `${offset} min`
      });
      
      // Limitar sugerencias
      if (suggestions.length >= AVAILABILITY.MAX_SUGGESTIONS) break;
    }
  }
  
  return suggestions.sort((a, b) => a.time.localeCompare(b.time));
}

module.exports = {
  getAvailableDaysInMonth,
  getAvailableTimesForDay,
  checkAvailability,
  isTableFreeAtTime,
  getCandidateTables,
  findFreeTablesAtTime,
  validateBookableSlot,
  assertBookableSlot
};
