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
  totalGenerations: number;
  createdAt: string;
}

export type SubscriptionTier = 'free' | 'premium' | 'lifetime';
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'past_due';

// Portrait types
export interface Portrait {
  id: string;
  userId: string | null;
  breed: string;
  color: string | null;
  background: string | null;
  style: PortraitStyle;
  imageUrl: string;
  thumbnailUrl: string | null;
  prompt: string | null;
  isPremium: boolean;
  isPublic: boolean;
  createdAt: string;
}

export type PortraitStyle = 'realistic' | 'cartoon' | 'watercolor' | 'artistic';

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

export type PlanType = 'monthly' | 'yearly' | 'lifetime';

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
}

export interface GeneratePortraitResponse {
  portrait: Portrait;
  remainingGenerations: number | null; // null for premium users (unlimited)
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
