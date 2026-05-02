import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';

  const [theme, setTheme] = useState<Theme>(() => {
    // If not admin path on initial load, always light
    const initialIsAdmin = window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login';
    if (!initialIsAdmin) return 'light';

    const saved = localStorage.getItem('admin_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Effect to handle navigation changes
  useEffect(() => {
    if (!isAdminPath && theme === 'dark') {
      setTheme('light');
    }
  }, [location.pathname, isAdminPath, theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Only save to localStorage if we are in admin and manually changed it
    if (isAdminPath) {
      localStorage.setItem('admin_theme', theme);
    }
    
    // Apply dark mode classes ONLY if in admin path AND theme is dark
    if (theme === 'dark' && isAdminPath) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [theme, isAdminPath]);

  const toggleTheme = () => {
    // Only allow toggling if we are in the admin area
    if (window.location.pathname.startsWith('/admin')) {
      setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
