
export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'RECONFIRMED'
  | 'SEATED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type BookingSource = 'WEB' | 'PHONE' | 'WALK_IN' | 'BACKOFFICE';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isVip: boolean;
  isBlacklisted: boolean;
  blacklistReason?: string;
  allergens: string[];
  tags: string[];
  preferences?: string;
  birthday?: string;
  previousEmails?: string[];
  previousPhones?: string[];
  previousNames?: string[];
  language: 'ES' | 'EN' | 'FR';
  totalVisits: number;
  totalNoShows: number;
  createdAt: string;
  updatedAt: string;
  notes?: Array<{
    id: string;
    note: string;
    createdBy: string;
    createdAt: string;
  }>;
  bookings?: Booking[];
  waitlist?: Array<{
    id: string;
    date: string;
    pax: number;
    notes?: string;
    isResolved: boolean;
  }>;
  stats?: {
    totalBookings: number;
    completed: number;
    cancelled: number;
    noShows: number;
    upcoming: number;
    loyaltyRate: number;
    avgDaysBetweenVisits: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

export interface ZoneWithTables extends Zone {
  displayOrder?: number;
  tables: Array<{
    id: number;
    name: string;
    minCapacity: number;
    maxCapacity: number;
    isActive: boolean;
  }>;
}

export interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  slotInterval: number;
  daysOfWeek: number[];
  isActive: boolean;
}

export interface LocalizedText {
  es: string;
  en: string;
  fr: string;
}

export interface SpecialtiesItem {
  id: number;
  name: LocalizedText;
  description: LocalizedText;
  image: string;
}

export interface SpecialtiesConfig {
  title: LocalizedText;
  items: SpecialtiesItem[];
}

export interface PublicFrontendConfig {
  restaurant_name: string;
  restaurant_address: string;
  restaurant_phone: string;
  restaurant_email: string;
  specialties: SpecialtiesConfig;
}

export interface SystemConfig extends Partial<Record<string, string>> {
  dynamic_max_capacity?: string;
  dynamic_max_pax?: string;
  dynamic_active_tables?: string;
  opening_days?: string;
  restaurant_name?: string;
  restaurant_address?: string;
  restaurant_phone?: string;
  restaurant_email?: string;
  specialties_config?: string;
}

export interface ZonePayload {
  name: string;
  description: string;
  isActive: boolean;
  displayOrder: number;
}

export interface TablePayload {
  name: string;
  minCapacity: number;
  maxCapacity: number;
  isActive: boolean;
}

export interface MenuItemPayload {
  name: string;
  description: string;
  price: string;
  isActive: boolean;
  displayOrder: number;
  categoryId?: number | null;
}

export interface CustomerListResponse {
  customers: Customer[];
  total: number;
}

export interface Zone {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Table {
  id: number;
  name: string;
  minCapacity: number;
  maxCapacity: number;
  isActive: boolean;
  zone: Zone;
}

export interface Booking {
  id: string;
  date: string;
  duration: number;
  pax: number;
  status: BookingStatus;
  source: BookingSource;
  specialRequests?: string;
  customer: Customer;
  table?: Table;
  createdAt: string;
  confirmedAt?: string;
}

export interface DashboardSummary {
  totalBookings: number;
  activeBookings: number;
  totalPaxExpected: number;
  totalTables: number;
  occupancyRate: number;
  upcomingNext7Days: number;
}

export interface DashboardData {
  date: string;
  summary: DashboardSummary;
  statusCounts: Partial<Record<BookingStatus, number>>;
  bookings: Booking[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
  availableTables?: number;
}

export interface ReservationPayload {
  date: string;
  time: string;
  pax: number;
  zoneId?: number;
  specialRequests?: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    allergens?: string[];
  };
}

export interface ReservationConfirmation {
  booking: {
    id: string;
    confirmationCode?: string;
    date: string;
    pax: number;
    duration: string;
    status: BookingStatus;
  };
  customer: {
    name: string;
    email: string;
    isReturningCustomer: boolean;
  };
  table: {
    name: string;
    zone?: string;
    note?: string;
  };
}

export interface NewReservationEventPayload {
  id: string;
  date: string;
  pax: number;
  status: BookingStatus;
  tableName: string | null;
  zoneName: string | null;
  customerName: string;
  customerEmail: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: string;
  isActive: boolean;
  displayOrder: number;
}

export interface MenuCategory {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
  items: MenuItem[];
}
