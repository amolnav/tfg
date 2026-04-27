import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useReveal } from '../services/useReveal';
import { useConfig } from '../context/ConfigContext';
import { DEFAULT_SPECIALTIES } from '../constants/publicConfig';
import { getBaseLanguage } from '../utils/i18n';
import type { SpecialtiesItem } from '../types';

const Specialties: React.FC = () => {
  const revealRef = useReveal();
  const { i18n } = useTranslation();
  const { config } = useConfig();
  const specialtiesConfig = config.specialties;

  const currentLang = getBaseLanguage(i18n.language) as keyof typeof DEFAULT_SPECIALTIES.title;
  
  const title = specialtiesConfig?.title?.[currentLang] || DEFAULT_SPECIALTIES.title[currentLang] || DEFAULT_SPECIALTIES.title.es;
  const items = specialtiesConfig?.items || DEFAULT_SPECIALTIES.items;

  return (
    <section className="specialties" id="menu" ref={revealRef}>
      <div className="section-header reveal">
        <h2>{title}</h2>
      </div>
      <div className="specialties-grid">
        {items.map((item: SpecialtiesItem) => (
          <div key={item.id} className="specialty-card reveal">
            <div className="card-image">
              <img src={item.image} alt={item.name[currentLang] || item.name.es} />
            </div>
            <div className="card-content">
              <h3>{item.name[currentLang] || item.name.es}</h3>
              <p>{item.description[currentLang] || item.description.es}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="section-footer reveal delay-3">
        <Link to="/carta" className="btn btn-primary">
          {currentLang === 'en' ? 'View Full Menu' : currentLang === 'fr' ? 'Voir Menu Complet' : 'Ver Carta Completa'}
        </Link>
      </div>
    </section>
  );
};

export default Specialties;
