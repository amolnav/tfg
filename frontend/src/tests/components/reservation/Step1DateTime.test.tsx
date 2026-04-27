import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Step1DateTime from '../../../components/reservation/Step1DateTime';
import * as api from '../../../services/api';
import type { TimeSlot } from '../../../types';

const t = (key: string) => {
  const keys: Record<string, string> = {
    'reservation.step1Title': 'Haz tu Reserva',
    'reservation.dateLabel': 'Fecha',
    'reservation.timeLabel': 'Hora',
    'reservation.paxLabel': 'Comensales',
    'reservation.nextBtn': 'Siguiente →',
    'reservation.loadingSlots': 'Cargando horarios...',
    'reservation.errorNoSlots': 'No hay horarios disponibles para este día y número de comensales. Prueba con otra fecha.',
  };
  return keys[key] || key;
};

// Mock de los servicios de API
vi.mock('../../../services/api', () => ({
  getAvailableTimes: vi.fn(),
  getPublicConfig: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t,
  }),
}));

describe('Step1DateTime Component', () => {
  const onNext = vi.fn();
  const mockedGetPublicConfig = vi.mocked(api.getPublicConfig);
  const mockedGetAvailableTimes = vi.mocked(api.getAvailableTimes);

  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetPublicConfig.mockResolvedValue({ maxPax: 12 });
    mockedGetAvailableTimes.mockResolvedValue([] as TimeSlot[]);
  });

  it('renders correctly', async () => {
    render(<Step1DateTime onNext={onNext} />);
    expect(screen.getByText('Haz tu Reserva')).toBeInTheDocument();
    expect(screen.getByLabelText('Fecha')).toBeInTheDocument();
  });

  it('loads and displays time slots after selecting a date', async () => {
    const mockSlots = [
      { time: '13:00', available: true },
      { time: '13:30', available: true },
      { time: '14:00', available: false },
    ];
    mockedGetAvailableTimes.mockResolvedValue(mockSlots);

    render(<Step1DateTime onNext={onNext} />);
    
    const dateInput = screen.getByLabelText('Fecha');
    fireEvent.change(dateInput, { target: { value: '2026-05-01' } });

    // Debería mostrar los slots disponibles
    await waitFor(() => {
      expect(screen.getByText('13:00')).toBeInTheDocument();
      expect(screen.getByText('13:30')).toBeInTheDocument();
      expect(screen.queryByText('14:00')).not.toBeInTheDocument(); // No disponible
    });
  });

  it('updates slots when pax (guests) changes', async () => {
    render(<Step1DateTime onNext={onNext} />);
    
    const dateInput = screen.getByLabelText('Fecha');
    fireEvent.change(dateInput, { target: { value: '2026-05-01' } });

    const paxSelect = screen.getByLabelText('Comensales');
    fireEvent.change(paxSelect, { target: { value: '4' } });

    await waitFor(() => {
      expect(mockedGetAvailableTimes).toHaveBeenCalledWith('2026-05-01', 4);
    });
  });

  it('calls onNext when form is submitted with valid data', async () => {
    mockedGetAvailableTimes.mockResolvedValue([{ time: '13:00', available: true }]);
    
    render(<Step1DateTime onNext={onNext} />);
    
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: '2026-05-01' } });
    
    await waitFor(() => screen.getByText('13:00'));
    fireEvent.click(screen.getByText('13:00'));
    
    fireEvent.click(screen.getByText('Siguiente →'));
    
    expect(onNext).toHaveBeenCalledWith({
      date: '2026-05-01',
      time: '13:00',
      pax: 2
    });
  });
});
