'use client'

import { darkTheme, lightTheme } from '@/lib/utils/theme';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';

interface ThemeContextType {
  isDark: boolean;
  setIsDark: (isDark: boolean) => void;
  theme: typeof lightTheme | typeof darkTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorScheme = useNativeColorScheme();
  // Default to dark mode - don't override with system preference
  const [isDark, setIsDark] = useState(true);

  const theme = useMemo(() => (isDark ? darkTheme : lightTheme), [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark, theme }}>
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