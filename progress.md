# Progress Tracker
**Project:** Pup Portrait
**Last Updated:** 2026-08-25
**Current Focus:** Legal pages + one-time free-offer copy

---

## Active Task
- **Task:** Ship /privacy + /terms and align signup/Create with the one-time 1+5 offer
- **Feature:** Meta-ads legal pages + free-tier copy
- **Started:** 2026-08-25
- **Status:** ✅ COMPLETE — verified on Expo web (390px + routes)

### Completed 2026-08-25
- Added Expo web routes `GET /privacy` and `GET /terms` that render HQ markdown from `legal/privacy-policy.md` and `legal/terms-of-service.md` as readable HTML (not an unmatched-route shell).
- Signup benefit copy: "5 free portraits per week" → "1 watermarked portrait + 5 scenes (one-time)". Signup Terms/Privacy text is now real links to those pages.
- Create tab counter: "Weekly Portraits" / "N of 6 remaining free" → "Free offer" + "1 watermarked portrait + 5 scenes · N of 6 remaining" (one-time grant, not a weekly refill). Paid SKUs untouched.
- Mobile header (~390px): stacked `SiteNav` so logo, Pricing, Sign in, and Get started free no longer collide or clip.
- Added `GET /pricing` using the existing HQ `TIERS_DISPLAY` SKUs. Header Pricing links there. Signed-out plan CTAs go to signup.

### Verified 2026-08-25 (Expo web localhost:8081)
- `/privacy` and `/terms` render readable Monomoy/Pup Portrait legal copy (not Unmatched Route).
- Signup benefit is `1 watermarked portrait + 5 scenes (one-time)`; Terms/Privacy links land on those pages.
- Create tab shows `Free offer` / `1 watermarked portrait + 5 scenes · 6 of 6 remaining`.
- 390px header: logo, Pricing, Sign in, Get started free visible, no `Pup PortraitPricing` collision.
- `/pricing` lists $9.99 Pack / $5.99/mo / $29.99/yr / $49.99/yr Realism / $49.99 lifetime.

---

## Prior Active Task
- **Task:** Test authentication session fix for Edge Function
    - **Feature:** Weekly Counter Bug Fix
    - **Started:** 2025-12-17
    - **Status:** 🟡 READY TO TEST - Fix implemented, awaiting verification

### Problem Summary:
The weekly counter showed "4 of 5 remaining" but never decremented after generating portraits.

### Root Cause (Identified 2025-12-17):
**The auth session wasn't being sent to the Edge Function.**
- `supabase.auth.getSession()` was returning `null` even when user appeared logged in
- Without an access token, Edge Function treated requests as unauthenticated (guest)
- Guest requests don't update `weekly_generations_used` - only authenticated users do

### Fixes Applied (Committed 2025-12-17, commit 25bf884):
1. **auth-store.ts**:
   - Added `accessToken` to Zustand state
   - Store `session.access_token` when auth state changes
   - Added `getAccessToken()` method
   - Added debug logging for auth state changes

2. **portrait-store.ts**:
   - Import `useAuthStore`
   - Get access token from auth store instead of calling `supabase.auth.getSession()`
   - Added debug logging to verify auth state

3. **Edge Function (index.ts)**:
   - Added comprehensive logging throughout
   - Fixed date comparison (use timestamps instead of Date objects)
   - Fixed `getStartOfWeek()` and `getStartOfDay()` to use UTC
   - Added error handling for all database updates

---

## TESTING CHECKLIST (Start Here!)

### Step 1: Start Dev Server
```bash
cd apps/mobile && npx expo start --web
```

### Step 2: Log Out & Log Back In
- Click profile/logout to clear any stale session
- Log back in with: bsifflard747@gmail.com
- **This is critical** - must log in fresh to populate accessToken in Zustand store

### Step 3: Check Browser Console (F12)
Look for these messages after login:
```
Auth state change: SIGNED_IN bsifflard747@gmail.com
Initial session check: bsifflard747@gmail.com
```

### Step 4: Generate a Portrait
When you click "Generate Portrait", check browser console for:
```
Auth check: { hasAccessToken: true, userId: "...", email: "...", isAuthenticated: true }
```

### Step 5: Check Supabase Edge Function Logs
Go to Supabase Dashboard > Edge Functions > generate-portrait > Logs
Look for:
```
AUTHENTICATED USER: 3056dfad-b90a-4e46-a7e8-5e4b48b4c46a EMAIL: bsifflard747@gmail.com
FREE tier check: { weekStart: "...", weekly_generations_used: 0, ... }
Updated weekly_generations_used to 1
```

