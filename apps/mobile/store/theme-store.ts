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

// Light theme - warm, feminine, vibrant
export const lightTheme: ThemeColors = {
  background: '#FFF8F5',
  backgroundGradientStart: '#FFFFFF',
  backgroundGradientEnd: '#FFE8E0',
  card: '#FFFFFF',
  cardHover: '#FFF0EB',
  primary: '#E05A70',              // Richer coral/rose - more saturated
  primaryLight: '#FF7A8A',         // Brighter pink for gradients
  accent: '#F59E0B',               // Vibrant amber/gold
  accentGreen: '#10B981',          // Bright emerald green
  border: '#FFD6CC',               // Peachy border - more visible
  borderLight: '#FFE4DC',
  white: '#FFFFFF',
  text: '#1F1F2E',                 // Darker text for better contrast
  textSecondary: '#4A4A5C',
  muted: '#6B6B7D',                // Darker muted for better readability
  mutedLight: '#8B8B9D',
  destructive: '#DC2626',
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
