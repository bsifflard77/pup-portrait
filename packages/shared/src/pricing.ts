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
    price: 1999, // $19.99 in cents
    portraitCredits: 100,
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

export function canGenerate(tier: SubscriptionTier, dailyUsed: number, lifetimeCredits?: number): boolean {
  if (tier === 'premium') return true;
  if (tier === 'lifetime') return (lifetimeCredits ?? 0) > 0;
  return dailyUsed < PRICING.FREE.dailyLimit;
}

export function getRemainingGenerations(
  tier: SubscriptionTier,
  dailyUsed: number,
  lifetimeCredits?: number
): number | null {
  if (tier === 'premium') return null; // unlimited
  if (tier === 'lifetime') return lifetimeCredits ?? 0;
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
