import type { SubscriptionTier, PlanType } from './types';

// Pricing configuration
export const PRICING = {
  FREE: {
    dailyLimit: 3,
    resolution: 512,
    hasWatermark: true,
    processingPriority: 'standard' as const,
    customColors: false,
    customBackgrounds: false,
  },
  PREMIUM: {
    monthlyPrice: 799, // $7.99 in cents
    yearlyPrice: 5999, // $59.99 in cents (25% savings)
    dailyLimit: null, // unlimited
    resolution: 1024,
    hasWatermark: false,
    processingPriority: 'priority' as const,
    customColors: true,
    customBackgrounds: true,
  },
  LIFETIME: {
    price: 7999, // $79.99 in cents
    portraitCredits: null, // unlimited
    resolution: 1024,
    hasWatermark: false,
    processingPriority: 'priority' as const,
    customColors: true,
    customBackgrounds: true,
  },
} as const;

// Stripe price IDs (to be configured in Stripe Dashboard)
export const STRIPE_PRICES = {
  PREMIUM_MONTHLY: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || 'price_premium_monthly',
  PREMIUM_YEARLY: process.env.STRIPE_PRICE_PREMIUM_YEARLY || 'price_premium_yearly',
  LIFETIME: process.env.STRIPE_PRICE_LIFETIME || 'price_lifetime',
} as const;

// Helper functions
export function getTierConfig(tier: SubscriptionTier) {
  switch (tier) {
    case 'premium':
      return PRICING.PREMIUM;
    case 'lifetime':
      return PRICING.LIFETIME;
    default:
      return PRICING.FREE;
  }
}

export function canGenerate(tier: SubscriptionTier, dailyUsed: number): boolean {
  if (tier === 'premium' || tier === 'lifetime') return true;
  return dailyUsed < PRICING.FREE.dailyLimit;
}

export function getRemainingGenerations(
  tier: SubscriptionTier,
  dailyUsed: number
): number | null {
  if (tier === 'premium' || tier === 'lifetime') return null; // unlimited
  return Math.max(0, PRICING.FREE.dailyLimit - dailyUsed);
}

export function getResolution(tier: SubscriptionTier): number {
  return getTierConfig(tier).resolution;
}

