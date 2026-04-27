const DEFAULT_PUBLIC_CONFIG = {
  restaurant_name: 'Mesón Marinero',
  restaurant_address: 'Calle del Puerto, 12 - Alicante',
  restaurant_phone: '965 00 00 00',
  restaurant_email: 'info@mesonmarinero.es'
};

const DEFAULT_SPECIALTIES = {
  title: {
    es: 'Nuestras Especialidades',
    en: 'Our Specialties',
    fr: 'Nos Specialites'
  },
  items: [
    {
      id: 1,
      name: { es: 'Paella Marinera', en: 'Seafood Paella', fr: 'Paella aux fruits de mer' },
      description: {
        es: 'Nuestro arroz mas famoso con marisco fresco del dia.',
        en: 'Our most famous rice with fresh seafood.',
        fr: 'Notre riz le plus celebre avec des fruits de mer du jour.'
      },
      image: '/img/Paella.png'
    },
    {
      id: 2,
      name: { es: 'Pulpo a la Gallega', en: 'Galician style Octopus', fr: 'Poulpe a la galicienne' },
      description: {
        es: 'Tierno pulpo con pimenton y aceite de oliva virgen.',
        en: 'Tender octopus with paprika and extra virgin olive oil.',
        fr: 'Poulpe tendre au paprika et a l\'huile d\'olive extra vierge.'
      },
      image: '/img/Pulpo.png'
    },
    {
      id: 3,
      name: { es: 'Lubina al Horno', en: 'Baked Sea Bass', fr: 'Bar au four' },
      description: {
        es: 'Pescado salvaje preparado con el toque tradicional del meson.',
        en: 'Wild fish prepared with our traditional touch.',
        fr: 'Poisson sauvage prepare avec notre touche traditionnelle.'
      },
      image: '/img/Lubina.png'
    }
  ]
};

module.exports = {
  DEFAULT_PUBLIC_CONFIG,
  DEFAULT_SPECIALTIES
};
