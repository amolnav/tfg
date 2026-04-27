
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getPublicFrontendConfig } from '../services/api';
import { DEFAULT_PUBLIC_CONFIG } from '../constants/publicConfig';
import type { PublicFrontendConfig } from '../types';

interface ConfigContextType {
  config: PublicFrontendConfig;
  loading: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<PublicFrontendConfig>(DEFAULT_PUBLIC_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await getPublicFrontendConfig();
        if (data) {
          setConfig({
            ...DEFAULT_PUBLIC_CONFIG,
            ...data,
            specialties: data.specialties || DEFAULT_PUBLIC_CONFIG.specialties
          });
        }
      } catch (error) {
        console.error('Error fetching public config:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return (
    <ConfigContext.Provider value={{ config, loading }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
