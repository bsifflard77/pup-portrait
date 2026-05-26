/**
 * Entry route — Pup Portrait.
 *
 * 2026-05-20 mobile redesign: web AND native now share the WebLanding
 * marketing hero (Monomoy navy + gold, 12 sample portraits, branded nav,
 * 3-step "How It Works", pricing, final CTA). The old native-only form
 * with guest-trial generation was retired so iOS and Android see the same
 * premium pitch as desktop browsers.
 *
 * Auth-aware behavior lives inside WebLanding itself — the nav and hero
 * CTAs flip to "Open app" once the user is signed in, otherwise they route
 * to /(auth)/signup. /(tabs)/home is the post-auth in-app experience.
 */

import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/auth-store';
import WebLanding from '../components/WebLanding';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, isLoading, router]);

  return <WebLanding />;
}
