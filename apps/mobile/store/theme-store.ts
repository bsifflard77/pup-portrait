import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  backgroundGradientStart: string;
  backgroundGradientEnd: string;
  card: string;
  cardHover: string;
  primary: string;
  primaryLight: string;
  accent: string;
  accentGreen: string;
  border: string;
  borderLight: string;
  white: string;
  text: string;
  textSecondary: string;
  muted: string;
  mutedLight: string;
  destructive: string;
}

// Light theme — 2026-05-20 v3. Navy hero treatment to match WebLanding's
// premium look: deep navy gradient background, gold CTAs, cream text. The
// in-app form now reads like a continuation of the landing page instead of a
// flat cream form.
export const lightTheme: ThemeColors = {
  background: '#0F1B35',                 // Monomoy navy
  backgroundGradientStart: '#0F1B35',    // navy
  backgroundGradientEnd: '#243557',      // navy3 — subtle vertical fade
  card: '#1B2A4A',                       // navy2 — card surface
  cardHover: '#243557',                  // navy3 — hover/active card
  primary: '#D4A843',                    // Monomoy gold — primary CTA + selected chips
  primaryLight: '#E5BE5C',               // lighter gold for gradients
  accent: '#FFF4E6',                     // cream — high-emphasis accent
  accentGreen: '#10B981',
  border: '#2D4068',                     // soft navy line
  borderLight: '#3A4F7E',
  white: '#FFFFFF',
  text: '#FFF4E6',                       // cream body text
  textSecondary: '#C9D2E0',              // softer cream/blue-white
  muted: '#8C9AB5',                      // muted slate-cream
  mutedLight: '#B8C5DA',
  destructive: '#F87171',
};

// Dark theme - original scheme
export const darkTheme: ThemeColors = {
  background: '#0f0f1a',
  backgroundGradientStart: '#1a1a2e',
  backgroundGradientEnd: '#0f0f1a',
  card: '#1a1a2e',
  cardHover: '#252540',
  primary: '#6366f1',
  primaryLight: '#818cf8',
  accent: '#f59e0b',
  accentGreen: '#10b981',
  border: '#2a2a3e',
  borderLight: '#3a3a4e',
  white: '#ffffff',
  text: '#ffffff',
  textSecondary: '#d4d4d8',
  muted: '#a1a1aa',
  mutedLight: '#d4d4d8',
  destructive: '#ef4444',
};

interface ThemeState {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

// Simple store without persistence for now (to avoid SSR issues)
export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light', // Default to light theme (warm, feminine palette)
  colors: lightTheme,

  toggleTheme: () => {
    const newMode = get().mode === 'light' ? 'dark' : 'light';
    set({
      mode: newMode,
      colors: newMode === 'light' ? lightTheme : darkTheme,
    });
  },

  setTheme: (mode: ThemeMode) => {
    set({
      mode,
      colors: mode === 'light' ? lightTheme : darkTheme,
    });
  },
}));
