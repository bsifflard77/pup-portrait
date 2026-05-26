/**
 * Display configuration for the /upgrade screen tier cards.
 *
 * Kept separate from packages/shared/src/pricing.ts so that the marketing
 * copy + UI affordances (icons, "Most popular" badge) live next to the screen
 * that consumes them, not in the cross-platform pricing source of truth.
 */

import type { SubscriptionTier } from '@pup-portrait/shared';

export type TierCheckoutPlan = 'pack' | 'monthly' | 'yearly' | 'realism_yearly' | 'lifetime';

export interface TierDisplay {
  id: string;
  title: string;
  priceLabel: string;
  subtitle: string;
  bullets: string[];
  icon: string;
  cta: string;
  checkoutPlan: TierCheckoutPlan;
  matchesTier: SubscriptionTier;
  featured?: boolean;
}

export const TIERS_DISPLAY: TierDisplay[] = [
  {
    id: 'pack',
    title: 'Portrait Pack',
    priceLabel: '$9.99 once',
    subtitle: '12 portraits of YOUR dog, generated from one uploaded photo.',
    bullets: [
      '12 themed portraits',
      'Upload one photo',
      'Identity-preserved (your actual dog)',
      'HD 2K resolution, no watermark',
    ],
    icon: 'camera-outline',
    cta: 'Buy a Pack',
    checkoutPlan: 'pack',
    matchesTier: 'pack',
  },
  {
    id: 'monthly',
    title: 'Premium Monthly',
    priceLabel: '$5.99 / month',
    subtitle: 'Unlimited generation. Cancel any time.',
    bullets: [
      '15 portraits a day',
      'All 100+ breeds + themes',
      'HD 2K resolution, no watermark',
      'Upload your dog\'s photo — unlimited packs',
    ],
    icon: 'sparkles-outline',
    cta: 'Start Premium',
    checkoutPlan: 'monthly',
    matchesTier: 'premium',
    featured: true,
  },
  {
    id: 'yearly',
    title: 'Premium Annual',
    priceLabel: '$29.99 / year',
    subtitle: 'Same as Premium Monthly — save 58%.',
    bullets: [
      'Everything in Premium Monthly',
      '58% off vs paying monthly',
      'Billed once a year',
    ],
    icon: 'calendar-outline',
    cta: 'Save with Annual',
    checkoutPlan: 'yearly',
    matchesTier: 'premium',
  },
  {
    id: 'realism',
    title: 'Premium Annual + Realism',
    priceLabel: '$49.99 / year',
    subtitle: 'Adds Photoreal mode powered by Flux Kontext Pro.',
    bullets: [
      'Everything in Premium Annual',
      'Photoreal mode — ultra-realistic output',
      'Priority generation queue',
      'Per-portrait toggle (use only when you want it)',
    ],
    icon: 'flash-outline',
    cta: 'Go Photoreal',
    checkoutPlan: 'realism_yearly',
    matchesTier: 'realism',
  },
  {
    id: 'lifetime',
    title: 'Lifetime',
    priceLabel: '$49.99 once',
    subtitle: 'Premium features forever. No subscription.',
    bullets: [
      'Everything in Premium',
      'One payment, lifetime access',
      'Universal Purchase across iOS, Mac, Web',
    ],
    icon: 'infinite-outline',
    cta: 'Get Lifetime',
    checkoutPlan: 'lifetime',
    matchesTier: 'lifetime',
  },
];
