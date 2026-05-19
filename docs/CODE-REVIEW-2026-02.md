# Pup Portrait — Code Review & Refinement Report
**Date:** 2026-02-03  
**Reviewer:** Jasper (AI Assistant)  
**Codebase Version:** Post-Dec 2025 weekly counter fix  
**Status:** ⚠️ Pre-launch — needs several items before App Store / Play Store submission

---

## Executive Summary

The Pup Portrait app has a **solid foundation** with working AI portrait generation, a tier system, theme support, and payment infrastructure. However, it needs **significant polish** before market launch. The biggest gaps are: NativeWind/StyleSheet inconsistency (now fixed), missing app store assets, incomplete payment flow in the UI, no onboarding, and the weekly counter fix was never verified in production.

**Overall Grade: B-** — Good bones, needs finishing work.

---

## 1. Build Status

### TypeScript Compilation
- **Before fixes:** ❌ 2 TypeScript errors in `profile.tsx`
  - `PRICING.FREE.dailyLimit` referenced (doesn't exist — was changed to `weeklyLimit`)
  - `"crown"` icon not in Ionicons type definitions
- **After fixes:** ✅ `npx tsc --noEmit` passes cleanly

### Dependencies
- ✅ `npm ls` resolves correctly (Turborepo workspaces)
- ✅ `node_modules` present (477 packages)
- ⚠️ No `package-lock.json` integrity check needed — looks healthy

### Expo Web Build
- ✅ Should work with `npx expo start --web` (Metro bundler configured)
- ⚠️ Not tested live (no Supabase env vars on this server)
- ⚠️ `app.json` still has `"eas.projectId": "your-project-id"` placeholder

---

## 2. Bugs Found & Fixed

### Bug 1: TypeScript Errors in profile.tsx (FIXED)
- **Issue:** `PRICING.FREE.dailyLimit` referenced but property was renamed to `weeklyLimit` during tier system update
- **Fix:** Changed to use `PRICING.FREE.weeklyLimit` and `user.weeklyGenerationsUsed`

### Bug 2: NativeWind className on 4 screens (FIXED)
- **Issue:** `gallery.tsx`, `profile.tsx`, `login.tsx`, `signup.tsx` all used NativeWind `className` props, but the app switched to `StyleSheet.create()` during the Dec 2025 refactor. These screens would render with **no styling on web** (invisible text, broken layouts).
- **Fix:** Rewrote all 4 files to use `StyleSheet.create()` with dynamic theme colors from `useThemeStore()`

### Bug 3: Tab Bar & Root Layout Hardcoded Dark Theme (FIXED)
- **Issue:** `_layout.tsx` (root) and `(tabs)/_layout.tsx` hardcoded dark theme colors (`#1a1a2e`, `#0f0f1a`), ignoring the user's light/dark theme preference
- **Fix:** Both now use `useThemeStore()` for dynamic colors

### Bug 4: Stale Pricing Display (FIXED)
- **Issue:** Signup page said "3 free portraits per day" (old tier system). Index page showed $7.99/mo (old price)
- **Fix:** Updated to "5 free portraits per week" and $9.99/mo to match current pricing

### Bug 5: Copyright Year (FIXED)
- **Issue:** Footer shows "© 2024 Pup Portrait"
- **Fix:** Updated to "© 2025 Pup Portrait"

### Bug 6: Pricing Mismatch (FIXED)
- **Issue:** `pricing.ts` had $7.99/mo and $79.99 lifetime, but target pricing is $9.99/mo and $29.99 lifetime
- **Fix:** Updated to $9.99/mo, $79.99/yr, $29.99 lifetime

---

## 3. Weekly Counter Auth Fix Review

### The Fix (Dec 2025, commit 25bf884)
The fix stores `accessToken` in Zustand's auth store and retrieves it directly instead of calling `supabase.auth.getSession()` (which was returning null).

### Assessment: ✅ SOLID, with caveats

**What's good:**
- Root cause correctly identified (auth session not reaching Edge Function)
- Access token stored in Zustand state, updated on every auth state change
- Edge Function has comprehensive logging for debugging
- Atomic increment functions in PostgreSQL (`increment_weekly_generations`, `increment_daily_generations`) prevent race conditions
- UTC-based date math for weekly/daily resets

**Concerns:**
1. **Token refresh:** The access token in Zustand could expire. Supabase tokens typically expire in 1 hour. The `onAuthStateChange` listener should catch refreshes, but there's no explicit token refresh before API calls.
   - **Recommendation:** Add a `getValidToken()` method that checks token expiry and refreshes if needed
2. **Never verified in production:** The progress.md testing checklist was written but the test was never completed (project went dormant Dec 28)
3. **`refreshUser()` after generation** is correct — updates the UI counter by re-fetching from database

### Migration 00003 (Atomic Functions)
- ✅ Well-written PostgreSQL functions with proper `SECURITY DEFINER`
- ✅ Handles week/day boundary resets atomically
- ✅ `get_generation_usage()` helper for display without incrementing
- ✅ Proper `GRANT` permissions for authenticated and service_role

---

## 4. UI/UX Review

### Landing Page (index.tsx) — ⭐⭐⭐⭐ Good
- Clean hero section with logo, tagline
- Breed selector with dropdown
- Theme selector with featured quick-picks
- Aspect ratio selector (premium locked)
- Social sharing buttons after generation
- Pricing teaser at bottom
- **Issues:** Very long page. Could benefit from better visual hierarchy.

### Home Page (tabs/home.tsx) — ⭐⭐⭐⭐ Good
- Usage counter card
- Theme chips (horizontal scroll)
- Breed/color/background selectors
- Portrait display with gradient overlay
- Generate button with loading state
- Upgrade CTA for free users

### Gallery (tabs/gallery.tsx) — ⭐⭐ Basic
- 2-column grid of portraits
- Empty states for unauthenticated and no-portraits
- **Missing:** No detail view, no delete, no share, no download, no full-screen view

### Profile (tabs/profile.tsx) — ⭐⭐⭐ Decent
- User info with avatar initial
- Stats cards (total created, remaining)
- Upgrade card with pricing
- Menu items (Edit Profile, Notifications, etc.)
- **Missing:** All menu items have `onPress={() => {}}` — not functional

### Login/Signup — ⭐⭐⭐ Standard
- Email/password forms
- Social login buttons (Google/Apple) — **not functional** (just UI)
- Error handling and validation
- **Missing:** Forgot password flow

---

## 5. Edge Functions Review

### generate-portrait/index.ts — ⭐⭐⭐⭐ Strong
- Good tier-based rate limiting (guest/free/premium/lifetime)
- Proper auth token validation
- Gemini API integration working
- Image upload to Supabase Storage
- Atomic counter increments via RPC
- Comprehensive logging
- **Issues:**
  - Google AI API key is logged in progress.md (security concern for public repos)
  - `gemini-2.0-flash-exp` model — experimental models may be deprecated. Should pin to stable.
  - No retry logic for Gemini API failures
  - No image size optimization / thumbnail generation

### create-checkout/index.ts — ⭐⭐⭐ Adequate
- Creates Stripe checkout sessions properly
- Gets/creates Stripe customer
- Supports monthly, yearly, lifetime plans
- **Issues:**
  - Price IDs use env vars with placeholder fallbacks — could silently fail
  - No error handling if Stripe customer creation fails mid-flow

### stripe-webhook/index.ts — ⭐⭐⭐⭐ Good
- Handles `checkout.session.completed`, `subscription.updated`, `subscription.deleted`, `invoice.payment_failed`
- Proper signature verification
- Updates both `subscriptions` table and `profiles` table
- **Issues:**
  - `customer.subscription.updated` has a bug: `userId` from metadata might be null, then it tries to find by subscription ID, but if found, it still uses `subscription.customer` to update profile (which is correct, but the `userId` variable is never reassigned)
  - Lifetime plan hardcodes 100 credits but PRICING config has no credit limit

---

## 6. App Store Readiness

### ❌ Missing for iOS App Store:
1. **EAS Project ID** — `app.json` has `"your-project-id"` placeholder
2. **App icons** — Need actual 1024x1024 icon (not just placeholder paths)
3. **Splash screen** — Need branded splash screen asset
4. **Privacy Policy URL** — Required by Apple, not created yet
5. **Terms of Service URL** — Required by Apple
6. **App Store screenshots** — Need 6.7", 6.1", iPad sizes
7. **App description & keywords** — Not written
8. **Review notes** — Apple needs test account credentials
9. **In-App Purchase setup** — Stripe web checkout won't work on iOS. Need to use Apple's IAP system or get exemption (reader apps).
10. **OAuth providers** — Google/Apple sign-in buttons exist but aren't functional
11. **Forgot password** flow missing

### ❌ Missing for Google Play:
1. **Privacy Policy** — Required
2. **Feature graphic** (1024x500)
3. **Screenshots** — Phone + 7" tablet + 10" tablet
4. **Content rating questionnaire**
5. **Data safety section** — Must declare data collection
6. **Signing keystore** — Need EAS build configuration

### ⚠️ Critical iOS Payment Issue:
Apple requires in-app purchases for digital goods. Using Stripe web checkout for subscriptions may get rejected. Options:
- Use `expo-in-app-purchases` or `react-native-purchases` (RevenueCat)
- Apply for "reader app" exemption (unlikely for this use case)
- Use Stripe for web only, Apple IAP for iOS, Google Play Billing for Android

---

## 7. Missing Features for Competitive Product

### Must-Have (Pre-Launch):
1. **Onboarding flow** — Show sample portraits, explain value proposition, guide first generation
2. **Download portrait** — Download/Share buttons exist but aren't functional
3. **Portrait detail view** — Tap a gallery item to see full-size, share, download
4. **Forgot password** — Standard auth flow
5. **Loading skeleton** — Better loading states than plain spinners
6. **Error recovery** — "Try again" buttons, offline handling
7. **Privacy Policy & Terms** — Legal pages (can be simple web pages)

### Nice-to-Have (Post-Launch):
1. **Portrait style selector** — Watercolor, oil painting, cartoon, realistic (backend supports it, UI doesn't expose it well)
2. **Upload your own photo** — Transform YOUR dog's photo into art (huge differentiator)
3. **Multiple pets support** — Cat portraits, exotic pets
4. **Social sharing with native share sheet** — Use `expo-sharing` for native share
5. **Push notifications** — "Your weekly portraits have reset!"
6. **Referral program** — "Share with a friend, both get a free portrait"
7. **Portrait history/favorites** — Mark favorites, organize by pet
8. **Animated portraits** — GIF/video output (premium)

---

## 8. Security Issues

1. **API key in progress.md** — Google AI API key is written in plain text in the progress file. Should be removed from version control.
2. **No rate limiting beyond tier limits** — A malicious user could spam the Edge Function. Consider adding IP-based rate limiting.
3. **Guest fingerprint is trivial to forge** — `generateDeviceId()` uses `Date.now() + Math.random()`. Easy to get unlimited guest portraits. Consider adding CAPTCHA or requiring email verification.
4. **CORS is `*`** — All Edge Functions allow any origin. Should restrict to app domains in production.

---

## 9. Code Quality Summary

| Area | Grade | Notes |
|------|-------|-------|
| Architecture | A- | Clean monorepo, good separation of concerns |
| TypeScript | B+ | Types well-defined, minor issues fixed |
| State Management | A- | Zustand is simple and effective |
| UI Consistency | B- | Mixed NativeWind/StyleSheet (now fixed) |
| Error Handling | C+ | Basic try/catch, no retry logic, no offline support |
| Testing | F | Zero tests (no unit, integration, or E2E tests) |
| Documentation | B+ | progress.md is thorough, CLAUDE.md is helpful |
| Security | C | API keys in docs, weak guest fingerprint, open CORS |
| Performance | B | No image optimization, no caching strategy |

---

## 10. Recommended Priority Fixes

### P0 (Before any public launch):
1. Remove API keys from version-controlled files
2. Add Privacy Policy and Terms of Service pages
3. Fix OAuth social login (Google at minimum)
4. Test weekly counter fix end-to-end
5. Functional download/share for generated portraits

### P1 (Before app store submission):
1. Add onboarding flow
2. Create all app store assets (icons, screenshots, descriptions)
3. Set up EAS Build configuration
4. Implement Apple IAP for iOS (or web-only launch first)
5. Add forgot password flow
6. Portrait detail/full-screen view

### P2 (Post-launch improvements):
1. Upload your own dog photo feature
2. Add unit/integration tests
3. Thumbnail generation pipeline
4. Push notifications
5. Referral system
6. Analytics (Mixpanel/Amplitude/PostHog)

---

*Report generated 2026-02-03 by Jasper*
