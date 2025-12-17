import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { getDeviceFingerprint, markGuestTrialUsed } from '../lib/guest-tracker';
import type { Portrait, GeneratePortraitRequest, PortraitStyle } from '@pup-portrait/shared';

interface PortraitState {
  currentPortrait: Portrait | null;
  recentPortraits: Portrait[];
  isGenerating: boolean;
  remainingGenerations: number | null;
  error: string | null;

  // Actions
  generatePortrait: (
    request: GeneratePortraitRequest,
    isGuest?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  fetchUserPortraits: () => Promise<void>;
  clearError: () => void;
}

export const usePortraitStore = create<PortraitState>((set, get) => ({
  currentPortrait: null,
  recentPortraits: [],
  isGenerating: false,
  remainingGenerations: null,
  error: null,

  generatePortrait: async (request, isGuest = false) => {
    set({ isGenerating: true, error: null });

    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      const body: any = {
        breed: request.breed,
        color: request.color,
        background: request.background,
        style: request.style || 'realistic',
        themePrompt: request.themePrompt,
      };

      // Add guest tracking if not authenticated
      if (!accessToken && isGuest) {
        body.isGuest = true;
        body.deviceFingerprint = await getDeviceFingerprint();
      }

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables');
      }

      const functionUrl = `${supabaseUrl}/functions/v1/generate-portrait`;

      const response = await fetch(
        functionUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Use user token if available, otherwise use anon key for auth
            Authorization: `Bearer ${accessToken || supabaseAnonKey}`,
            apikey: supabaseAnonKey,
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || data.error || 'Generation failed';
        set({ error: errorMessage, isGenerating: false });
        return { success: false, error: errorMessage };
      }

      // Mark guest trial as used
      if (isGuest && !accessToken) {
        await markGuestTrialUsed();
      }

      // Transform snake_case from API to camelCase for frontend
      const portrait = data.portrait;
      const transformedPortrait: Portrait = {
        id: portrait.id,
        userId: portrait.user_id,
        breed: portrait.breed,
        color: portrait.color,
        background: portrait.background,
        style: portrait.style as PortraitStyle,
        imageUrl: portrait.image_url,
        thumbnailUrl: portrait.thumbnail_url,
        prompt: portrait.prompt,
        isPremium: portrait.is_premium,
        isPublic: portrait.is_public,
        createdAt: portrait.created_at,
      };

      set({
        currentPortrait: transformedPortrait,
        remainingGenerations: data.remainingGenerations,
        isGenerating: false,
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ error: errorMessage, isGenerating: false });
      return { success: false, error: errorMessage };
    }
  },

  fetchUserPortraits: async () => {
    try {
      const { data: portraits, error } = await supabase
        .from('portraits')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      set({
        recentPortraits: portraits.map((p) => ({
          id: p.id,
          userId: p.user_id,
          breed: p.breed,
          color: p.color,
          background: p.background,
          style: p.style as PortraitStyle,
          imageUrl: p.image_url,
          thumbnailUrl: p.thumbnail_url,
          prompt: p.prompt,
          isPremium: p.is_premium,
          isPublic: p.is_public,
          createdAt: p.created_at,
        })),
      });
    } catch (error) {
      console.error('Error fetching portraits:', error);
    }
  },

  clearError: () => set({ error: null }),
}));
