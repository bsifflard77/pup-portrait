# Pup Portrait

## Overview
AI-powered dog portrait generator using Nano Banana (Google Gemini 2.5 Flash Image). Unified codebase for Web, iOS, and Android built with React Native/Expo. Backend powered by Supabase with Stripe payment integration.

## Architecture
```
pup-portrait/
├── apps/
│   ├── mobile/              # React Native Expo app (iOS, Android, Web)
│   │   ├── app/             # Expo Router screens
│   │   │   ├── (auth)/      # Login, signup screens
│   │   │   ├── (tabs)/      # Main app tabs (home, gallery, profile)
│   │   │   └── index.tsx    # Landing/guest page
│   │   ├── components/      # Reusable UI components
│   │   ├── lib/             # Supabase client, guest tracker, utilities
│   │   └── store/           # Zustand state management
│   │
│   └── admin/               # Next.js admin dashboard (TODO)
│
├── packages/
│   └── shared/              # Shared types, breeds, pricing constants
│       └── src/
│           ├── types.ts     # TypeScript interfaces
│           ├── breeds.ts    # Dog breed definitions
│           └── pricing.ts   # Pricing tiers & Stripe config
│
├── supabase/
│   ├── config.toml          # Supabase local config
│   ├── migrations/          # Database schema
│   └── functions/           # Edge functions (Deno)
│       ├── generate-portrait/
│       ├── create-checkout/
│       └── stripe-webhook/
│
└── package.json             # Turborepo workspace config
```

## Commands
```bash
# Development
npm run mobile          # Start Expo dev server
npm run mobile:web      # Start Expo for web
npm run mobile:ios      # Start Expo for iOS
npm run mobile:android  # Start Expo for Android
npm run admin           # Start admin dashboard (TODO)

# Database
npm run db:migrate      # Push Supabase migrations
npm run db:generate     # Generate TypeScript types from schema

# Build
npm run build           # Build all packages
npm run lint            # Lint all packages
```

## Tech Stack
- **Frontend:** React Native + Expo SDK 54, Expo Router, NativeWind (TailwindCSS)
- **State:** Zustand
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI:** Nano Banana (Google Gemini 2.5 Flash Image API)
- **Payments:** Stripe (Subscriptions + One-time)
- **Monorepo:** Turborepo

## Workflow
1. Read progress.md → find active task
2. Implement until tests pass
3. Update progress.md with completion entry
4. If feature complete → commit → update features.json
5. Set next active task

## Standards
- TypeScript strict mode
- Functional components with hooks
- Use shared package for types/constants
- Test before marking complete
- Commits: `feat(scope): description`

## Key Files
- `packages/shared/src/types.ts` - All TypeScript interfaces
- `packages/shared/src/pricing.ts` - Pricing tiers, Stripe IDs
- `packages/shared/src/breeds.ts` - Dog breed definitions
- `apps/mobile/lib/supabase.ts` - Supabase client
- `apps/mobile/store/auth-store.ts` - Auth state management
- `supabase/migrations/00001_initial_schema.sql` - Database schema

## Environment Setup
1. Copy `.env.example` to `.env`
2. Create Supabase project at supabase.com
3. Get Google AI API key for Nano Banana
4. Configure Stripe products and prices
5. Set up OAuth providers in Supabase dashboard

## Critical Rules
> **Update progress.md after EVERY completed action. No exceptions.**
> **Use shared package for ALL types and constants**
> **Test on both web and mobile before marking complete**
