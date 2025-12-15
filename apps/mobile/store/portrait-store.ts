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

      // Hardcoded to bypass env var caching issues
      const supabaseUrl = 'https://rmalsvaoomhrgflioiqx.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtYWxzdmFvb21ocmdmbGlvaXF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NzEyMTcsImV4cCI6MjA4MDU0NzIxN30.pUkhBzVxpHu8Qsr3hO9pYgZ6_E9X-MatS6Y4KHv5XR0';

      console.log('=== DEBUG: Generate Portrait ===');
      console.log('Supabase URL:', supabaseUrl);
      console.log('Anon Key exists:', !!supabaseAnonKey);
      console.log('Request body:', body);

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(`Missing env vars: URL=${!!supabaseUrl}, Key=${!!supabaseAnonKey}`);
      }

      const functionUrl = `${supabaseUrl}/functions/v1/generate-portrait`;
      console.log('Calling:', functionUrl);

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
