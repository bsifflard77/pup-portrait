# Pup Portrait — Web Deployment Log
**Date:** 2026-02-03  
**Agent:** Pricing & Web Deployment Subagent

---

## Summary

Successfully built Expo web export and prepared for Vercel deployment. The app builds cleanly for web with zero errors.

---

## What Was Done

### 1. ✅ Verified Expo Web Build Works
```bash
cd apps/mobile && npx expo export --platform web
```
- **Result:** Build successful in ~18s first run, ~1.3s cached
- **Output:** `apps/mobile/dist/` (6MB total)
- **Bundle:** 1.88MB JS bundle (901 modules)
- **Assets:** 37 font/image assets (icon fonts + navigation assets)
- **No errors or warnings**

### 2. ✅ Created Vercel Configuration
**File:** `apps/mobile/vercel.json`
- SPA rewrite rules (all routes → index.html for client-side routing)
- Cache headers for static assets (1yr immutable for `/_expo/static/` and `/assets/`)
- Framework: null (static export, not a framework project)

### 3. ✅ Enhanced Web Build with SEO
**File:** `apps/mobile/scripts/enhance-web-build.sh`

Post-build script that injects:
- Open Graph meta tags (title, description, site_name)
- Twitter Card meta tags
- SEO meta tags (description, keywords, author, canonical URL)
- PWA meta tags (theme-color, apple-mobile-web-app-capable)
- `manifest.json` for PWA installation
- `robots.txt` with sitemap reference
- `sitemap.xml` with homepage URL

### 4. ✅ Reviewed Desktop Web Appearance
The app already has proper web-specific handling:
- `Platform.OS === 'web'` checks throughout
- `maxWidth: 480` for phone-like centered layout (intentional for app-first product)
- Web-specific padding adjustments
- All screens consistent with this approach

**Decision:** Keep the 480px centered layout. This is the right call for an app-first product where web is secondary. The centered phone-sized UI on desktop is a standard pattern (e.g., Instagram web, TikTok web) and communicates "this is an app you should download."

---

## Deployment: Ready to Deploy

### Deploy Command (when Bill is ready):
```bash
cd apps/mobile

# Build
npx expo export --platform web

# Enhance with SEO
bash scripts/enhance-web-build.sh

# Deploy to Vercel (first time — will prompt for project setup)
npx vercel deploy dist/ --prod

# Or link to existing project and deploy
npx vercel --prod
```

### Pre-Deployment Checklist:
- [ ] Buy/configure `pupportrait.com` domain
- [ ] Set up Vercel project (can be done during first deploy)
- [ ] Add domain to Vercel project settings
- [ ] Configure Supabase environment variables in Vercel:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `EXPO_PUBLIC_GOOGLE_AI_KEY`
- [ ] Create and upload OG image (`/og-image.png`) for social sharing
- [ ] Test on desktop browsers (Chrome, Safari, Firefox)
- [ ] Test on mobile browsers (Safari iOS, Chrome Android)

### Environment Variables Note:
The Expo web build bakes environment variables into the JS bundle at build time (via `EXPO_PUBLIC_` prefix). You'll need to either:
1. Set them in Vercel project settings and use Vercel's build command
2. Or build locally with `.env` file and deploy the `dist/` folder

**Recommended approach:** Deploy the `dist/` folder directly (since it's already built with the right env vars from the local `.env`).

---

## What Doesn't Work on Web (Known Limitations)

| Feature | Status | Notes |
|---------|--------|-------|
| Auth (email/password) | ✅ Works | Uses localStorage fallback for secure-store |
| Portrait generation | ✅ Works | Calls Supabase Edge Function (same as mobile) |
| Theme toggle | ✅ Works | Light/dark mode |
| Navigation | ✅ Works | Expo Router client-side routing |
| Stripe checkout | ✅ Works | Web Stripe Checkout redirect |
| Image sharing | ⚠️ Partial | No native share sheet; falls back to copy link |
| Secure store | ⚠️ Fallback | Uses localStorage (acceptable for web) |
| Push notifications | ❌ N/A | Not applicable for web version |
| SEO/SSR | ❌ SPA | Single-page app — no server-side rendering |

---

## Recommendations for Next Steps

### Phase 1 (Now): Deploy Static Expo Web
- Just deploy `dist/` to Vercel
- Total cost: $0 (Vercel hobby plan)
- Time: 10 minutes once domain is configured

### Phase 2 (Week 2-3): Next.js Landing Page
- Create `apps/web/` with Next.js for proper SEO landing page
- Expo web app at `app.pupportrait.com`
- Marketing site at `pupportrait.com`
- See `docs/WEB-VERSION-PLAN.md` for full plan

### Phase 3: Ongoing
- Add blog content for SEO
- Public gallery with individual portrait pages
- Open Graph images for shared portraits

---

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `apps/mobile/vercel.json` | Created | Vercel deployment configuration |
| `apps/mobile/scripts/enhance-web-build.sh` | Created | Post-build SEO enhancement script |
| `apps/mobile/web/index.html` | Created | Custom index template (not used by Expo 54, kept for reference) |
| `apps/mobile/dist/` | Generated | Static web export (gitignored) |

---

*Log created 2026-02-03*