export function hasWatermark(tier: SubscriptionTier): boolean {
  return getTierConfig(tier).hasWatermark;
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function calculateYearlySavings(): { amount: number; percentage: number } {
  const monthlyAnnual = PRICING.PREMIUM.monthlyPrice * 12;
  const yearly = PRICING.PREMIUM.yearlyPrice;
  const savings = monthlyAnnual - yearly;
  const percentage = Math.round((savings / monthlyAnnual) * 100);
  return { amount: savings, percentage };
}

// Colors available for premium users
export const PREMIUM_COLORS = [
  { id: 'natural', name: 'Natural Color', value: '' },
  { id: 'golden', name: 'Golden', value: 'golden' },
  { id: 'brown', name: 'Brown', value: 'brown' },
  { id: 'black', name: 'Black', value: 'black' },
  { id: 'white', name: 'White', value: 'white' },
  { id: 'cream', name: 'Cream', value: 'cream' },
  { id: 'red', name: 'Red', value: 'red' },
  { id: 'silver', name: 'Silver', value: 'silver' },
  { id: 'tricolor', name: 'Tricolor', value: 'tricolor' },
  { id: 'merle', name: 'Merle', value: 'merle' },
] as const;

// Backgrounds available for premium users
export const PREMIUM_BACKGROUNDS = [
  { id: 'default', name: 'Default Park', value: '' },
  { id: 'beach', name: 'Beach Scene', value: 'a sunny beach with waves and sand' },
  { id: 'mountain', name: 'Mountain Snow', value: 'a snowy mountain landscape' },
  { id: 'garden', name: 'Flower Garden', value: 'a colorful flower garden in bloom' },
  { id: 'forest', name: 'Forest', value: 'a forest with tall trees and dappled sunlight' },
  { id: 'city-park', name: 'City Park', value: 'a modern city park with benches and trees' },
  { id: 'meadow', name: 'Meadow', value: 'a countryside meadow with wildflowers' },
  { id: 'living-room', name: 'Cozy Living Room', value: 'a cozy living room with a fireplace' },
  { id: 'studio', name: 'Photo Studio', value: 'a professional photo studio with soft lighting' },
  { id: 'autumn', name: 'Autumn Leaves', value: 'an autumn scene with colorful fallen leaves' },
] as const;

// Aspect ratios for different social platforms
export type AspectRatioId = 'square' | 'portrait' | 'story' | 'landscape';

export interface AspectRatio {
  id: AspectRatioId;
  name: string;
  ratio: string;
  width: number;
  height: number;
  icon: string;
  description: string;
  isPremium: boolean;
}

export const ASPECT_RATIOS: AspectRatio[] = [
  {
    id: 'square',
    name: 'Square',
    ratio: '1:1',
    width: 1,
    height: 1,
    icon: 'square-outline',
    description: 'Instagram Feed',
    isPremium: false
  },
  {
    id: 'portrait',
    name: 'Portrait',
    ratio: '4:5',
    width: 4,
    height: 5,
    icon: 'phone-portrait-outline',
    description: 'Instagram/Facebook',
    isPremium: true
  },
  {
    id: 'story',
    name: 'Story',
    ratio: '9:16',
    width: 9,
    height: 16,
    icon: 'tablet-portrait-outline',
    description: 'Stories/TikTok',
    isPremium: true
  },
  {
    id: 'landscape',
    name: 'Landscape',
    ratio: '16:9',
    width: 16,
    height: 9,
    icon: 'tablet-landscape-outline',
    description: 'Twitter/YouTube',
    isPremium: true
  },
] as const;

export const FREE_ASPECT_RATIOS = ASPECT_RATIOS.filter(r => !r.isPremium);
export const PREMIUM_ASPECT_RATIOS = ASPECT_RATIOS.filter(r => r.isPremium);

// Social sharing platforms
export interface SocialPlatform {
  id: string;
  name: string;
  icon: string;
  color: string;
  shareUrl: (imageUrl: string, text: string) => string;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'logo-instagram',
    color: '#E4405F',
    shareUrl: () => '', // Instagram requires app-based sharing
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'logo-facebook',
    color: '#1877F2',
    shareUrl: (imageUrl, text) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(imageUrl)}&quote=${encodeURIComponent(text)}`,
  },
  {
    id: 'twitter',
    name: 'X',
    icon: 'logo-twitter',
    color: '#000000',
    shareUrl: (imageUrl, text) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(imageUrl)}`,
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    icon: 'logo-pinterest',
    color: '#BD081C',
    shareUrl: (imageUrl, text) =>
      `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent(text)}`,
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'logo-tiktok',
    color: '#000000',
    shareUrl: () => '', // TikTok requires app-based sharing
  },
] as const;

// Branding text for free tier shares
export const SHARE_BRANDING = {
  watermarkText: 'Created with Pup Portrait',
  shareText: (breed: string) => `Check out this adorable ${breed} portrait I created with Pup Portrait! 🐕`,
  shareTextWithLink: (breed: string) => `Check out this adorable ${breed} portrait I created with Pup Portrait! 🐕\n\nCreate yours at pupportrait.com`,
  hashtags: '#PupPortrait #AIArt #DogPortrait #Dogs',
};

// Feature availability by tier
export const FEATURES = {
  FREE: {
    dailyGenerations: 3,
    aspectRatios: ['square'] as AspectRatioId[],
    resolution: 512,
    watermark: true,
    brandedSharing: true, // Must include "Created by Pup Portrait"
    hdDownload: false,
    customColors: false,
    customBackgrounds: false,
    premiumBreeds: false,
    saveToGallery: true,
  },
  PREMIUM: {
    dailyGenerations: null, // unlimited
    aspectRatios: ['square', 'portrait', 'story', 'landscape'] as AspectRatioId[],
    resolution: 1024,
    watermark: false,
    brandedSharing: false, // Can opt out
    hdDownload: true,
    customColors: true,
    customBackgrounds: true,
    premiumBreeds: true,
    saveToGallery: true,
  },
} as const;

export function canUseAspectRatio(tier: SubscriptionTier, ratioId: AspectRatioId): boolean {
  if (tier === 'premium' || tier === 'lifetime') return true;
  return FEATURES.FREE.aspectRatios.includes(ratioId);
}

export function requiresBrandedSharing(tier: SubscriptionTier): boolean {
  if (tier === 'premium' || tier === 'lifetime') return false;
  return true;
}
