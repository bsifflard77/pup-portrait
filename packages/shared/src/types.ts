// User types
export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus | null;
  stripeCustomerId: string | null;
  dailyGenerationsUsed: number;
  dailyResetAt: string | null;
  weeklyGenerationsUsed: number;
  weeklyResetAt: string | null;
  totalGenerations: number;
  // Number of unused Portrait Packs (each pack = 12 photo-upload portraits).
  // Added 2026-05-19 for the photo-upload feature.
  packCredits: number;
  createdAt: string;
}

// 2026-05-19 relaunch: added 'pack' (one-time, 12 portraits from upload) and
// 'realism' (annual sub with Flux Kontext Pro toggle unlocked).
export type SubscriptionTier =
  | 'free'
  | 'pack'
  | 'premium'
  | 'realism'
  | 'lifetime';

export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'past_due';

// Portrait types
export interface Portrait {
  id: string;
  userId: string | null;
  breed: string;
  color: string | null;
  background: string | null;
  style: PortraitStyle;
  name: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  prompt: string | null;
  isPremium: boolean;
  isPublic: boolean;
  // 2026-05-19: which generation engine produced this portrait.
  // 'nano-banana-2' is the new default; 'flux-kontext-pro' is the
  // Realism-tier upsell; 'gemini-2.0-flash' is retained on existing rows.
  engine: GenerationEngine | null;
  // 2026-05-19: whether this portrait came from a user-uploaded reference
  // photo (the "Send Your Pup on an Adventure" 12-portrait pack feature).
  fromPhotoUpload: boolean;
  createdAt: string;
}

export type PortraitStyle = 'realistic' | 'cartoon' | 'watercolor' | 'artistic';

export type GenerationEngine =
  | 'gemini-2.0-flash'
  | 'nano-banana-2'
  | 'flux-kontext-pro';

// Subscription types
export interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string | null;
  planType: PlanType;
  amount: number;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
}

// 2026-05-19 relaunch: added 'pack' (one-time 12-portrait pack) and
// 'realism_yearly' (Premium Annual + Flux Kontext Pro Realism mode).
export type PlanType =
  | 'monthly'
  | 'yearly'
  | 'lifetime'
  | 'pack'
  | 'realism_yearly';

// Email signup
export interface EmailSignup {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

// API Request/Response types
export interface GeneratePortraitRequest {
  breed: string;
  color?: string;
  background?: string;
  style?: PortraitStyle;
  themePrompt?: string; // Theme AI prompt modifier (e.g., "Christmas decorations, Santa hat")
  // 2026-05-19 relaunch additions:
  // Path inside the `pet-uploads` Supabase Storage bucket for the
  // user's source dog photo. When set, generation uses image-to-image
  // with identity preservation.
  referenceImagePath?: string;
  // Toggle to route this generation through Flux Kontext Pro for ultra
  // realistic output. Only honored for `realism` and `lifetime` tiers.
  useRealism?: boolean;
}

export interface GeneratePortraitResponse {
  portrait: Portrait;
  remainingGenerations: number | null; // null for premium users (unlimited)
}

// 2026-05-19: 12-portrait pack generated from a single user-uploaded
// reference photo. Powered by Nano Banana 2 (Gemini 3.1 Flash Image).
export interface GeneratePackRequest {
  referenceImagePath: string; // path inside `pet-uploads` storage bucket
}

export interface GeneratePackResponse {
  portraits: Portrait[]; // 12 portraits, one per pack theme
  remainingPackCredits: number; // null for subscription/lifetime tiers (unlimited)
  errors: { themeId: string; message: string }[]; // any per-theme failures
}

export interface UserStatsResponse {
  dailyGenerationsUsed: number;
  dailyLimit: number | null; // null for premium (unlimited)
  totalGenerations: number;
  subscriptionTier: SubscriptionTier;
  subscriptionEndsAt: string | null;
}

// Guest tracking
export interface GuestData {
  hasUsedFreeGeneration: boolean;
  generatedAt: string | null;
  deviceId: string;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
