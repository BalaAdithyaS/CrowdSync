import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { CelestialScreenTransition, type CelestialTransitionType } from '@/components/ui/CelestialScreenTransition';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  transitionType: CelestialTransitionType;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('crowdsync_theme') : null;
    if (saved === 'dark' || saved === 'light') return saved;
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  const [transitionType, setTransitionType] = useState<CelestialTransitionType>(null);
  const transitionTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
    localStorage.setItem('crowdsync_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    if (transitionType !== null) return; // Prevent animation collisions

    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    const nextTransition: CelestialTransitionType = nextTheme === 'light' ? 'sunrise' : 'sunset';

    // Check user preference for reduced motion
    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setThemeState(nextTheme);
      return;
    }

    // Trigger full-screen bottom-center sunrise / sunset transition
    setTransitionType(nextTransition);

    // Switch DOM theme at midpoint (400ms) when the horizon circle covers the screen
    window.setTimeout(() => {
      setThemeState(nextTheme);
    }, 400);

    // Conclude transition at 850ms
    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current);
    }
    transitionTimeoutRef.current = window.setTimeout(() => {
      setTransitionType(null);
    }, 850);
  };

  const setTheme = (t: Theme) => {
    if (t === theme || transitionType !== null) return;
    const nextTransition: CelestialTransitionType = t === 'light' ? 'sunrise' : 'sunset';
    setTransitionType(nextTransition);

    window.setTimeout(() => {
      setThemeState(t);
    }, 400);

    transitionTimeoutRef.current = window.setTimeout(() => {
      setTransitionType(null);
    }, 850);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, transitionType }}>
      {children}
      {/* Full-screen bottom-center sunrise and sunset horizon transition */}
      <CelestialScreenTransition transitionType={transitionType} />
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