### Step 6: Verify Database
In Supabase Dashboard > Table Editor > profiles:
- Check `weekly_generations_used` incremented (0 → 1 → 2, etc.)

### Step 7: Verify UI
- Counter should show: 5/5 → 4/5 → 3/5, etc.
- Each portrait generated should decrement by 1

---

### If Still Not Working:
1. Check if `hasAccessToken: false` in browser console → session not saved properly
2. Check Edge Function logs for `AUTHENTICATED USER:` → if missing, token not reaching server
3. Check for errors in Edge Function logs during database update

### Database State:
- User profile exists: `bsifflard747@gmail.com` (ID: 3056dfad-b90a-4e46-a7e8-5e4b48b4c46a)
- Profile was manually created via SQL (trigger may not be working for new signups)

### Files Modified:
- `supabase/functions/generate-portrait/index.ts` - Logging, UTC dates, error handling
- `apps/mobile/store/auth-store.ts` - Store access token, add getAccessToken()
- `apps/mobile/store/portrait-store.ts` - Use auth store token instead of getSession()

---

## Session Log

### 2025-12-05

 **14:00** - Initialized project with comprehensive plan
   - Created detailed plan document with tech stack decisions
   - Defined pricing strategy ($7.99/mo, $59.99/yr, $19.99 lifetime)
   - Mapped out feature roadmap (Phase 1-3)
   - Documented database schema and API endpoints

 **14:30** - Set up Turborepo monorepo structure
   - Created workspace configuration (apps/*, packages/*)
   - Added turbo.json with build/dev/lint tasks
   - Set up root package.json with all scripts

 **14:45** - Created shared package
   - `packages/shared/src/types.ts` - All TypeScript interfaces
   - `packages/shared/src/breeds.ts` - 25 dog breeds (15 free, 10 premium)
   - `packages/shared/src/pricing.ts` - Pricing tiers, colors, backgrounds

 **15:00** - Set up Supabase structure
   - Created `supabase/config.toml` for local development
   - Created initial migration with full schema:
     - profiles (user data, subscription info)
     - portraits (generated images)
     - subscriptions (Stripe tracking)
     - email_signups (newsletter)
     - guest_generations (rate limiting)
   - Added Row Level Security policies
   - Created auto-profile trigger on user signup

 **15:15** - Created Supabase Edge Functions
   - `generate-portrait/` - Calls Nano Banana API, handles tiers/limits
   - `create-checkout/` - Creates Stripe checkout sessions
   - `stripe-webhook/` - Processes payment events

 **15:30** - Initialized Expo app
   - Created app with TypeScript template
   - Installed dependencies (expo-router, supabase, zustand, nativewind, stripe)
   - Configured NativeWind with custom color scheme
   - Set up app.json with proper configuration

 **15:45** - Built core mobile app
   - `app/_layout.tsx` - Root layout with auth initialization
   - `app/index.tsx` - Landing page with guest generation
   - `app/(tabs)/` - Tab navigation (home, gallery, profile)
   - `app/(auth)/` - Login and signup screens
   - `lib/supabase.ts` - Supabase client with secure storage
   - `lib/guest-tracker.ts` - Guest trial tracking
   - `store/auth-store.ts` - Authentication state
   - `store/portrait-store.ts` - Portrait generation state

 **16:00** - Created project documentation
   - CLAUDE.md with architecture and workflow
   - progress.md (this file)
   - .env.example with all required variables
   - .gitignore for monorepo

 **16:30** - Pushed to GitHub repository
   - Repository: github.com/bsifflard77/pup-portrait (private)
   - Initial commit with full project structure (46 files)
   - All Phase 1 setup code committed and pushed
   - User also set up Supabase project

 **17:00** - Configured external services
   - Connected Supabase project (uzbhimzqwwgkjemflgqh)
   - Ran database migration - all tables created
   - Added Google AI API key for Nano Banana
   - Configured Stripe with products and webhook:
     - Monthly: $7.99/mo (price_1Sb7AXBxllKMUxPg4p6crd0g)
     - Yearly: $59.99/yr (price_1Sb7AXBxllKMUxPg4lODa6mb)
     - Lifetime: $79.99 unlimited (price_1Sb7AXBxllKMUxPgxgEQQYzQ)
   - Updated pricing.ts to reflect $79.99 lifetime (unlimited)

### 2025-12-17

 **10:00** - Full Dynamic Theming Implemented
   - Refactored index.tsx to use inline styles with `colors` from useThemeStore()
   - All color-dependent styles now dynamic (background, text, borders, etc.)
   - Light theme default with warm coral/cream palette
   - Dark theme toggle working with purple/indigo palette
   - Updated light theme colors for more vibrancy:
     - Primary: #E05A70 (richer coral)
     - Borders: #FFD6CC (peachy, more visible)
     - Text: #1F1F2E (darker for contrast)

 **11:00** - Tier System Planning Session
   - Analyzed Google Gemini pricing: $0.039/image, FREE tier 1,500/day (45k/month)
   - Discussed cost implications at scale
   - Finalized new tier structure:

   | Feature | Guest | Free Account | Paid |
   |---------|-------|--------------|------|
   | Portraits | 1 total | 5/week | 15/day |
   | Breeds | 15 dropdown | 15 dropdown | 100 + search |
   | Themes | Seasons+Holidays | Seasons+Holidays | All themes |
   | Aspect Ratios | Square | Square | All |
   | Social Sharing | Yes (branded) | Yes (branded) | Yes (clean) |
   | Watermark | Yes + URL | Yes + URL | No |
   | Save to Gallery | No | Yes | Yes |

   - Key decisions:
     - Start conservative with 15/day cap (easier to raise than lower)
     - Events themes (Birthday, Graduation, etc.) = paid only
     - Seasons + Holidays = free for all
     - Type-to-search breeds = paid feature
     - Terms: "Unlimited" = 15/day, no automation
     - **Social sharing as marketing tool:**
       - Free/Guest: Watermark includes "Created with Pup Portrait" + URL
       - Free/Guest: Share text auto-includes link to pupportrait.com
       - Premium: Clean images, optional branding
       - Future: Add QR code to watermark for easy app download

 **12:00** - Tier System Implementation (Phase 1: Shared Package)
   - Updated `packages/shared/src/breeds.ts`:
     - Expanded from 25 to 100 dog breeds
     - 15 free breeds (most popular) + 85 premium breeds
     - Added `searchBreeds()` function for type-to-search
     - Added `getBreedsForDropdown()` helper
     - Added `ALL_BREEDS_SORTED` for premium view

   - Updated `packages/shared/src/pricing.ts`:
     - Added GUEST tier config (1 total portrait)
     - Changed FREE from dailyLimit to weeklyLimit (5/week)
     - Changed PREMIUM dailyLimit from unlimited to 15/day
     - Added `isPremium` flag to Theme interface
     - Marked all SEASONS and HOLIDAYS as `isPremium: false`
     - Marked all EVENTS as `isPremium: true`
     - Added helper functions:
       - `canUseTheme(tier, theme)`
       - `getAvailableThemes(tier)`
       - `getFeaturedThemesForTier(tier, limit)`
       - `getUsagePeriodLabel(tier, isGuest)`
     - Updated `canGenerate()` and `getRemainingGenerations()` signatures
     - Added FREE_THEMES and PREMIUM_THEMES exports

 **13:00** - Tier System Implementation (Phase 2: UI Updates)
   - Updated `apps/mobile/app/index.tsx`:
     - Events themes now show PRO badge and lock icon
     - Clicking locked themes redirects to signup
     - Featured themes filtered by tier (guests only see free)
     - Updated "25+ Breeds" to "100+ Breeds" in features
     - Updated upgrade prompt text for new limits
     - Updated pricing features list to reflect new tier benefits
     - Added new styles for premium badges and locks

 **14:00** - Tier System Implementation (Phase 3: Backend/Edge Function)
   - Updated `supabase/functions/generate-portrait/index.ts`:
     - Added LIMITS config object with tier-specific limits
     - FREE tier: 5/week with weekly reset (Monday)
     - PREMIUM/LIFETIME tier: 15/day with daily reset
     - Guest: 1 total portrait ever (unchanged)
     - Added `getStartOfWeek()` and `getStartOfDay()` helpers
     - Response now includes `limit`, `usagePeriod`, `remainingGenerations`
     - Updated error messages to reflect new limits

   - Created new migration `00002_add_weekly_limits.sql`:
     - Added `weekly_generations_used` column to profiles
     - Added `weekly_reset_at` column to profiles
     - Created `increment_total_generations()` function
     - Created `reset_generation_counters()` function
     - Added indexes for reset queries

   - Updated watermark in UI to include URL (pupportrait.com)
   - Updated SHARE_BRANDING with watermarkUrl and qrCodeUrl

 **15:00** - Deployed Tier System
   - Ran migration 00002_add_weekly_limits.sql in Supabase SQL Editor
   - Redeployed Edge Function generate-portrait via Supabase Dashboard
   - Tested guest portrait generation - SUCCESS with watermark
   - Fixed database trigger for new user signup (added error handling)

 **16:00** - Fixed Authenticated Home Page (home.tsx)
   - Bug report: "5 remaining today" instead of "5 remaining this week"
   - Bug report: Dark theme, full-width layout instead of light/centered
   - Fixes applied:
     - Added `weeklyGenerationsUsed` and `weeklyResetAt` to User type
     - Updated auth-store.ts to fetch weekly fields from database
     - Added `name` field to Portrait type
     - Updated portrait-store.ts to include name field
     - Rewrote home.tsx with:
       - useThemeStore() for dynamic light theme colors
       - LinearGradient background (matching landing page)
       - maxWidth: 480px centered layout for web
       - "Weekly Portraits" with `getUsagePeriodLabel()` ("this week")
       - Theme selector with seasons/holidays/events (premium locked)
       - Upgrade CTA at bottom for free users

---

### 2025-12-16

 **14:00** - Code Cleanup Completed
   - Removed hardcoded Supabase credentials from supabase.ts and portrait-store.ts
   - Now using process.env.EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
   - Removed all debug console.log statements from portrait-store.ts
   - Installed @react-native-async-storage/async-storage for theme persistence

 **15:00** - Light/Dark Theme System Implementation
   - Created apps/mobile/store/theme-store.ts with Zustand
   - Defined two complete color palettes:
     - Light theme: Warm, feminine palette (coral #E8788A primary, cream #FFF8F5 background)
     - Dark theme: Original purple/indigo scheme (#6366f1 primary, #0f0f1a background)
   - Added theme toggle button (sun/moon icon) in top-right corner of index.tsx
   - ThemeColors interface with 17 color properties for comprehensive theming

 **15:30 - 20:00** - Debugging Blank Screen Issues
   - **Problem 1:** Light theme colors with white text = invisible on light background
   - **Problem 2:** Zustand persist middleware with Platform.OS checks caused SSR issues
   - **Problem 3:** AsyncStorage + createJSONStorage imports breaking web bundling
   - **Attempted fixes:**
     - Added window/localStorage safety checks
     - Changed Supabase client to use fallback empty strings instead of `!` assertions
     - Multiple Expo server restarts on various ports (8100, 8108, 8110, 8111, 8112, 8115, 8120)
   - **Solution:**
     - Simplified theme-store.ts to basic Zustand (removed all persistence middleware)
     - Restored dark theme colors in static `colors` object (index.tsx)
     - Default theme set to 'dark' to match StyleSheet colors
   - **Result:** App working on http://localhost:8120 with dark theme

 **20:30** - Theme System Final State
   - Theme store exists with light/dark definitions and toggle function
   - Toggle button visible and functional (changes Zustand state)
   - Visual theming uses static dark colors in StyleSheet
   - Note: Full dynamic visual theming would require inline styles (future enhancement)

---

### 2025-12-15

 **08:00** - Fixed Supabase Configuration & Edge Function Debugging
   - Discovered .env had wrong Supabase project URL (was uzbhimzqwwgkjemflgqh)
   - Corrected to actual project: rmalsvaoomhrgflioiqx.supabase.co
   - Created .env in apps/mobile/ directory (Expo needs it there, not just root)
   - Temporarily hardcoded Supabase credentials in supabase.ts and portrait-store.ts to bypass Metro caching issues
   - Fixed "Missing authorization header" error by adding Bearer token for anonymous requests

 **09:00** - Database & Storage Setup
   - Ran SQL migration via Supabase SQL Editor (CREATE POLICY IF NOT EXISTS syntax issue fixed)
   - Created 'portraits' storage bucket with public read access
   - Set up storage policies: public read, authenticated insert, owner update/delete

 **10:00** - Gemini API Integration Debugging
   - Initial model `gemini-2.0-flash-exp` returned 400 error
   - Tried `gemini-2.0-flash-preview-image-generation` - 404 error
   - Tried `imagen-3.0-generate-002` with :predict endpoint - 404 error
   - Tried `gemini-2.5-flash-preview-image-generation` - 404 error
   - Finally got `gemini-2.0-flash-exp` working with correct config:
     - API key in URL query param: `?key=${googleAiKey}`
     - `generationConfig: { responseModalities: ["Text", "Image"] }`
   - Hit 429 rate limit errors - user added billing to get free credits
   - **SUCCESS:** Portrait generation now works! Image created and saved to Supabase

 **10:30** - Current Issue
   - Portrait generates successfully (confirmed in Edge Function response)
   - Screen shows success message but image doesn't display (blank)
   - Need to debug: check Storage bucket for image, check database record, check frontend display logic

 **11:00** - Fixed Image Display Bug
   - Root cause: Edge Function returns snake_case keys from database (image_url)
   - But frontend Portrait interface expects camelCase (imageUrl)
   - Fix: Added transformation in portrait-store.ts generatePortrait() to map keys
   - Same pattern already used in fetchUserPortraits()

 **12:00** - Theme Support Integration
   - Added themePrompt to GeneratePortraitRequest type
   - Updated handleGenerate() in index.tsx to pass selectedTheme.prompt
   - Updated portrait-store.ts to include themePrompt in API request body
   - Updated Edge Function to accept themePrompt and integrate into AI prompt
   - Enhanced theme system with day-level precision for holiday transitions:
     - Christmas: Dec 1-25
     - New Year's: Dec 26 - Jan 7
     - Added startDay/endDay to Theme interface
     - Updated isThemeInSeason() to handle day-level comparisons
   - **TESTED & WORKING:** Themes now apply to generated portraits!

### 2025-12-14

 **17:00** - Major UI/UX Redesign
   - Redesigned landing page with modern, polished look
   - Added hero section with logo, tagline, and app branding
   - Implemented aspect ratio selector (Square free, Portrait/Story/Landscape premium)
   - Added social sharing buttons (Facebook, X, Pinterest) with branding
   - Portrait preview now adjusts to selected aspect ratio
   - Gradient generate button with press animation
   - Added "Created with Pup Portrait" watermark on free tier images
   - Features grid showcasing app benefits
   - Pricing teaser section with premium benefits
   - Updated shared package with:
     - ASPECT_RATIOS config with premium flags
     - SOCIAL_PLATFORMS for sharing
     - SHARE_BRANDING for watermarks and share text
     - FEATURES config for tier-based feature access
     - Helper functions: canUseAspectRatio(), requiresBrandedSharing()
   - Switched from NativeWind to StyleSheet for reliable web rendering
   - Installed expo-linear-gradient for button effects

 **18:00** - Added Themes Feature (FREE for all users!)
   - Created comprehensive themes system in shared package:
     - **4 Seasons:** Spring, Summer, Fall, Winter
     - **8 Holidays:** Christmas, Halloween, Valentine's, Easter, 4th of July, Thanksgiving, St. Patrick's, New Year's
     - **8 Events:** Birthday, Graduation, Wedding, Beach Vacation, Camping, Game Day, Cozy Home, Adventure
   - Each theme includes custom AI prompt modifier for portrait generation
   - Smart "in-season" detection - highlights current/relevant themes
   - Added theme selector to landing page:
     - Featured themes quick-select (4 most relevant)
     - "See All Themes" expandable dropdown with categories
     - Visual badges for in-season themes
     - Selected theme preview with clear button
   - Helper functions: isThemeInSeason(), getFeaturedThemes(), getThemesByCategory()
   - Updated FEATURES config to show themes available for FREE tier

---

## Feature Status

| ID | Feature | Status | Notes |
|----|---------|--------|-------|
| 001 | Project Setup | Complete | Monorepo, shared package, docs |
| 002 | Database Schema | Complete | All tables, RLS, triggers |
| 003 | Edge Functions | Complete | Generate, checkout, webhook |
| 004 | Mobile App Structure | Complete | Routes, layouts, screens |
| 005 | Auth Flow | Complete | Login, signup, guest tracking |
| 006 | Portrait Generator UI | Complete | Breed/aspect ratio/social share |
| 007 | Gallery | Complete | Portrait grid view |
| 008 | Profile & Settings | Complete | User info, upgrade prompt |
| 009 | External Services | Complete | Supabase, Stripe, Google AI configured |
| 010 | Admin Dashboard | Pending | Next.js standalone app |

**Legend:** Complete | In Progress | Pending | Blocked

---

## Blockers
None currently - ready for testing

---

## Key Decisions
1. **Unified Codebase:** React Native + Expo for web/iOS/Android
2. **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
3. **AI:** Google Gemini 2.0 Flash at ~$0.039/image (FREE tier: 1,500/day)
4. **Pricing:** $7.99/mo, $59.99/yr, $79.99 lifetime
5. **Generation Limits:** Guest=1 trial, Free=5/week, Paid=15/day ("unlimited")
6. **Breeds:** Free=15 (dropdown), Paid=100 + type-to-search
7. **Themes:** Free=Seasons+Holidays, Paid=All (incl. Events)
8. **Admin:** Standalone Next.js dashboard

---

## Next Up
1. ~~Clean up hardcoded credentials~~ ✓ DONE (2025-12-16)
2. ~~Remove debug console.log statements~~ ✓ DONE (2025-12-16)
3. ~~Theme toggle infrastructure~~ ✓ DONE (2025-12-16)
4. ~~Full dynamic visual theming~~ ✓ DONE (2025-12-17)
5. ~~Implement new tier system~~ ✓ DONE (2025-12-17)
   - ✓ breeds.ts: 100 breeds (15 free, 85 premium) with search
   - ✓ pricing.ts: new limits (5/week free, 15/day paid)
   - ✓ pricing.ts: Events=premium, Seasons+Holidays=free
   - ✓ UI: PRO badges, lock icons, branded watermarks
   - ✓ Edge Function: weekly/daily limit enforcement
   - ✓ Migration 00002: weekly tracking columns
6. **Deploy tier system** ← CURRENT
   - Run migration 00002_add_weekly_limits.sql in Supabase SQL Editor
   - Redeploy generate-portrait Edge Function via Supabase Dashboard
7. **Test full user flow** ← NEXT
   - Guest: generate 1 portrait → prompt signup
   - Free: generate 5 portraits → weekly limit message
   - Premium themes/breeds show lock icons → redirect to signup
   - Payment flow: checkout → webhook → tier upgrade
8. Build admin dashboard (Next.js)
9. Configure OAuth providers (Google, Apple) in Supabase
10. Deploy and test on iOS/Android

---

## Resume Instructions
```
Read this file. Start with "TESTING CHECKLIST" section above.

CRITICAL INFO:
- Supabase project: rmalsvaoomhrgflioiqx.supabase.co
- Edge Function `generate-portrait` deployed via Dashboard (not CLI)
- Gemini API: model gemini-2.0-flash-exp, key in URL ?key=${googleAiKey}
- Config: generationConfig: { responseModalities: ["Text", "Image"] }
- Google AI API key: stored in Supabase Edge Function secrets as `GOOGLE_AI_API_KEY` (rotated 2026-05-19 — the prior key that was checked into this file has been revoked at console.cloud.google.com)
- Test user: bsifflard747@gmail.com (ID: 3056dfad-b90a-4e46-a7e8-5e4b48b4c46a)

CURRENT ISSUE (Ready to Test):
- Weekly counter wasn't decrementing because auth token wasn't being sent
- Fix: Store accessToken in Zustand auth store, retrieve from there when making API calls
- Must log out and log back in to populate the token after fix

WORKING FEATURES:
- Portrait generation with Gemini AI ✓
- Image display after generation ✓
- Theme support (Seasons, Holidays, Events) ✓
- Light/Dark theme toggle with full visual switching ✓
- Automatic theme transitions based on date ✓

TIER SYSTEM (Implemented, needs testing):
- Guest: 1 trial portrait
- Free: 5/week, 15 breeds (dropdown), Seasons+Holidays themes
- Paid: 15/day, 100 breeds + search, All themes, All aspect ratios

KEY FILES FOR AUTH FIX:
- apps/mobile/store/auth-store.ts - accessToken state, getAccessToken()
- apps/mobile/store/portrait-store.ts - uses auth store token
- supabase/functions/generate-portrait/index.ts - logging, UTC dates

DEV SERVER:
- Run: cd apps/mobile && npx expo start --web
- Last working port: 8125

TO RESET GUEST TRIAL:
- Browser: localStorage.removeItem('pup_portrait_guest')
- Or use incognito window
```
