import type { BookingStatus } from '../types';

export const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  RECONFIRMED: 'Reconfirmada',
  SEATED: 'En mesa',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No presentado',
};

export const STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: 'var(--status-pending)',
  CONFIRMED: 'var(--status-confirmed)',
  RECONFIRMED: 'var(--status-reconfirmed)',
  SEATED: 'var(--status-seated)',
  COMPLETED: 'var(--status-completed)',
  CANCELLED: 'var(--status-cancelled)',
  NO_SHOW: 'var(--status-no-show)',
};

export const STATUS_BADGE_CLASS: Record<BookingStatus, string> = {
  PENDING: 'badge badge-pending',
  CONFIRMED: 'badge badge-confirmed',
  RECONFIRMED: 'badge badge-reconfirmed',
  SEATED: 'badge badge-seated',
  COMPLETED: 'badge badge-completed',
  CANCELLED: 'badge badge-cancelled',
  NO_SHOW: 'badge badge-no-show',
};

export const ALL_STATUSES: BookingStatus[] = [
  'PENDING',
  'CONFIRMED',
  'RECONFIRMED',
  'SEATED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
];
