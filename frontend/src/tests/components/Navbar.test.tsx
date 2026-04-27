import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Navbar from '../../components/Navbar';
import { ConfigProvider } from '../../context/ConfigContext';
import { getPublicFrontendConfig } from '../../services/api';

vi.mock('../../services/api', () => ({
  getPublicFrontendConfig: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const keys: Record<string, string> = {
        'navbar.home': 'Inicio',
        'navbar.menu': 'Carta',
        'navbar.history': 'Nuestra Historia',
        'navbar.bookTable': 'Reservar una Mesa',
        'navbar.reservations': 'Reservas',
      };
      return keys[key] || key;
    },
    i18n: {
      changeLanguage: () => new Promise(() => {}),
      language: 'es',
    },
  }),
}));

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPublicFrontendConfig).mockResolvedValue({
      restaurant_name: 'Mesón Marinero',
      restaurant_address: 'Calle del Puerto, 12 - Alicante',
      restaurant_phone: '965 00 00 00',
      restaurant_email: 'info@mesonmarinero.es',
      specialties: {
        title: { es: 'Nuestras Especialidades', en: 'Our Specialties', fr: 'Nos Specialites' },
        items: [],
      },
    });
  });

  it('renders correctly with default props', () => {
    render(
      <ConfigProvider>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </ConfigProvider>
    );
    
    expect(screen.getByText('⚓ Mesón Marinero')).toBeInTheDocument();
    
    // Debería haber 2 links a "Carta" (Desktop y Mobile)
    const cartaLinks = screen.getAllByRole('link', { name: /carta/i });
    expect(cartaLinks.length).toBe(2);
  });

  it('hides nav links when showLinks is false', () => {
    render(
      <ConfigProvider>
        <BrowserRouter>
          <Navbar showLinks={false} />
        </BrowserRouter>
      </ConfigProvider>
    );
    
    expect(screen.queryByText('Inicio')).not.toBeInTheDocument();
  });

  it('shows phone info when isReservation is true', () => {
    render(
      <ConfigProvider>
        <BrowserRouter>
          <Navbar isReservation={true} />
        </BrowserRouter>
      </ConfigProvider>
    );
    
    expect(screen.getByText(/965 00 00 00/i)).toBeInTheDocument();
    expect(screen.queryByText('Reservar una Mesa')).not.toBeInTheDocument();
  });
});
