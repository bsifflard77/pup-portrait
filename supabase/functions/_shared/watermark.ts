// Server-side watermarking for free-tier images.
//
// The free tier (2026-05-26 offer) gives away 1 portrait + 5 backgrounds, all
// WATERMARKED, so people can taste the product without getting a clean file —
// removing the watermark is what a paid purchase buys. Because the mark is
// composited into the stored bytes here (not overlaid in the client), a free
// user cannot retrieve an unwatermarked copy.
//
// Uses ImageScript (pure WASM, Deno-native). The font is base64-embedded
// (watermark-font.ts) so there is no runtime network dependency.

import { Image, decode } from 'https://deno.land/x/imagescript@1.2.17/mod.ts';
import { WATERMARK_FONT_BASE64 } from './watermark-font.ts';

let fontBytes: Uint8Array | null = null;
function getFont(): Uint8Array {
  if (!fontBytes) {
    const bin = atob(WATERMARK_FONT_BASE64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    fontBytes = out;
  }
  return fontBytes;
}

/**
 * Composite a repeating diagonal "Pup Portrait" wordmark plus a solid corner
 * badge onto an image. Returns JPEG bytes.
 *
 * @param imageBytes encoded PNG/JPEG from a generation engine
 * @param quality    JPEG quality 1-100 (default 90)
 */
export async function applyWatermark(
  imageBytes: Uint8Array,
  quality = 90
): Promise<Uint8Array> {
  const decoded = await decode(imageBytes);
  // decode() returns Image for static images; guard for the GIF case.
  const img: Image = decoded instanceof Image ? decoded : (decoded as any).frames?.[0];
  if (!img) throw new Error('applyWatermark: could not decode image');

  const font = getFont();
  const dim = Math.min(img.width, img.height);

  // --- Repeating diagonal wordmark (hard to crop out) ---
  const tileScale = Math.max(18, Math.round(dim / 24));
  const tile = Image.renderText(
    font,
    tileScale,
    'PUP PORTRAIT   •   pupportrait.com',
    0xffffffff // opaque white; opacity applied below
  );
  tile.opacity(0.22);
  tile.rotate(-30); // rotate() mutates and grows the canvas to fit

  const stepX = Math.max(1, Math.round(tile.width * 0.85));
  const stepY = Math.max(1, Math.round(dim / 2.4));
  for (let y = -tile.height; y < img.height + tile.height; y += stepY) {
    for (let x = -tile.width; x < img.width + tile.width; x += stepX) {
      img.composite(tile, Math.round(x), Math.round(y));
    }
  }

  // --- Solid corner badge for clear branding ---
  const badgeScale = Math.max(14, Math.round(dim / 34));
  const badge = Image.renderText(font, badgeScale, '  Pup Portrait  ', 0xffffffff);
  badge.opacity(0.9);
  img.composite(badge, 16, img.height - badge.height - 16);

  return await img.encodeJPEG(quality);
}
