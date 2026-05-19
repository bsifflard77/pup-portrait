# Pup Portrait — Web Version Plan
**Date:** 2026-02-03  
**Status:** Planning  

---

## Current State

The app already uses **Expo with Metro web bundler**, meaning it can run in a browser via `npx expo start --web`. This is the fastest path to a web presence.

### What Works Today:
- ✅ Landing page renders in browser
- ✅ Portrait generation works via web
- ✅ Auth (email/password) works via localStorage
- ✅ Theme toggle (light/dark) works
- ✅ All StyleSheet-based screens render properly

### What Doesn't Work:
- ❌ `expo-secure-store` falls back to localStorage on web (not ideal for tokens)
- ❌ Native share sheet (`expo-sharing`) doesn't work on web
- ❌ No SEO — Expo web outputs a single-page app (SPA) with no server-side rendering
- ❌ No meta tags, Open Graph, or social preview cards

---

## Option 1: Expo Web Export to Vercel (Recommended First Step)

### How It Works
Expo can export a static web build that deploys to any static hosting (Vercel, Netlify, Cloudflare Pages).

```bash
# Build static web export
cd apps/mobile
npx expo export --platform web

# Output goes to dist/ folder
# Deploy to Vercel:
vercel deploy dist/
```

### Pros:
- Zero extra code needed
- Same codebase as mobile
- Stripe web checkout works perfectly
- Fast to deploy (today)

### Cons:
- SPA = no SEO
- No server-side rendering
- Single bundle = slower initial load
- Can't do dynamic meta tags for social sharing

### Deployment:
```
pupportrait.com → Vercel (Expo web export)
```

### Cost: Free (Vercel hobby plan)

---

## Option 2: Next.js Landing Page + Expo Web App (Recommended for Growth)

### Architecture
```
pupportrait.com/           → Next.js (SSR landing page, SEO, blog)
pupportrait.com/app/       → Expo Web (the actual app)
pupportrait.com/api/       → Next.js API routes (optional)
```

### Landing Page (Next.js)
A proper marketing website with:
- **Hero section** — "Turn Any Dog Into Art" with sample portraits
- **How it works** — 3 steps: Choose breed → Pick style → Get portrait
- **Sample gallery** — Grid of beautiful AI portraits
- **Pricing section** — Free vs Premium comparison
- **Testimonials** — User quotes (can be seeded initially)
- **FAQ** — Common questions
- **SEO** — Meta tags, Open Graph, structured data
- **Blog** — "Best AI Pet Portrait Apps 2026", "How AI Creates Dog Art"

### Implementation Plan
```
apps/
  mobile/          # Existing Expo app (iOS, Android, Web)
  web/             # New Next.js marketing site
    pages/
      index.tsx        # Landing page
      pricing.tsx      # Pricing page
      gallery.tsx      # Public gallery
      blog/            # Blog posts (MDX)
      privacy.tsx      # Privacy policy
      terms.tsx        # Terms of service
    components/
      Hero.tsx
      SampleGallery.tsx
      PricingTable.tsx
      Footer.tsx
```

### Key Pages:

#### Landing Page (`/`)
```
[Hero: "AI Pet Portraits in Seconds"]
[Before/After transformation demo]
[Sample Gallery - 12 best portraits]
[How it Works - 3 steps]
[Pricing Cards - Free / Premium / Lifetime]
[Social proof / testimonials]
[CTA: "Create Your First Portrait Free"]
[Footer: Links, social, legal]
```

#### Pricing Page (`/pricing`)
- Detailed feature comparison table
- FAQ about billing
- Stripe checkout integration
- Monthly / Yearly / Lifetime toggle

#### Public Gallery (`/gallery`)
- Opt-in public gallery of user portraits
- Filterable by breed, style, theme
- Share individual portraits (great for SEO)
- Each portrait gets its own URL with Open Graph tags

#### Blog (`/blog`)
- SEO content targeting:
  - "AI pet portrait generator"
  - "custom dog portrait online"
  - "AI art for pets"
  - "gift ideas for dog lovers"
- 5-10 articles for launch

### Estimated Timeline: 1-2 weeks
### Estimated Cost: $0 (Vercel hobby plan)

---

## Option 3: Standalone Web App (Future)

If the web version needs features the Expo app can't support (like drag-and-drop photo upload, complex gallery management, etc.), build a dedicated web app:

```
apps/
  web-app/         # Next.js full web app
    pages/
      app/             # Web-only app experience
        create.tsx     # Portrait creation
        gallery.tsx    # User gallery
        profile.tsx    # Account management
```

This shares `packages/shared` for types, pricing, breeds, etc. but has its own UI optimized for desktop browsers.

**Timeline:** 3-4 weeks  
**When:** After mobile launch proves product-market fit

---

## Recommended Approach

### Phase 1 (This Week): Expo Web → Vercel
1. Run `npx expo export --platform web`
2. Deploy to Vercel at `app.pupportrait.com`
3. Buy domain `pupportrait.com`
4. Set up DNS

### Phase 2 (Week 2-3): Next.js Landing Page
1. Create `apps/web` with Next.js
2. Build landing page, pricing, privacy/terms
3. Deploy to `pupportrait.com` (Vercel)
4. Expo web app at `app.pupportrait.com`

### Phase 3 (Month 2): SEO & Content
1. Add blog with 5-10 SEO articles
2. Public gallery with individual portrait URLs
3. Open Graph tags for social sharing
4. Google Search Console setup
5. Sitemap.xml

### Phase 4 (Month 3+): Dedicated Web App
1. If web traffic justifies it, build dedicated web experience
2. Upload your own photo (drag & drop)
3. Advanced gallery management
4. Desktop-optimized layouts

---

## Domain & Hosting

| Service | URL | Cost |
|---------|-----|------|
| Domain | pupportrait.com | ~$12/yr |
| Web hosting | Vercel (hobby) | Free |
| CDN/images | Supabase Storage | Included |
| SSL | Vercel (auto) | Free |

**Total: ~$12/year**

---

## SEO Strategy for Web

### Target Keywords:
- "AI pet portrait" (1.9K monthly searches)
- "AI dog portrait generator" (880)
- "custom pet portrait" (6.6K)
- "dog portrait app" (720)
- "pet portrait from photo" (4.4K)
- "AI pet art" (590)

### Technical SEO:
- Server-rendered pages (Next.js)
- Fast Core Web Vitals (Vercel edge)
- Structured data (Product, FAQ, HowTo schemas)
- Sitemap.xml + robots.txt
- Open Graph + Twitter Card meta tags

### Content Strategy:
- Blog posts targeting long-tail keywords
- Each public portrait = unique indexed page
- Breed-specific landing pages ("Golden Retriever AI Portrait")

---

*Plan created 2026-02-03 by Jasper*
