import { create } from 'zustand';
import { supabase, signInWithEmail, signUpWithEmail, signOut } from '../lib/supabase';
import type { User, SubscriptionTier } from '@pup-portrait/shared';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  signup: (email: string, password: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      set({ isLoading: true });

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          // Fetch profile data
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            set({
              user: {
                id: profile.id,
                email: profile.email,
                displayName: profile.display_name,
                avatarUrl: profile.avatar_url,
                subscriptionTier: profile.subscription_tier as SubscriptionTier,
                subscriptionStatus: profile.subscription_status,
                stripeCustomerId: profile.stripe_customer_id,
                dailyGenerationsUsed: profile.daily_generations_used,
                dailyResetAt: profile.daily_reset_at,
                weeklyGenerationsUsed: profile.weekly_generations_used || 0,
                weeklyResetAt: profile.weekly_reset_at,
                totalGenerations: profile.total_generations,
                createdAt: profile.created_at,
              },
              isAuthenticated: true,
              isLoading: false,
            });
          }
        } else {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      });

      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          set({
            user: {
              id: profile.id,
              email: profile.email,
              displayName: profile.display_name,
              avatarUrl: profile.avatar_url,
              subscriptionTier: profile.subscription_tier as SubscriptionTier,
              subscriptionStatus: profile.subscription_status,
              stripeCustomerId: profile.stripe_customer_id,
              dailyGenerationsUsed: profile.daily_generations_used,
              dailyResetAt: profile.daily_reset_at,
              weeklyGenerationsUsed: profile.weekly_generations_used || 0,
              weeklyResetAt: profile.weekly_reset_at,
              totalGenerations: profile.total_generations,
              createdAt: profile.created_at,
            },
            isAuthenticated: true,
          });
        }
      }

      set({ isLoading: false });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    try {
      const { error } = await signInWithEmail(email, password);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  signup: async (email, password) => {
    try {
      const { error } = await signUpWithEmail(email, password);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  logout: async () => {
    await signOut();
    set({ user: null, isAuthenticated: false });
  },

  refreshUser: async () => {
    const { user } = get();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      set({
        user: {
          ...user,
          subscriptionTier: profile.subscription_tier as SubscriptionTier,
          subscriptionStatus: profile.subscription_status,
          dailyGenerationsUsed: profile.daily_generations_used,
          dailyResetAt: profile.daily_reset_at,
          weeklyGenerationsUsed: profile.weekly_generations_used || 0,
          weeklyResetAt: profile.weekly_reset_at,
          totalGenerations: profile.total_generations,
        },
      });
    }
  },
}));
