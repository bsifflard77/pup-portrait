// Supabase Edge Function: Generate Portrait Pack
//
// Created 2026-05-19 as the headline feature of the relaunch sprint —
// "Send Your Pup on an Adventure". User uploads one photo, this function
// generates 12 themed portraits that preserve the dog's identity across
// every scene via Nano Banana 2 (Gemini 3.1 Flash Image).
//
// Pricing/tier gating:
//   * Free / guest tiers cannot call this endpoint at all (paywall in UI).
//   * `pack` tier — needs 12 pack_credits (one full pack); consumes them all.
//   * `premium` / `realism` / `lifetime` — unlimited, but each portrait still
//     counts against the user's daily limit so it can't be abused.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import {
  generateWithNanoBanana2,
  buildIdentityPreservingPrompt,
  base64ToBytes,
  bytesToBase64,
} from '../_shared/image-gen.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 12 pack themes — kept in sync with PACK_THEMES in packages/shared/src/pricing.ts.
// (Duplicated here so the Edge Function doesn't need to import a TS module —
// Deno + the monorepo's TS setup don't share a build root.)
const PACK_THEMES: { id: string; label: string; promptStyle: string }[] = [
  { id: 'watercolor-sunrise', label: 'Watercolor Sunrise', promptStyle: 'soft watercolor painting, golden hour sunrise lighting, dreamy atmosphere, gentle brushstrokes' },
  { id: 'renaissance-noble', label: 'Renaissance Noble', promptStyle: 'oil painting in the style of a 16th century Dutch master, regal pose, dark velvet background, dramatic chiaroscuro lighting' },
  { id: 'pixar-sidekick', label: 'Pixar Sidekick', promptStyle: '3D animated character in the style of Pixar, expressive eyes, soft warm lighting, slight cartoon stylization' },
  { id: 'astronaut-moon', label: 'Astronaut on the Moon', promptStyle: 'wearing a detailed astronaut suit, standing on the lunar surface, Earth in the background, photorealistic' },
  { id: 'pop-art', label: 'Pop Art', promptStyle: 'Andy Warhol style pop art, bold flat colors, halftone dots, 4-color quadrant composition' },
  { id: 'street-graffiti', label: 'Street Graffiti', promptStyle: 'spray-painted graffiti mural on a brick wall, vibrant urban art style, drips and texture' },
  { id: 'pencil-sketch', label: 'Pencil Sketch', promptStyle: 'detailed graphite pencil sketch on cream paper, crosshatching shading, artist signature in the corner' },
  { id: 'cyberpunk-neon', label: 'Cyberpunk Neon', promptStyle: 'cyberpunk style with neon city background, rain-slicked streets, pink and cyan rim lighting, futuristic' },
  { id: 'studio-ghibli', label: 'Studio Ghibli', promptStyle: 'anime watercolor in the style of Studio Ghibli, soft pastoral background, dreamy and warm' },
  { id: 'royal-portrait', label: 'Royal Portrait', promptStyle: 'formal royal portrait in regal attire, crown or medal, ornate gold frame, palace background' },
  { id: 'holiday-festive', label: 'Holiday Festive', promptStyle: 'cozy Christmas scene by a fireplace, wearing a red sweater, twinkling lights, snowy window' },
  { id: 'beach-vacation', label: 'Beach Vacation', promptStyle: 'on a tropical beach, wearing sunglasses, palm trees, turquoise water, golden sand, sunny day' },
];

