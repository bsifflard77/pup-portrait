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
      };

      // Add guest tracking if not authenticated
      if (!accessToken && isGuest) {
        body.isGuest = true;
        body.deviceFingerprint = await getDeviceFingerprint();
      }

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/generate-portrait`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
            apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
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

      set({
        currentPortrait: data.portrait,
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
