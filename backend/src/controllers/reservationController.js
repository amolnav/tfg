
const crypto = require('crypto');
const prisma = require('../config/database');
const customerService = require('../services/customerService');
const emailService = require('../services/emailService');
const tableAssignmentService = require('../services/tableAssignmentService');
const validationService = require('../services/validationService');
const { asyncHandler } = require('../middleware/errorHandler');
const { emitToBackoffice } = require('../socketManager');
const { combineDateAndTime } = require('../utils/dateHelpers');
const { calculateDuration } = require('../utils/tableHelpers');
const { BOOKING_SOURCE, BOOKING_STATUS } = require('../config/constants');

/**
 * POST /api/public/reservations
 * Crea una reserva desde el frontend público
 * Body: {
 *   date, time, pax, zoneId?,
 *   customer: { email, firstName, lastName, phone, allergens? },
 *   specialRequests?
 * }
 */
exports.createReservation = asyncHandler(async (req, res) => {
  const {
    date,
    time,
    pax,
    zoneId,
    customer: customerData,
    specialRequests
  } = req.body;
  
  // Validación completa de los datos
  await validationService.validateBookingData({
    date,
    time,
    pax,
    ...customerData
  });
  
  console.log(`📝 Creando reserva: ${date} ${time} (${pax} pax) - ${customerData.email}`);
  
  // Sanitizar datos
  const sanitizedRequests = validationService.sanitizeText(specialRequests, 500);
  const sanitizedAllergens = validationService.validateAllergens(customerData.allergens);
  
  // Crear/actualizar cliente
  const { customer, isNew } = await customerService.findOrCreateCustomer(
    customerData.email,
    {
      ...customerData,
      allergens: sanitizedAllergens
    }
  );
  
  // Comprobar si está en lista negra
  if (customer.isBlacklisted) {
    throw new BusinessError(
      'No se pueden crear reservas para este cliente. Contacte al restaurante.',
      'CUSTOMER_BLACKLISTED',
      403
    );
  }
  
  // Asignar mesa óptima
  const assignment = await tableAssignmentService.assignOptimalTable(
    parseInt(pax),
    date,
    time,
    zoneId ? parseInt(zoneId) : null
  );
  
  // Generar token de confirmación único
  const confirmationToken = crypto.randomBytes(16).toString('hex');
  
  // Calcular duración
  const duration = calculateDuration(parseInt(pax));
  const dateTime = combineDateAndTime(date, time);
  
  // Crear la reserva
  const booking = await prisma.booking.create({
    data: {
      date: dateTime,
      duration,
      pax: parseInt(pax),
      status: BOOKING_STATUS.CONFIRMED,
      source: BOOKING_SOURCE.WEB,
      specialRequests: sanitizedRequests || null,
      customerId: customer.id,
      tableId: assignment.type === 'SINGLE' ? assignment.table.id : assignment.tables[0].id,
      confirmationToken,
      confirmedAt: new Date()
    },
    include: {
      customer: true,
      table: {
        include: { zone: true }
      }
    }
  });
  
  console.log(`✅ Reserva creada: ${booking.id}`);

  emitToBackoffice('new_reservation', {
    id: booking.id,
    date: booking.date,
    pax: booking.pax,
    status: booking.status,
    tableName: booking.table?.name || null,
    zoneName: booking.table?.zone?.name || null,
    customerName: `${customer.firstName} ${customer.lastName}`,
    customerEmail: customer.email
  });
  
  // Enviar email de confirmación
  emailService.sendBookingConfirmation(booking, customer);
  
  res.status(201).json({
    status: 'success',
    message: isNew 
      ? `¡Reserva confirmada! Te hemos enviado un email de confirmación a ${customer.email}`
      : `¡Bienvenido de nuevo, ${customer.firstName}! Reserva confirmada.`,
    data: {
      booking: {
        id: booking.id,
        date: booking.date,
        pax: booking.pax,
        duration: `${booking.duration} minutos`,
        status: booking.status
      },
      customer: {
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        isReturningCustomer: !isNew
      },
      table: {
        name: booking.table.name,
        zone: booking.table.zone?.name,
        ...(assignment.type === 'COMBINATION' && {
          note: assignment.message
        })
      }
    }
  });
});

module.exports = exports;
