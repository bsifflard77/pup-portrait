# App Icons

Drop a single 1024×1024 PNG named `icon-source-1024.png` here, then run:

```bash
cd apps/desktop
npm run icon
```

Tauri will auto-generate every required icon size for macOS, Windows, and Linux:

- `32x32.png`, `128x128.png`, `128x128@2x.png` (general)
- `icon.icns` (macOS)
- `icon.ico` (Windows)
- `Square*Logo.png` (Microsoft Store tiles)

The icon should be square, with transparent or solid-color background. Avoid text-heavy icons — they don't read well at 32×32.

Per the visual-assets-spec, the launch icon is the pup silhouette in brand amber (#F2994A) on cream (#FFF4E6) with a thin navy outline.
