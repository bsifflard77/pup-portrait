#!/bin/bash
# Post-build script to enhance the Expo web export with SEO meta tags
# Run after: npx expo export --platform web

DIST_DIR="$(dirname "$0")/../dist"
INDEX_FILE="$DIST_DIR/index.html"

if [ ! -f "$INDEX_FILE" ]; then
  echo "Error: $INDEX_FILE not found. Run 'npx expo export --platform web' first."
  exit 1
fi

echo "Enhancing web build with SEO meta tags..."

# Replace the <title> and add meta tags after it
sed -i 's|<title>Pup Portrait</title>|<title>Pup Portrait — AI Dog Portrait Generator</title>\
    <meta name="description" content="Create stunning AI-powered portraits of any dog breed in seconds. Choose from 100+ breeds, seasonal themes, and beautiful art styles. Free to try!" />\
    <meta name="keywords" content="AI pet portrait, dog portrait generator, AI dog art, pet painting, custom pet portrait, AI art, dog breed portrait" />\
    <meta name="author" content="Pup Portrait" />\
    <meta property="og:type" content="website" />\
    <meta property="og:url" content="https://pupportrait.com/" />\
    <meta property="og:title" content="Pup Portrait — AI Dog Portrait Generator" />\
    <meta property="og:description" content="Create stunning AI-powered portraits of any dog breed in seconds. Free to try!" />\
    <meta property="og:site_name" content="Pup Portrait" />\
    <meta property="twitter:card" content="summary_large_image" />\
    <meta property="twitter:title" content="Pup Portrait — AI Dog Portrait Generator" />\
    <meta property="twitter:description" content="Create stunning AI-powered portraits of any dog breed in seconds. Free to try!" />\
    <meta name="theme-color" content="#1a1a2e" />\
    <meta name="apple-mobile-web-app-capable" content="yes" />\
    <meta name="apple-mobile-web-app-title" content="Pup Portrait" />\
    <link rel="canonical" href="https://pupportrait.com/" />|' "$INDEX_FILE"

echo "✅ SEO meta tags injected into index.html"

# Create a simple manifest.json for PWA
cat > "$DIST_DIR/manifest.json" << 'EOF'
{
  "name": "Pup Portrait",
  "short_name": "PupPortrait",
  "description": "AI Dog Portrait Generator — Create stunning portraits of any dog breed in seconds",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#1a1a2e",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/favicon.ico",
      "sizes": "64x64",
      "type": "image/x-icon"
    }
  ]
}
EOF

echo "✅ manifest.json created"

# Create robots.txt
cat > "$DIST_DIR/robots.txt" << 'EOF'
User-agent: *
Allow: /
Sitemap: https://pupportrait.com/sitemap.xml
EOF

echo "✅ robots.txt created"

# Create basic sitemap
cat > "$DIST_DIR/sitemap.xml" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://pupportrait.com/</loc>
    <lastmod>2026-02-03</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://pup-portrait.com/pricing</loc>
    <lastmod>2026-08-25</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://pup-portrait.com/privacy</loc>
    <lastmod>2026-08-25</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://pup-portrait.com/terms</loc>
    <lastmod>2026-08-25</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>
EOF

echo "✅ sitemap.xml created"
echo "🎉 Web build enhancement complete!"
