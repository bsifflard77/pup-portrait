#!/usr/bin/env node
/**
 * Generate the 12 marketing sample portraits for the WebLanding gallery.
 *
 * Flow:
 *   1. Generate ONE hero golden retriever via Nano Banana 2 (no reference).
 *   2. Use that hero photo as the identity reference for the 12 PACK_THEMES.
 *   3. Upload each result to Supabase Storage `portraits/marketing/<id>.png`
 *      and print the public URLs as a JS array ready to paste into
 *      apps/mobile/components/WebLanding.tsx.
 *
 * Idempotent: re-running overwrites the existing marketing folder.
 *
 * Required env (or hard-coded below for one-shot use):
 *   GOOGLE_AI_API_KEY
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTDIR = path.join(__dirname, '..', 'marketing-samples');
fs.mkdirSync(OUTDIR, { recursive: true });

const GOOGLE_AI_API_KEY =
  process.env.GOOGLE_AI_API_KEY || 'AIzaSyDu8JMjSFjT0JVvTp9a2KQQDWNQ_kFfHIo';
const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://rmalsvaoomhrgflioiqx.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtYWxzdmFvb21ocmdmbGlvaXF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDk3MTIxNywiZXhwIjoyMDgwNTQ3MjE3fQ.5yVk9TVwglblw12Yc3c53gjE77FJvWK0mbwFGUGv29c';

const NB2_MODEL = 'gemini-3.1-flash-image-preview';

// Mirror of PACK_THEMES in packages/shared/src/pricing.ts (kept inline so the
// script is dependency-free and can be run from anywhere).
const PACK_THEMES = [
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

const HERO_PROMPT =
  'A beautiful photorealistic portrait of a happy golden retriever, ' +
  'professional studio photography, soft natural lighting, sharp focus on the eyes, ' +
  'warm friendly expression, slight head tilt, neutral cream background. ' +
  'High quality, detailed fur texture, centered composition.';

const IDENTITY_PROMPT_PREFIX =
  'Generate a portrait that preserves the EXACT identity of the dog in the reference image — ' +
  'same breed (golden retriever), same fur color and markings, same facial features, same eye color. ' +
  'The dog should be clearly recognizable as the same animal as in the reference. ';
const IDENTITY_PROMPT_SUFFIX =
  ' Keep the dog as the primary subject, centered, taking up roughly 60% of the frame. ' +
  'High quality, professional composition.';

async function generateImage({ prompt, resolution = '2K', referenceBase64, referenceMime }) {
  const parts = [{ text: prompt }];
  if (referenceBase64) {
    parts.push({
      inlineData: {
        mimeType: referenceMime || 'image/png',
        data: referenceBase64,
      },
    });
  }
  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: { aspectRatio: '1:1' },
    },
  };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${NB2_MODEL}:generateContent?key=${GOOGLE_AI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini ${res.status}: ${t.slice(0, 400)}`);
  }
  const json = await res.json();
  const part = json.candidates?.[0]?.content?.parts?.find(
    (p) => p.inlineData?.mimeType?.startsWith('image/')
  );
  if (!part) {
    console.error('Unexpected response:', JSON.stringify(json).slice(0, 600));
    throw new Error('No image in response');
  }
  return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png' };
}

async function uploadToSupabase(filename, bytes, mimeType) {
  const url = `${SUPABASE_URL}/storage/v1/object/portraits/marketing/${filename}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': mimeType,
      'x-upsert': 'true',
    },
    body: bytes,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Supabase upload ${res.status}: ${t}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/portraits/marketing/${filename}`;
}

(async () => {
  console.log('[1/14] Generating hero golden retriever...');
  const hero = await generateImage({ prompt: HERO_PROMPT, resolution: '2K' });
  const heroBytes = Buffer.from(hero.base64, 'base64');
  fs.writeFileSync(path.join(OUTDIR, '00-hero.png'), heroBytes);
  const heroExt = hero.mimeType === 'image/jpeg' ? 'jpg' : 'png';
  const heroUrl = await uploadToSupabase(`00-hero.${heroExt}`, heroBytes, hero.mimeType);
  console.log('  hero ->', heroUrl);

  const results = [];
  for (let i = 0; i < PACK_THEMES.length; i++) {
    const t = PACK_THEMES[i];
    const stepNo = i + 2;
    console.log(`[${stepNo}/14] ${t.label}...`);
    const prompt = `${IDENTITY_PROMPT_PREFIX}Style: ${t.promptStyle}.${IDENTITY_PROMPT_SUFFIX}`;
    let attempt = 0;
    let lastErr;
    while (attempt < 3) {
      try {
        const img = await generateImage({
          prompt,
          resolution: '2K',
          referenceBase64: hero.base64,
          referenceMime: hero.mimeType,
        });
        const bytes = Buffer.from(img.base64, 'base64');
        const ext = img.mimeType === 'image/jpeg' ? 'jpg' : 'png';
        fs.writeFileSync(path.join(OUTDIR, `${String(i + 1).padStart(2, '0')}-${t.id}.${ext}`), bytes);
        const publicUrl = await uploadToSupabase(`${t.id}.${ext}`, bytes, img.mimeType);
        results.push({ id: t.id, label: t.label, url: publicUrl });
        console.log('  ok ->', publicUrl);
        break;
      } catch (e) {
        attempt++;
        lastErr = e;
        console.warn(`  retry ${attempt}/3:`, e.message.slice(0, 200));
        await new Promise((r) => setTimeout(r, 2000 * attempt));
      }
    }
    if (results.length <= i) {
      console.error(`  FAILED ${t.id}:`, lastErr?.message);
      results.push({ id: t.id, label: t.label, url: null, error: lastErr?.message });
    }
  }

  const summary = path.join(OUTDIR, 'urls.json');
  fs.writeFileSync(summary, JSON.stringify({ hero: heroUrl, samples: results }, null, 2));
  console.log('\nDone. URLs written to', summary);
  console.log('\nPaste this into WebLanding.tsx SAMPLE_PORTRAITS:');
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    console.log(`  { id: ${i + 1}, label: ${JSON.stringify(r.label)}, imageUrl: ${JSON.stringify(r.url)} },`);
  }
})().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
