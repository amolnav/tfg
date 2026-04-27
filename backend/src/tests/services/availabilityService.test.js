import { describe, it, expect, vi, beforeEach } from 'vitest';
const prisma = require('../../config/database');
import { getAvailableDaysInMonth, checkAvailability } from '../../services/availabilityService';

describe('availabilityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAvailableDaysInMonth', () => {
    it('debería retornar días disponibles si hay turnos y mesas', async () => {
      prisma.shift.findMany.mockResolvedValue([
        { id: 1, name: 'Comida', startTime: '13:00', endTime: '16:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], isActive: true }
      ]);
      prisma.closure.findMany.mockResolvedValue([]);
      prisma.systemConfig.findUnique.mockResolvedValue({ key: 'opening_days', value: '0,1,2,3,4,5,6' });
      prisma.table.findMany.mockResolvedValue([
        { id: 1, name: 'Mesa 1', minCapacity: 2, maxCapacity: 4, isActive: true, zone: { name: 'Terraza' } }
      ]);
      prisma.booking.findMany.mockResolvedValue([]);

      const result = await getAvailableDaysInMonth(2026, 4, 2);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('checkAvailability', () => {
    it('debería confirmar disponibilidad si la mesa está libre', async () => {
      prisma.shift.findMany.mockResolvedValue([
        { id: 1, name: 'Comida', startTime: '13:00', endTime: '16:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], slotInterval: 30, isActive: true }
      ]);
      prisma.closure.findMany.mockResolvedValue([]);
      prisma.systemConfig.findUnique.mockResolvedValue({ key: 'opening_days', value: '0,1,2,3,4,5,6' });
      prisma.table.findMany.mockResolvedValue([
        { id: 1, name: 'Mesa 1', minCapacity: 2, maxCapacity: 4, isActive: true, zone: { name: 'Terraza' } }
      ]);
      prisma.booking.findMany.mockResolvedValue([]);

      const result = await checkAvailability('2026-05-01', '14:00', 2);
      expect(result.available).toBe(true);
    });

    it('debería rechazar el último slot si la reserva se sale del turno', async () => {
      prisma.shift.findMany.mockResolvedValue([
        { id: 1, name: 'Comida', startTime: '13:00', endTime: '16:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], slotInterval: 30, isActive: true }
      ]);
      prisma.closure.findMany.mockResolvedValue([]);
      prisma.systemConfig.findUnique.mockResolvedValue({ key: 'opening_days', value: '0,1,2,3,4,5,6' });
      prisma.table.findMany.mockResolvedValue([
        { id: 1, name: 'Mesa 1', minCapacity: 2, maxCapacity: 4, isActive: true, zone: { name: 'Terraza' } }
      ]);

      const result = await checkAvailability('2026-05-01', '16:00', 2);
      expect(result.available).toBe(false);
      expect(result.message).toContain('turno disponible');
    });
  });
});
