import type { SubscriptionTier, PlanType } from './types';

// Pricing configuration
export const PRICING = {
  GUEST: {
    totalLimit: 1, // 1 trial portrait ever
    resolution: 512,
    hasWatermark: true,
    processingPriority: 'standard' as const,
    customColors: false,
    customBackgrounds: false,
  },
  FREE: {
    weeklyLimit: 5, // 5 per week
    resolution: 512,
    hasWatermark: true,
    processingPriority: 'standard' as const,
    customColors: false,
    customBackgrounds: false,
  },
  PREMIUM: {
    monthlyPrice: 999, // $9.99 in cents
    yearlyPrice: 7999, // $79.99 in cents (~33% savings)
    dailyLimit: 15, // 15 per day ("unlimited" marketing, but capped to prevent abuse)
    resolution: 1024,
    hasWatermark: false,
    processingPriority: 'priority' as const,
    customColors: true,
    customBackgrounds: true,
  },
  LIFETIME: {
    price: 2999, // $29.99 in cents
    dailyLimit: 15, // Same daily cap as premium
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

export function canGenerate(
  tier: SubscriptionTier,
  usageCount: number,
  isGuest: boolean = false
): boolean {
  if (isGuest) {
    return usageCount < PRICING.GUEST.totalLimit;
  }
  if (tier === 'premium' || tier === 'lifetime') {
    return usageCount < PRICING.PREMIUM.dailyLimit;
  }
  // Free tier: 5/week
  return usageCount < PRICING.FREE.weeklyLimit;
}

export function getRemainingGenerations(
  tier: SubscriptionTier,
  usageCount: number,
  isGuest: boolean = false
): number {
  if (isGuest) {
    return Math.max(0, PRICING.GUEST.totalLimit - usageCount);
  }
  if (tier === 'premium' || tier === 'lifetime') {
    return Math.max(0, PRICING.PREMIUM.dailyLimit - usageCount);
  }
  // Free tier: 5/week
  return Math.max(0, PRICING.FREE.weeklyLimit - usageCount);
}

export function getUsagePeriodLabel(tier: SubscriptionTier, isGuest: boolean = false): string {
  if (isGuest) return 'trial';
  if (tier === 'premium' || tier === 'lifetime') return 'today';
  return 'this week';
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
  watermarkUrl: 'pupportrait.com',
  shareText: (breed: string) => `Check out this adorable ${breed} portrait I created with Pup Portrait! 🐕`,
  shareTextWithLink: (breed: string) => `Check out this adorable ${breed} portrait I created with Pup Portrait! 🐕\n\nCreate yours free at pupportrait.com`,
  hashtags: '#PupPortrait #AIArt #DogPortrait #Dogs',
  // QR code URL for watermark (points to app download/website)
  qrCodeUrl: 'https://pupportrait.com?ref=share',
};

// Feature availability by tier
export const FEATURES = {
  GUEST: {
    totalGenerations: 1, // 1 trial portrait ever
    aspectRatios: ['square'] as AspectRatioId[],
    resolution: 512,
    watermark: true, // Watermark with "Created with Pup Portrait" + URL
    brandedSharing: true, // Must include branding in share text
    socialSharing: true, // Can share to social media (with branding)
    hdDownload: false,
    customColors: false,
    customBackgrounds: false,
    premiumBreeds: false,
    premiumThemes: false, // Only Seasons + Holidays
    breedSearch: false, // Dropdown only
    saveToGallery: false,
  },
  FREE: {
    weeklyGenerations: 5, // 5 per week
    aspectRatios: ['square'] as AspectRatioId[],
    resolution: 512,
    watermark: true, // Watermark with "Created with Pup Portrait" + URL
    brandedSharing: true, // Must include branding in share text
    socialSharing: true, // Can share to social media (with branding)
    hdDownload: false,
    customColors: false,
    customBackgrounds: false,
    premiumBreeds: false,
    premiumThemes: false, // Only Seasons + Holidays
    breedSearch: false, // Dropdown only
    saveToGallery: true,
  },
  PREMIUM: {
    dailyGenerations: 15, // 15 per day (marketed as "unlimited")
    aspectRatios: ['square', 'portrait', 'story', 'landscape'] as AspectRatioId[],
    resolution: 1024,
    watermark: false, // No watermark on images
    brandedSharing: false, // Can opt out of branding in share text
    socialSharing: true, // Can share to social media (clean, no forced branding)
    hdDownload: true,
    customColors: true,
    customBackgrounds: true,
    premiumBreeds: true, // All 100 breeds
    premiumThemes: true, // All themes including Events
    breedSearch: true, // Type-to-search
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

// ============================================
// SEASONS, HOLIDAYS & EVENTS (Free for all users)
// ============================================

export type ThemeCategory = 'season' | 'holiday' | 'event';

export interface Theme {
  id: string;
  name: string;
  category: ThemeCategory;
  icon: string;
  prompt: string; // AI prompt modifier
  available: boolean; // Whether currently selectable (for seasonal themes)
  isPremium: boolean; // Whether this theme requires premium subscription
  startMonth?: number; // 1-12, for auto-availability
  endMonth?: number; // 1-12, for auto-availability
  startDay?: number; // 1-31, optional day precision
  endDay?: number; // 1-31, optional day precision
}

// Seasons - FREE for all users
export const SEASONS: Theme[] = [
  {
    id: 'spring',
    name: 'Spring',
    category: 'season',
    icon: 'flower-outline',
    prompt: 'in a beautiful spring setting with cherry blossoms, fresh green grass, and blooming flowers',
    available: true,
    isPremium: false,
    startMonth: 3,
    endMonth: 5,
  },
  {
    id: 'summer',
    name: 'Summer',
    category: 'season',
    icon: 'sunny-outline',
    prompt: 'in a bright sunny summer setting with blue skies, lush greenery, and warm golden light',
    available: true,
    isPremium: false,
    startMonth: 6,
    endMonth: 8,
  },
  {
    id: 'fall',
    name: 'Fall',
    category: 'season',
    icon: 'leaf-outline',
    prompt: 'in a cozy autumn setting with colorful falling leaves, orange and red foliage, and warm afternoon light',
    available: true,
    isPremium: false,
    startMonth: 9,
    endMonth: 11,
  },
  {
    id: 'winter',
    name: 'Winter',
    category: 'season',
    icon: 'snow-outline',
    prompt: 'in a magical winter wonderland with fresh snow, frost-covered trees, and soft winter light',
    available: true,
    isPremium: false,
    startMonth: 12,
    endMonth: 2,
  },
];

// Holidays - FREE for all users
export const HOLIDAYS: Theme[] = [
  {
    id: 'christmas',
    name: 'Christmas',
    category: 'holiday',
    icon: 'gift-outline',
    prompt: 'in a festive Christmas setting with a decorated tree, twinkling lights, wrapped presents, and holiday decorations',
    available: true,
    isPremium: false,
    startMonth: 12,
    startDay: 1,
    endMonth: 12,
    endDay: 25,
  },
  {
    id: 'halloween',
    name: 'Halloween',
    category: 'holiday',
    icon: 'skull-outline',
    prompt: 'in a spooky but cute Halloween setting with jack-o-lanterns, autumn leaves, and playful Halloween decorations',
    available: true,
    isPremium: false,
    startMonth: 10,
    endMonth: 10,
  },
  {
    id: 'valentines',
    name: "Valentine's Day",
    category: 'holiday',
    icon: 'heart-outline',
    prompt: 'in a romantic Valentine\'s Day setting with hearts, roses, and soft pink lighting',
    available: true,
    isPremium: false,
    startMonth: 2,
    endMonth: 2,
  },
  {
    id: 'easter',
    name: 'Easter',
    category: 'holiday',
    icon: 'egg-outline',
    prompt: 'in a cheerful Easter setting with pastel colors, Easter eggs, spring flowers, and cute bunny decorations',
    available: true,
    isPremium: false,
    startMonth: 3,
    endMonth: 4,
  },
  {
    id: 'independence',
    name: '4th of July',
    category: 'holiday',
    icon: 'star-outline',
    prompt: 'in a patriotic 4th of July setting with American flags, red white and blue decorations, and festive summer vibes',
    available: true,
    isPremium: false,
    startMonth: 7,
    endMonth: 7,
  },
  {
    id: 'thanksgiving',
    name: 'Thanksgiving',
    category: 'holiday',
    icon: 'restaurant-outline',
    prompt: 'in a warm Thanksgiving setting with autumn harvest decorations, pumpkins, cornucopia, and cozy fall colors',
    available: true,
    isPremium: false,
    startMonth: 11,
    endMonth: 11,
  },
  {
    id: 'stpatricks',
    name: "St. Patrick's Day",
    category: 'holiday',
    icon: 'leaf-outline',
    prompt: 'in a lucky St. Patrick\'s Day setting with shamrocks, green decorations, pots of gold, and Irish charm',
    available: true,
    isPremium: false,
    startMonth: 3,
    endMonth: 3,
  },
  {
    id: 'newyear',
    name: "New Year's",
    category: 'holiday',
    icon: 'sparkles-outline',
    prompt: 'in a glamorous New Year\'s celebration setting with confetti, streamers, champagne glasses, and festive gold decorations',
    available: true,
    isPremium: false,
    startMonth: 12,
    startDay: 26,
    endMonth: 1,
    endDay: 7,
  },
];

// Special events - PREMIUM only
export const EVENTS: Theme[] = [
  {
    id: 'birthday',
    name: 'Birthday',
    category: 'event',
    icon: 'balloon-outline',
    prompt: 'in a fun birthday party setting with colorful balloons, birthday cake, party hats, and celebration decorations',
    available: true,
    isPremium: true,
  },
  {
    id: 'graduation',
    name: 'Graduation',
    category: 'event',
    icon: 'school-outline',
    prompt: 'in a proud graduation setting with a cap and diploma, celebration confetti, and academic decorations',
    available: true,
    isPremium: true,
  },
  {
    id: 'wedding',
    name: 'Wedding',
    category: 'event',
    icon: 'heart-circle-outline',
    prompt: 'in an elegant wedding setting with white flowers, romantic lighting, and beautiful wedding decorations',
    available: true,
    isPremium: true,
  },
  {
    id: 'beach-vacation',
    name: 'Beach Vacation',
    category: 'event',
    icon: 'umbrella-outline',
    prompt: 'on a tropical beach vacation with palm trees, ocean waves, beach umbrella, and sandy shores',
    available: true,
    isPremium: true,
  },
  {
    id: 'camping',
    name: 'Camping',
    category: 'event',
    icon: 'bonfire-outline',
    prompt: 'at a cozy camping scene with a tent, campfire, pine trees, and starry night sky',
    available: true,
    isPremium: true,
  },
  {
    id: 'sports',
    name: 'Game Day',
    category: 'event',
    icon: 'football-outline',
    prompt: 'in an exciting game day setting with sports equipment, team spirit decorations, and athletic vibes',
    available: true,
    isPremium: true,
  },
  {
    id: 'cozy-home',
    name: 'Cozy Home',
    category: 'event',
    icon: 'home-outline',
    prompt: 'in a cozy home setting with a warm fireplace, soft blankets, and comfortable living room furniture',
    available: true,
    isPremium: true,
  },
  {
    id: 'adventure',
    name: 'Adventure',
    category: 'event',
    icon: 'compass-outline',
    prompt: 'on an exciting outdoor adventure with mountains, hiking trails, and beautiful natural scenery',
    available: true,
    isPremium: true,
  },
];

// Combined themes
export const ALL_THEMES: Theme[] = [...SEASONS, ...HOLIDAYS, ...EVENTS];

// Helper to get current date info
function getCurrentDateInfo(): { month: number; day: number } {
  const now = new Date();
  return {
    month: now.getMonth() + 1, // 1-12
    day: now.getDate(), // 1-31
  };
}

// Check if a theme is "in season" based on current date
export function isThemeInSeason(theme: Theme): boolean {
  if (!theme.startMonth || !theme.endMonth) return true; // Events are always available

  const { month, day } = getCurrentDateInfo();
  const startDay = theme.startDay || 1;
  const endDay = theme.endDay || 31;

  // Convert to comparable format: MMDD
  const currentDate = month * 100 + day;
  const startDate = theme.startMonth * 100 + startDay;
  const endDate = theme.endMonth * 100 + endDay;

  // Handle year wrap (e.g., New Year's: Dec 26 - Jan 7)
  if (startDate > endDate) {
    return currentDate >= startDate || currentDate <= endDate;
  }

  return currentDate >= startDate && currentDate <= endDate;
}

// Get themes sorted by relevance (in-season first)
export function getThemesByRelevance(): Theme[] {
  return [...ALL_THEMES].sort((a, b) => {
    const aInSeason = isThemeInSeason(a);
    const bInSeason = isThemeInSeason(b);

    if (aInSeason && !bInSeason) return -1;
    if (!aInSeason && bInSeason) return 1;
    return 0;
  });
}

// Get featured themes for the current time
export function getFeaturedThemes(limit: number = 4): Theme[] {
  return getThemesByRelevance()
    .filter(t => isThemeInSeason(t))
    .slice(0, limit);
}

// Get themes by category
export function getThemesByCategory(category: ThemeCategory): Theme[] {
  return ALL_THEMES.filter(t => t.category === category);
}

// Get free themes (Seasons + Holidays only)
export const FREE_THEMES: Theme[] = ALL_THEMES.filter(t => !t.isPremium);

// Get premium themes (Events only)
export const PREMIUM_THEMES: Theme[] = ALL_THEMES.filter(t => t.isPremium);

// Check if a user can use a specific theme based on their tier
export function canUseTheme(tier: SubscriptionTier, theme: Theme): boolean {
  if (tier === 'premium' || tier === 'lifetime') return true;
  return !theme.isPremium;
}

// Get available themes for a user's tier
export function getAvailableThemes(tier: SubscriptionTier): Theme[] {
  if (tier === 'premium' || tier === 'lifetime') return ALL_THEMES;
  return FREE_THEMES;
}

// Get featured themes for the current time (filtered by tier)
export function getFeaturedThemesForTier(
  tier: SubscriptionTier,
  limit: number = 4
): Theme[] {
  const availableThemes = getAvailableThemes(tier);
  return availableThemes
    .filter(t => isThemeInSeason(t))
    .slice(0, limit);
}
