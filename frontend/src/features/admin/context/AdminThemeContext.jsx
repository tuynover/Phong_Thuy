import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

export const AdminThemeContext = createContext({
  theme: 'dark',
  isLight: false,
  toggleTheme: () => {},
  setTheme: () => {}
});

export function AdminThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return 'dark'; // Mặc định dark mode
  });

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setThemeState(newTheme);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('admin_theme', theme);
    } catch (e) {}
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    isLight: theme === 'light',
    toggleTheme,
    setTheme
  }), [theme]);

  return (
    <AdminThemeContext.Provider value={value}>
      <div className={theme === 'light' ? 'admin-light-mode font-sans' : 'admin-dark-mode font-sans'}>
        {children}
      </div>
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext);
  if (!context) {
    throw new Error('useAdminTheme must be used within an AdminThemeProvider');
  }
  return context;
}
