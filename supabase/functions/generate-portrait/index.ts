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
  isGuest?: boolean;
  deviceFingerprint?: string;
}

const DOG_NAMES = [
  'Luna', 'Max', 'Bella', 'Charlie', 'Lucy', 'Cooper', 'Daisy', 'Buddy',
  'Sadie', 'Rocky', 'Molly', 'Tucker', 'Bailey', 'Duke', 'Lola', 'Bear',
  'Sophie', 'Zeus', 'Chloe', 'Bentley', 'Stella', 'Milo', 'Penny', 'Oscar',
];

const DAILY_FREE_LIMIT = 3;

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
    let dailyUsed = 0;

    // Check if authenticated user
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (user && !authError) {
        userId = user.id;

        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_tier, daily_generations_used, daily_reset_at, lifetime_credits')
          .eq('id', userId)
          .single();

        if (profile) {
          userTier = profile.subscription_tier;

          // Check if daily reset needed
          const today = new Date().toDateString();
          const resetDate = profile.daily_reset_at ? new Date(profile.daily_reset_at).toDateString() : null;

          if (resetDate !== today) {
            // Reset daily count
            await supabase
              .from('profiles')
              .update({ daily_generations_used: 0, daily_reset_at: new Date().toISOString() })
              .eq('id', userId);
            dailyUsed = 0;
          } else {
            dailyUsed = profile.daily_generations_used;
          }

          // Check limits for free tier
          if (userTier === 'free' && dailyUsed >= DAILY_FREE_LIMIT) {
            return new Response(
              JSON.stringify({
                error: 'Daily limit reached',
                code: 'DAILY_LIMIT_EXCEEDED',
                message: 'You\'ve used all 3 free portraits today. Upgrade to Premium for unlimited!'
              }),
              { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Check lifetime credits
          if (userTier === 'lifetime' && (profile.lifetime_credits ?? 0) <= 0) {
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
    const { breed, color, background, style = 'realistic', isGuest, deviceFingerprint } = body;

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
            message: 'Sign up free to get 3 portraits per day!'
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Determine resolution based on tier
    const resolution = userTier === 'free' ? 512 : 1024;
    const isPremium = userTier !== 'free';

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

    const prompt = `A beautiful portrait of a ${breedText}${colorText}, ${stylePrompts[style]}. ` +
      `The dog has a friendly, happy expression with bright eyes. ` +
      `Background: ${backgroundText}. ` +
      `High quality, detailed, centered composition.`;

    // Call Nano Banana (Google Gemini) API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${googleAiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            responseModalities: ['IMAGE', 'TEXT'],
            responseMimeType: 'image/png',
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

    // Extract image data from response
    const imageData = geminiData.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData?.mimeType?.startsWith('image/')
    )?.inlineData;

    if (!imageData) {
      throw new Error('No image generated from Gemini');
    }

    // Upload to Supabase Storage
    const imageBuffer = Uint8Array.from(atob(imageData.data), c => c.charCodeAt(0));
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

    // Update user stats
    if (userId) {
      if (userTier === 'lifetime') {
        await supabase
          .from('profiles')
          .update({
            total_generations: dailyUsed + 1,
            lifetime_credits: supabase.rpc('decrement_lifetime_credits', { user_id: userId })
          })
          .eq('id', userId);
      } else {
        await supabase
          .from('profiles')
          .update({
            daily_generations_used: dailyUsed + 1,
            total_generations: dailyUsed + 1
          })
          .eq('id', userId);
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
    let remainingGenerations: number | null = null;
    if (userTier === 'free') {
      remainingGenerations = DAILY_FREE_LIMIT - (dailyUsed + 1);
    } else if (userTier === 'lifetime') {
      // Would need to fetch updated credits
      remainingGenerations = 99; // Placeholder
    }
    // Premium users get null (unlimited)

    return new Response(
      JSON.stringify({
        portrait: {
          ...portrait,
          hasWatermark: userTier === 'free',
        },
        remainingGenerations,
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