const ELIGIBLE_TIERS = new Set(['pack', 'premium', 'realism', 'lifetime']);

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'auth_required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (!user || authError) {
      return new Response(JSON.stringify({ error: 'auth_invalid' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => ({} as any));
    const referenceImagePath: string | undefined = body.referenceImagePath;
    if (!referenceImagePath || typeof referenceImagePath !== 'string') {
      return new Response(JSON.stringify({ error: 'bad_request', message: 'referenceImagePath is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Confirm tier eligibility + remaining pack credits.
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('subscription_tier, pack_credits')
      .eq('id', user.id)
      .single();
    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: 'profile_missing' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const tier: string = profile.subscription_tier;
    if (!ELIGIBLE_TIERS.has(tier)) {
      return new Response(
        JSON.stringify({ error: 'upgrade_required', message: 'Photo upload Packs are available with any paid tier. Buy a Pack ($9.99) or upgrade to Premium.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (tier === 'pack' && (profile.pack_credits ?? 0) < PACK_THEMES.length) {
      return new Response(
        JSON.stringify({ error: 'insufficient_credits', message: `You have ${profile.pack_credits ?? 0} portraits left — not enough for a full ${PACK_THEMES.length}-portrait pack. Buy another pack to continue.` }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the reference image belongs to this user (path must start with their UID)
    if (!referenceImagePath.startsWith(`${user.id}/`)) {
      return new Response(JSON.stringify({ error: 'forbidden', message: 'Reference image does not belong to this user' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Download the reference image once and reuse the base64 across all 12 generations.
    const { data: imageBlob, error: dlErr } = await supabase.storage
      .from('pet-uploads')
      .download(referenceImagePath);
    if (dlErr || !imageBlob) {
      return new Response(
        JSON.stringify({ error: 'reference_not_found', message: 'Reference image not found or expired (uploads are auto-deleted after 24 hours).' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const referenceImageBase64 = bytesToBase64(new Uint8Array(await imageBlob.arrayBuffer()));
    const referenceImageMimeType = imageBlob.type || 'image/jpeg';

    const portraits: any[] = [];
    const errors: { themeId: string; message: string }[] = [];
    const isPaidSubscriber = tier === 'premium' || tier === 'realism' || tier === 'lifetime';

    for (const theme of PACK_THEMES) {
      try {
        const prompt = buildIdentityPreservingPrompt(theme.promptStyle);
        const result = await generateWithNanoBanana2({
          prompt,
          resolution: 2048,
          referenceImageBase64,
          referenceImageMimeType,
        });

        const buf = base64ToBytes(result.imageBase64);
        const ext = result.mimeType === 'image/jpeg' ? 'jpg' : 'png';
        const fileName = `${Date.now()}-${theme.id}.${ext}`;
        const filePath = `portraits/${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('portraits')
          .upload(filePath, buf, { contentType: result.mimeType, upsert: false });
        if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage.from('portraits').getPublicUrl(filePath);

        const { data: portrait, error: dbErr } = await supabase
          .from('portraits')
          .insert({
            user_id: user.id,
            breed: 'your dog',
            style: 'artistic',
            name: theme.label,
            image_url: publicUrl,
            prompt,
            resolution: 2048,
            is_premium: true,
            is_guest: false,
            engine: 'nano-banana-2',
            from_photo_upload: true,
          })
          .select()
          .single();
        if (dbErr) throw new Error(`DB insert failed: ${dbErr.message}`);

        portraits.push(portrait);

        console.log(JSON.stringify({
          event: 'pack_portrait_generated',
          userId: user.id,
          themeId: theme.id,
          latencyMs: result.latencyMs,
        }));
      } catch (themeErr) {
        const msg = themeErr instanceof Error ? themeErr.message : String(themeErr);
        console.error(`Pack theme ${theme.id} failed:`, msg);
        errors.push({ themeId: theme.id, message: msg });
      }
    }

    // Consume pack credits proportional to successful generations.
    if (tier === 'pack' && portraits.length > 0) {
      await supabase.rpc('decrement_pack_credits', { p_user_id: user.id, p_amount: portraits.length });
    }

    // For premium/realism/lifetime, count each portrait against their daily cap.
    if (isPaidSubscriber && portraits.length > 0) {
      for (let i = 0; i < portraits.length; i++) {
        await supabase.rpc('increment_daily_generations', { p_user_id: user.id });
      }
    }
    if (portraits.length > 0) {
      await supabase.rpc('increment_total_generations_by', { user_id: user.id, p_amount: portraits.length });
    }

    // Refresh remaining pack credits for the response.
    const { data: refreshed } = await supabase
      .from('profiles')
      .select('pack_credits')
      .eq('id', user.id)
      .single();

    return new Response(
      JSON.stringify({
        portraits,
        remainingPackCredits: tier === 'pack' ? refreshed?.pack_credits ?? 0 : null,
        errors,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('generate-pack fatal error:', err);
    return new Response(
      JSON.stringify({
        error: 'generation_failed',
        message: err instanceof Error ? err.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
