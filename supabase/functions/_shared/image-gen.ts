// Shared image generation helpers for Supabase Edge Functions.
//
// Two engines are supported as of the 2026-05-19 relaunch:
//   * Nano Banana 2 (Gemini 3.1 Flash Image) — default for all generations.
//     Best-in-class identity preservation for the photo-upload pack feature.
//   * Flux Kontext Pro (via fal.ai) — Realism-tier upsell. Higher quality,
//     slower, more expensive.
//
// Both helpers return a base64-encoded JPEG/PNG and a latency measurement so
// callers can log per-generation metrics.

export type GenerationEngine = 'nano-banana-2' | 'flux-kontext-pro';

export interface GenerationInput {
  prompt: string;
  resolution: 1024 | 2048;
  // Optional reference image — when supplied, both engines run in image-to-image
  // mode with identity preservation.
  referenceImageBase64?: string;
  // MIME type of the reference image. Defaults to image/jpeg.
  referenceImageMimeType?: string;
}

export interface GenerationResult {
  imageBase64: string;
  mimeType: string;
  latencyMs: number;
  engine: GenerationEngine;
}

const NB2_MODEL = Deno.env.get('GOOGLE_AI_MODEL_DEFAULT') ?? 'gemini-3.1-flash-image-preview';
const FAL_REALISM_MODEL = Deno.env.get('FAL_AI_MODEL_REALISM') ?? 'fal-ai/flux-kontext-pro';

/**
 * Generate an image via Nano Banana 2 (Gemini 3.1 Flash Image).
 * Free/guest tiers should pass resolution=1024; paid tiers 2048.
 */
export async function generateWithNanoBanana2(input: GenerationInput): Promise<GenerationResult> {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY is not configured');

  const start = Date.now();

  const parts: any[] = [{ text: input.prompt }];
  if (input.referenceImageBase64) {
    parts.push({
      inlineData: {
        mimeType: input.referenceImageMimeType ?? 'image/jpeg',
        data: input.referenceImageBase64,
      },
    });
  }

  // 2026-05-20: the Gemini Generative Language API rejects `imageConfig.resolution`
  // (only `aspectRatio` is currently accepted). Output is ~1K by default — that's
  // fine for free/guest, and acceptable for paid until Google exposes the field
  // again. Resolution is still threaded in for downstream sizing decisions.
  const requestBody = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: {
        aspectRatio: '1:1',
      },
    },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${NB2_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    }
  );

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Nano Banana 2 API error ${res.status}: ${errBody}`);
  }

  const json = await res.json();
  const part = json.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
  const imageBase64 = part?.inlineData?.data;
  const mimeType = part?.inlineData?.mimeType ?? 'image/png';
  if (!imageBase64) {
    console.error('Nano Banana 2 response shape:', JSON.stringify(json));
    throw new Error('Nano Banana 2 returned no image data');
  }

  return {
    imageBase64,
    mimeType,
    latencyMs: Date.now() - start,
    engine: 'nano-banana-2',
  };
}

/**
 * Generate an image via Flux Kontext Pro on fal.ai.
 * Used for the Premium Annual + Realism tier's photoreal toggle.
 *
 * fal.ai exposes an async queue API — we submit, poll, and fetch the result.
 * Typical latency: 15–30 seconds. We cap polling at 90 seconds.
 */
export async function generateWithFluxKontextPro(input: GenerationInput): Promise<GenerationResult> {
  const apiKey = Deno.env.get('FAL_AI_API_KEY');
  if (!apiKey) throw new Error('FAL_AI_API_KEY is not configured');

  const start = Date.now();

  const submitBody: any = {
    prompt: input.prompt,
    output_format: 'jpeg',
    guidance_scale: 3.5,
    num_inference_steps: 28,
    safety_tolerance: '2',
    image_size: input.resolution === 2048 ? 'square_hd' : 'square',
  };
  if (input.referenceImageBase64) {
    submitBody.image_url = `data:${input.referenceImageMimeType ?? 'image/jpeg'};base64,${input.referenceImageBase64}`;
  }

  const submitRes = await fetch(`https://queue.fal.run/${FAL_REALISM_MODEL}`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(submitBody),
  });

  if (!submitRes.ok) {
    const errBody = await submitRes.text();
    throw new Error(`Flux Kontext Pro submit failed ${submitRes.status}: ${errBody}`);
  }

  const { request_id } = await submitRes.json();
  if (!request_id) throw new Error('Flux Kontext Pro returned no request_id');

  // Poll for completion. 45 iterations * 2 seconds = 90 second ceiling.
  for (let i = 0; i < 45; i++) {
    await new Promise((r) => setTimeout(r, 2000));

    const statusRes = await fetch(`https://queue.fal.run/${FAL_REALISM_MODEL}/requests/${request_id}`, {
      headers: { Authorization: `Key ${apiKey}` },
    });
    if (!statusRes.ok) continue;

    const status = await statusRes.json();
    if (status.status === 'COMPLETED' || (Array.isArray(status.images) && status.images.length > 0)) {
      const imageUrl = status.images?.[0]?.url;
      if (!imageUrl) throw new Error('Flux Kontext Pro completed but returned no image URL');

      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error(`Failed to fetch Flux Kontext Pro image: ${imgRes.status}`);

      const buffer = new Uint8Array(await imgRes.arrayBuffer());
      let imageBase64 = '';
      // Chunked encode to avoid call-stack blow-ups on large buffers.
      const chunkSize = 0x8000;
      for (let j = 0; j < buffer.length; j += chunkSize) {
        imageBase64 += String.fromCharCode(...buffer.subarray(j, j + chunkSize));
      }
      imageBase64 = btoa(imageBase64);

      return {
        imageBase64,
        mimeType: 'image/jpeg',
        latencyMs: Date.now() - start,
        engine: 'flux-kontext-pro',
      };
    }
    if (status.status === 'FAILED' || status.status === 'CANCELED') {
      throw new Error(`Flux Kontext Pro generation failed: ${JSON.stringify(status)}`);
    }
  }

  throw new Error('Flux Kontext Pro timed out after 90 seconds');
}

/**
 * Build the identity-preservation prompt used when a reference image is
 * provided. Lead with identity, be specific about what to preserve, end with
 * composition guidance — Nano Banana 2 docs note these three rules.
 */
export function buildIdentityPreservingPrompt(stylePrompt: string): string {
  return (
    'Generate a portrait that preserves the EXACT identity of the dog in the ' +
    'reference image — same breed, same fur color and markings, same facial ' +
    'features, same eye color. The dog should be clearly recognizable as the ' +
    'same animal as in the reference. ' +
    `Style: ${stylePrompt}. ` +
    'Keep the dog as the primary subject, centered, taking up roughly 60% of ' +
    'the frame. High quality, professional composition.'
  );
}

/**
 * Decode a base64 string to a Uint8Array suitable for Supabase Storage uploads.
 */
export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Encode a Uint8Array to base64 in chunks (avoids stack overflow on large
 * buffers). Used when we need to feed an uploaded reference image back to a
 * generation engine.
 */
export function bytesToBase64(bytes: Uint8Array): string {
  let s = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(s);
}
