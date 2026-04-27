import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Specialties from '../../components/Specialties';
import { getPublicFrontendConfig } from '../../services/api';
import { ConfigProvider } from '../../context/ConfigContext';

vi.mock('../../services/useReveal', () => ({
  useReveal: () => ({ current: null })
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'es' }
  })
}));

vi.mock('../../services/api', () => ({
  getPublicFrontendConfig: vi.fn(),
}));

describe('Specialties Component', () => {
  it('renders the section title and specialties cards', async () => {
    vi.mocked(getPublicFrontendConfig).mockResolvedValue({
      restaurant_name: 'Mesón Marinero',
      restaurant_address: 'Calle del Puerto, 12 - Alicante',
      restaurant_phone: '965 00 00 00',
      restaurant_email: 'info@mesonmarinero.es',
      specialties: {
        title: { es: 'Nuestras Especialidades', en: 'Our Specialties', fr: 'Nos Specialites' },
        items: [
          { id: 1, name: { es: 'Paella Marinera', en: 'Seafood Paella', fr: 'Paella aux fruits de mer' }, description: { es: 'desc 1', en: 'desc 1', fr: 'desc 1' }, image: '/img/Paella.png' },
          { id: 2, name: { es: 'Pulpo a la Gallega', en: 'Galician style Octopus', fr: 'Poulpe a la galicienne' }, description: { es: 'desc 2', en: 'desc 2', fr: 'desc 2' }, image: '/img/Pulpo.png' },
          { id: 3, name: { es: 'Lubina al Horno', en: 'Baked Sea Bass', fr: 'Bar au four' }, description: { es: 'desc 3', en: 'desc 3', fr: 'desc 3' }, image: '/img/Lubina.png' },
        ]
      }
    });

    render(
      <ConfigProvider>
        <BrowserRouter>
          <Specialties />
        </BrowserRouter>
      </ConfigProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText('Nuestras Especialidades')).toBeInTheDocument();
      expect(screen.getByText('Paella Marinera')).toBeInTheDocument();
      expect(screen.getByText('Pulpo a la Gallega')).toBeInTheDocument();
      expect(screen.getByText('Lubina al Horno')).toBeInTheDocument();
    });
  });

  it('contains a link to the menu page', async () => {
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
    render(
      <ConfigProvider>
        <BrowserRouter>
          <Specialties />
        </BrowserRouter>
      </ConfigProvider>
    );
    
    const link = await screen.findByRole('link', { name: /ver carta completa/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/carta');
  });
});
