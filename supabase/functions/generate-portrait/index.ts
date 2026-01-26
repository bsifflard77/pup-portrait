// Supabase Edge Function: Generate Portrait
// Calls Nano Banana (Google Gemini) API to generate dog portraits

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  breed: string;
  color?: string;
  background?: string;
  style?: 'realistic' | 'cartoon' | 'watercolor' | 'artistic';
  themePrompt?: string;
  isGuest?: boolean;
  deviceFingerprint?: string;
}

const DOG_NAMES = [
  'Luna', 'Max', 'Bella', 'Charlie', 'Lucy', 'Cooper', 'Daisy', 'Buddy',
  'Sadie', 'Rocky', 'Molly', 'Tucker', 'Bailey', 'Duke', 'Lola', 'Bear',
  'Sophie', 'Zeus', 'Chloe', 'Bentley', 'Stella', 'Milo', 'Penny', 'Oscar',
];

// Tier limits configuration
const LIMITS = {
  GUEST: {
    total: 1, // 1 portrait ever
  },
  FREE: {
    weekly: 5, // 5 per week
  },
  PREMIUM: {
    daily: 15, // 15 per day (marketed as "unlimited")
  },
  LIFETIME: {
    daily: 15, // Same as premium
  },
};

// Helper to get start of week (Monday) in UTC
function getStartOfWeek(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day; // Days to subtract to get to Monday
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

// Helper to get start of today in UTC
function getStartOfDay(): Date {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleAiKey = Deno.env.get('GOOGLE_AI_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    let userTier = 'free';
    let usageCount = 0;
    let usagePeriod = 'this week';

    // Check if authenticated user
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (user && !authError) {
        userId = user.id;
        console.log('AUTHENTICATED USER:', userId, 'EMAIL:', user.email);

        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier, weekly_generations_used, weekly_reset_at, daily_generations_used, daily_reset_at, lifetime_credits')
          .eq('id', userId)
          .single();

        if (profile) {
          userTier = profile.subscription_tier;

          // Handle FREE tier (weekly limits)
          if (userTier === 'free') {
            const weekStart = getStartOfWeek();
            const weekStartTime = weekStart.getTime();
            const resetTime = profile.weekly_reset_at ? new Date(profile.weekly_reset_at).getTime() : 0;

            console.log('FREE tier check:', {
              weekStart: weekStart.toISOString(),
              weekStartTime,
              resetDate: profile.weekly_reset_at || 'null',
              resetTime,
              weekly_generations_used: profile.weekly_generations_used,
              needsReset: resetTime < weekStartTime
            });

            // Check if weekly reset needed (compare timestamps, not Date objects)
            if (resetTime < weekStartTime) {
              console.log('Resetting weekly counter to 0');
              await supabase
                .from('profiles')
                .update({ weekly_generations_used: 0, weekly_reset_at: weekStart.toISOString() })
                .eq('id', userId);
              usageCount = 0;
            } else {
              usageCount = profile.weekly_generations_used || 0;
              console.log('Using existing usageCount:', usageCount);
            }

            usagePeriod = 'this week';

            // Check weekly limit for free tier
            if (usageCount >= LIMITS.FREE.weekly) {
              return new Response(
                JSON.stringify({
                  error: 'Weekly limit reached',
                  code: 'WEEKLY_LIMIT_EXCEEDED',
                  message: `You've used all ${LIMITS.FREE.weekly} free portraits this week. Upgrade to Premium for more!`,
                  remaining: 0,
                  resetAt: getStartOfWeek().toISOString(),
                }),
                { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }

          // Handle PREMIUM/LIFETIME tier (daily limits)
          if (userTier === 'premium' || userTier === 'lifetime') {
            const dayStart = getStartOfDay();
            const dayStartTime = dayStart.getTime();
            const resetTime = profile.daily_reset_at ? new Date(profile.daily_reset_at).getTime() : 0;

            // Check if daily reset needed (compare timestamps)
            if (resetTime < dayStartTime) {
              await supabase
                .from('profiles')
                .update({ daily_generations_used: 0, daily_reset_at: dayStart.toISOString() })
                .eq('id', userId);
              usageCount = 0;
            } else {
              usageCount = profile.daily_generations_used || 0;
            }

            usagePeriod = 'today';

            // Check daily limit for premium/lifetime
            const dailyLimit = userTier === 'lifetime' ? LIMITS.LIFETIME.daily : LIMITS.PREMIUM.daily;
            if (usageCount >= dailyLimit) {
              return new Response(
                JSON.stringify({
                  error: 'Daily limit reached',
                  code: 'DAILY_LIMIT_EXCEEDED',
                  message: `You've generated ${dailyLimit} portraits today. Come back tomorrow for more!`,
                  remaining: 0,
                  resetAt: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000).toISOString(),
                }),
                { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }

          // Check lifetime credits (if applicable)
          if (userTier === 'lifetime' && profile.lifetime_credits !== null && profile.lifetime_credits <= 0) {
            return new Response(
              JSON.stringify({
                error: 'No credits remaining',
                code: 'NO_CREDITS',
                message: 'You\'ve used all your lifetime credits. Purchase more to continue.'
              }),
              { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }
    }

    // Parse request body
    const body: GenerateRequest = await req.json();
    const { breed, color, background, style = 'realistic', themePrompt, isGuest, deviceFingerprint } = body;

    // Handle guest user
    if (!userId && isGuest) {
      if (!deviceFingerprint) {
        return new Response(
          JSON.stringify({ error: 'Device fingerprint required for guest generation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if guest has already used their free generation
      const { data: existingGuest } = await supabase
        .from('guest_generations')
        .select('id')
        .eq('device_fingerprint', deviceFingerprint)
        .single();

      if (existingGuest) {
        return new Response(
          JSON.stringify({
            error: 'Guest limit reached',
            code: 'GUEST_LIMIT_EXCEEDED',
            message: 'Sign up free to get 5 portraits per week!'
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Determine resolution based on tier
    const resolution = userTier === 'free' || (!userId && isGuest) ? 512 : 1024;
    const isPremium = userTier === 'premium' || userTier === 'lifetime';

    // Build the prompt
    const breedText = breed === 'random'
      ? 'adorable mixed breed dog'
      : breed.replace(/-/g, ' ');

    const colorText = color && isPremium ? ` with ${color} colored fur` : '';
    const backgroundText = background && isPremium
      ? background
      : 'a beautiful park with green grass and trees';

    const stylePrompts: Record<string, string> = {
      realistic: 'photorealistic, professional photography, natural lighting, sharp focus',
      cartoon: 'cartoon style, animated, colorful, Disney-Pixar inspired',
      watercolor: 'watercolor painting style, soft edges, artistic, dreamy',
      artistic: 'artistic portrait, painterly style, expressive brushstrokes',
    };

    // Build theme text if provided
    const themeText = themePrompt ? ` Theme: ${themePrompt}.` : '';

    const prompt = `A beautiful portrait of a ${breedText}${colorText}, ${stylePrompts[style]}. ` +
      `The dog has a friendly, happy expression with bright eyes. ` +
      `Background: ${backgroundText}.${themeText} ` +
      `High quality, detailed, centered composition.`;

    // Call Gemini 2.0 Flash Experimental for image generation
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${googleAiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            responseModalities: ["Text", "Image"]
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();

    // Extract image data from Gemini response
    const imagePart = geminiData.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData?.mimeType?.startsWith('image/')
    );
    const imageData = imagePart?.inlineData?.data;

    if (!imageData) {
      console.error('Gemini response:', JSON.stringify(geminiData));
      throw new Error('No image generated from Gemini');
    }

    // Upload to Supabase Storage
    const imageBuffer = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
    const filePath = userId ? `portraits/${userId}/${fileName}` : `portraits/guest/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('portraits')
      .upload(filePath, imageBuffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload image');
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('portraits')
      .getPublicUrl(filePath);

    // Generate random dog name
    const dogName = DOG_NAMES[Math.floor(Math.random() * DOG_NAMES.length)];

    // Save portrait to database
    const { data: portrait, error: dbError } = await supabase
      .from('portraits')
      .insert({
        user_id: userId,
        breed: breedText,
        color: isPremium ? color : null,
        background: isPremium ? background : null,
        style,
        name: dogName,
        image_url: publicUrl,
        prompt,
        resolution,
        is_premium: isPremium,
        is_guest: !userId && isGuest,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save portrait');
    }

    // Update user stats using atomic increment functions
    if (userId) {
      console.log(`Updating stats for user ${userId}, tier: ${userTier}`);

      if (userTier === 'free') {
        // Use atomic increment for weekly count
        const { data: incrementData, error: incrementError } = await supabase
          .rpc('increment_weekly_generations', { p_user_id: userId });

        if (incrementError) {
          console.error('Failed to increment weekly_generations:', incrementError);
        } else {
          const result = incrementData?.[0];
          console.log(`Incremented weekly_generations_used to ${result?.new_count}${result?.was_reset ? ' (reset applied)' : ''}`);
          // Update usageCount for accurate remaining calculation
          usageCount = result?.new_count || usageCount + 1;
        }

        // Increment total generations
        const { error: rpcError } = await supabase.rpc('increment_total_generations', { user_id: userId });
        if (rpcError) {
          console.error('Failed to increment total generations:', rpcError);
        }
      } else if (userTier === 'premium' || userTier === 'lifetime') {
        // Use atomic increment for daily count
        const { data: incrementData, error: incrementError } = await supabase
          .rpc('increment_daily_generations', { p_user_id: userId });

        if (incrementError) {
          console.error('Failed to increment daily_generations:', incrementError);
        } else {
          const result = incrementData?.[0];
          console.log(`Incremented daily_generations_used to ${result?.new_count}${result?.was_reset ? ' (reset applied)' : ''}`);
          // Update usageCount for accurate remaining calculation
          usageCount = result?.new_count || usageCount + 1;
        }

        // Increment total generations
        const { error: rpcError } = await supabase.rpc('increment_total_generations', { user_id: userId });
        if (rpcError) {
          console.error('Failed to increment total generations:', rpcError);
        }

        // Decrement lifetime credits if applicable
        if (userTier === 'lifetime') {
          const { error: creditError } = await supabase.rpc('decrement_lifetime_credits', { user_id: userId });
          if (creditError) {
            console.error('Failed to decrement lifetime credits:', creditError);
          }
        }
      }
    }

    // Track guest generation
    if (!userId && isGuest && deviceFingerprint) {
      await supabase
        .from('guest_generations')
        .insert({
          device_fingerprint: deviceFingerprint,
          portrait_id: portrait.id,
          ip_address: req.headers.get('x-forwarded-for') || 'unknown'
        });
    }

    // Calculate remaining generations
    // Note: usageCount is now the NEW count after the atomic increment
    let remainingGenerations: number | null = null;
    let limit: number | null = null;

    if (!userId && isGuest) {
      remainingGenerations = 0; // Guest used their only one
      limit = LIMITS.GUEST.total;
    } else if (userTier === 'free') {
      remainingGenerations = Math.max(0, LIMITS.FREE.weekly - usageCount);
      limit = LIMITS.FREE.weekly;
    } else if (userTier === 'premium' || userTier === 'lifetime') {
      const dailyLimit = userTier === 'lifetime' ? LIMITS.LIFETIME.daily : LIMITS.PREMIUM.daily;
      remainingGenerations = Math.max(0, dailyLimit - usageCount);
      limit = dailyLimit;
    }

    return new Response(
      JSON.stringify({
        portrait: {
          ...portrait,
          hasWatermark: !isPremium,
        },
        remainingGenerations,
        limit,
        usagePeriod,
        isDemo: false,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
