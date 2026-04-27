
import axios from 'axios';
import type {
  ReservationPayload,
  ReservationConfirmation,
  DashboardData,
  Booking,
  BookingStatus,
  TimeSlot,
  Customer,
  CustomerListResponse,
  MenuCategory,
  MenuItemPayload,
  PublicFrontendConfig,
  Shift,
  SystemConfig,
  Table,
  TablePayload,
  ZonePayload,
  ZoneWithTables,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatically handle 401 Unauthorized errors (e.g. invalid or expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('admin_token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Public API ───────────────────────────────────────────

/**
 * Get available calendar days for a given month/pax
 * GET /api/public/reservations/availability/calendar
 */
export async function getAvailableCalendar(year: number, month: number, pax: number) {
  const { data } = await api.get('/public/reservations/availability/calendar', {
    params: { year, month, pax },
  });
  return data.data as { date: string; available: boolean }[];
}

/**
 * Get public config (max pax, etc.)
 * GET /api/public/reservations/availability/config
 */
export async function getPublicConfig() {
  const { data } = await api.get('/public/reservations/availability/config');
  return data.data as { maxPax: number };
}

/**
 * Get public frontend configurations (like specialties)
 * GET /api/public/config
 */
export async function getPublicFrontendConfig(): Promise<PublicFrontendConfig> {
  const { data } = await api.get('/public/config');
  return data.data as PublicFrontendConfig;
}

/**
 * Get available time slots for a given date and party size
 * POST /api/public/reservations/availability/times
 */
export async function getAvailableTimes(date: string, pax: number): Promise<TimeSlot[]> {
  const { data } = await api.post('/public/reservations/availability/times', { date, pax });
  const times: string[] = data.data?.times || [];
  return times.map(time => ({ time, available: true }));
}

/**
 * Create a new reservation (public flow)
 * POST /api/public/reservations
 */
export async function createReservation(
  payload: ReservationPayload
): Promise<ReservationConfirmation> {
  const { data } = await api.post('/public/reservations', payload);
  return data.data as ReservationConfirmation;
}

// ─── Auth ────────────────────────────────────────────────

/**
 * Admin login
 * POST /api/auth/login
 */
export async function authLogin(email: string, password: string): Promise<string> {
  const { data } = await api.post('/auth/login', { email, password });
  return data.data.token as string;
}

// ─── Backoffice API ───────────────────────────────────────

/**
 * Get dashboard summary for a given date (defaults to today)
 * GET /api/backoffice/dashboard
 */
export async function getDashboard(date?: string): Promise<DashboardData> {
  const { data } = await api.get('/backoffice/dashboard', { params: date ? { date } : {} });
  return data.data as DashboardData;
}

/**
 * Get list of bookings with optional filters
 * GET /api/backoffice/bookings
 */
export async function getBookings(params?: {
  date?: string;
  status?: BookingStatus;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ bookings: Booking[]; total: number }> {
  const { data } = await api.get('/backoffice/bookings', { params });
  return {
    bookings: data.data?.bookings || [],
    total: data.data?.pagination?.total || 0,
  };
}

/**
 * Create a new backoffice reservation
 * POST /api/backoffice/bookings
 */
export async function createBackofficeBooking(payload: ReservationPayload & { source?: string }): Promise<Booking> {
  const { data } = await api.post('/backoffice/bookings', payload);
  return data.data as Booking;
}

/**
 * Update a booking's status
 * PATCH /api/backoffice/bookings/:id/status
 */
export async function updateBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
  const { data } = await api.patch(`/backoffice/bookings/${id}/status`, { status });
  return data.data as Booking;
}

/**
 * Get all zones with their tables
 * GET /api/backoffice/zones
 */
export async function getZones(all: boolean = false): Promise<ZoneWithTables[]> {
  const { data } = await api.get('/backoffice/zones', { params: { all } });
  return (data.data?.zones || data.data) as ZoneWithTables[];
}

export async function createZone(payload: ZonePayload): Promise<ZoneWithTables> {
  const { data } = await api.post('/backoffice/zones', payload);
  return data.data;
}

export async function updateZone(id: number, payload: ZonePayload): Promise<ZoneWithTables> {
  const { data } = await api.put(`/backoffice/zones/${id}`, payload);
  return data.data;
}

export async function deleteZone(id: number) {
  const { data } = await api.delete(`/backoffice/zones/${id}`);
  return data.data;
}

export async function createTable(zoneId: number, payload: TablePayload): Promise<Table> {
  const { data } = await api.post(`/backoffice/zones/${zoneId}/tables`, payload);
  return data.data;
}

export async function updateTable(tableId: number, payload: TablePayload): Promise<Table> {
  const { data } = await api.put(`/backoffice/zones/tables/${tableId}`, payload);
  return data.data;
}

export async function deleteTable(tableId: number) {
  const { data } = await api.delete(`/backoffice/zones/tables/${tableId}`);
  return data.data;
}

export async function getShifts(): Promise<Shift[]> {
  const { data } = await api.get('/backoffice/shifts');
  return (data.data?.shifts || []) as Shift[];
}

export async function updateShift(id: number, payload: Partial<Shift>): Promise<Shift> {
  const { data } = await api.patch(`/backoffice/shifts/${id}`, payload);
  return data.data;
}

export async function getSystemConfig(): Promise<SystemConfig> {
  const { data } = await api.get('/backoffice/config');
  return data.data as SystemConfig;
}

export async function updateSystemConfig(payload: Partial<SystemConfig>): Promise<SystemConfig> {
  const { data } = await api.patch('/backoffice/config', payload);
  return data.data;
}

// ─── Customers API ────────────────────────────────────────

/**
 * Get list of customers with optional search and filters
 * GET /api/backoffice/customers
 */
export async function getCustomers(params?: {
  search?: string;
  isVip?: boolean;
  isBlacklisted?: boolean;
  limit?: number;
  page?: number;
}): Promise<CustomerListResponse> {
  const { data } = await api.get('/backoffice/customers', { params });
  return {
    customers: data.data?.customers || [],
    total: data.data?.total || 0,
  };
}

/**
 * Get customer details by ID
 * GET /api/backoffice/customers/:id
 */
export async function getCustomerById(id: string): Promise<Customer> {
  const { data } = await api.get(`/backoffice/customers/${id}`);
  return data.data as Customer;
}

/**
 * Update customer profile
 * PATCH /api/backoffice/customers/:id
 */
export async function updateCustomer(
  id: string,
  payload: {
    preferences?: string;
    tags?: string[];
    allergens?: string[];
    birthday?: string;
  }
): Promise<Customer> {
  const { data } = await api.patch(`/backoffice/customers/${id}`, payload);
  return data.data;
}

/**
 * Add a note to a customer
 * POST /api/backoffice/customers/:id/notes
 */
export async function addCustomerNote(id: string, note: string): Promise<NonNullable<Customer['notes']>[number]> {
  const { data } = await api.post(`/backoffice/customers/${id}/notes`, { note });
  return data.data;
}

/**
 * Toggle customer VIP status
 * POST /api/backoffice/customers/:id/vip
 */
export async function toggleCustomerVip(id: string, isVip: boolean): Promise<Customer> {
  const { data } = await api.post(`/backoffice/customers/${id}/vip`, { isVip });
  return data.data;
}

/**
 * Toggle customer blacklist status
 * POST /api/backoffice/customers/:id/blacklist
 */
export async function toggleCustomerBlacklist(
  id: string,
  blacklist: boolean,
  reason?: string
): Promise<Customer> {
  const { data } = await api.post(`/backoffice/customers/${id}/blacklist`, {
    blacklist,
    reason,
  });
  return data.data;
}

// ─── Menu API ──────────────────────────────────────────

/**
 * Get public menu
 * GET /api/public/menu
 */
export async function getPublicMenu() {
  const { data } = await api.get('/public/menu');
  return data.data.categories;
}

/**
 * Get public Google reviews
 * GET /api/public/reviews
 */
export async function getReviews() {
  const { data } = await api.get('/public/reviews');
  return data.data;
}

/**
 * Get backoffice menu categories with items
 * GET /api/backoffice/menu/categories
 */
export async function getAdminMenu(): Promise<MenuCategory[]> {
  const { data } = await api.get('/backoffice/menu/categories');
  return data.data.categories as MenuCategory[];
}

export async function createMenuCategory(payload: Omit<MenuCategory, 'id' | 'items'>): Promise<MenuCategory> {
  const { data } = await api.post('/backoffice/menu/categories', payload);
  return data.data;
}

export async function updateMenuCategory(id: number, payload: Omit<MenuCategory, 'id' | 'items'>): Promise<MenuCategory> {
  const { data } = await api.put(`/backoffice/menu/categories/${id}`, payload);
  return data.data;
}

export async function deleteMenuCategory(id: number) {
  const { data } = await api.delete(`/backoffice/menu/categories/${id}`);
  return data.data;
}

export async function createMenuItem(payload: MenuItemPayload) {
  const { data } = await api.post('/backoffice/menu/items', payload);
  return data.data;
}

export async function updateMenuItem(id: number, payload: MenuItemPayload) {
  const { data } = await api.put(`/backoffice/menu/items/${id}`, payload);
  return data.data;
}

export async function deleteMenuItem(id: number) {
  const { data } = await api.delete(`/backoffice/menu/items/${id}`);
  return data.data;
}

export async function reorderMenuCategories(ids: (number | string)[]) {
  const { data } = await api.post('/backoffice/menu/categories/reorder', { ids });
  return data.data;
}
