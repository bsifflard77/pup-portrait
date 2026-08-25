import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/auth-store';
import { useThemeStore } from '../store/theme-store';

export default function RootLayout() {
  const initialize = useAuthStore((state) => state.initialize);
  const { mode, colors } = useThemeStore();

  useEffect(() => {
    initialize();
  }, []);

  return (
    <>
      {/* 2026-05-20: lightTheme is now navy-on-dark to match WebLanding, so
          the status bar always needs light (white) content for legibility. */}
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(auth)/login"
          options={{
            title: 'Sign In',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="(auth)/signup"
          options={{
            title: 'Create Account',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="privacy"
          options={{
            title: 'Privacy Policy',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="terms"
          options={{
            title: 'Terms of Service',
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}
