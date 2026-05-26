# Pup Portrait — Tauri 2 Desktop Wrapper

This is a drop-in Tauri 2 scaffold that wraps the Pup Portrait web app into a native Mac, Windows, and Linux desktop application.

## Goal

- ~10 MB Mac .app bundle (vs ~120 MB Electron equivalent)
- ~30 MB RAM at idle (vs ~250 MB Electron)
- Mac App Store + Microsoft Store distribution
- Same web codebase, zero changes to React Native / Expo source

## Setup (one-time)

### Prerequisites
- **macOS:** Xcode Command Line Tools, Rust (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`)
- **Windows:** Visual Studio Build Tools 2022 with C++ workload, Rust, WebView2 Runtime
- **Linux:** `libwebkit2gtk-4.1-dev`, `build-essential`, Rust

### Install Tauri CLI
```bash
cargo install tauri-cli --version "^2.0"
# OR via npm:
npm install -g @tauri-apps/cli@latest
```

### Drop into the monorepo

Copy this entire folder to `apps/desktop/` in the working repo (~/clawd/pup-portrait):

```bash
cp -r 30_Specs/tauri-desktop ~/clawd/pup-portrait/apps/desktop
cd ~/clawd/pup-portrait/apps/desktop
npm install
```

### Add to root `turbo.json`

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"]
    },
    "desktop:dev": {
      "cache": false,
      "persistent": true
    },
    "desktop:build": {
      "dependsOn": ["^build"],
      "outputs": ["src-tauri/target/**"]
    }
  }
}
```

Add the workspace to root `package.json`:
```json
"workspaces": [
  "apps/mobile",
  "apps/web",
  "apps/desktop",
  "packages/*"
]
```

## Dev workflow

```bash
# Terminal 1: start the Expo web dev server
cd apps/mobile && npm run web   # serves http://localhost:8081

# Terminal 2: start Tauri dev (will load localhost:8081 in a native window)
cd apps/desktop && npm run tauri dev
```

## Production build

### Mac App Store build (Day 5)
```bash
cd apps/desktop
APPLE_ID=bsifflard@monomoystrategies.com \
APPLE_PASSWORD=<app-specific-password> \
APPLE_TEAM_ID=<your team ID> \
npm run tauri build -- --target universal-apple-darwin --bundles app,dmg
```

Output: `src-tauri/target/universal-apple-darwin/release/bundle/macos/Pup Portrait.app`

### Notarization (automatic with Tauri)
Set these env vars before `tauri build`:
- `APPLE_API_ISSUER` — issuer ID from App Store Connect → Users and Access → Keys
- `APPLE_API_KEY` — Key ID
- `APPLE_API_KEY_PATH` — path to `AuthKey_XXXXXXX.p8` file
- `APPLE_SIGNING_IDENTITY` — `Apple Distribution: Monomoy Strategies LLC (TEAM_ID)`

Tauri will automatically code-sign + notarize during the build.

### Windows build (Day 7 or Week 2)
```bash
npm run tauri build -- --target x86_64-pc-windows-msvc --bundles msi,nsis
```

Sign with your Authenticode certificate:
```bash
signtool sign /f cert.pfx /p <password> /tr http://timestamp.digicert.com /td sha256 /fd sha256 "Pup Portrait.msi"
```

## Submitting to the Mac App Store

1. In App Store Connect, create a new Mac app:
   - Bundle ID: `com.monomoystrategies.pupportrait` (same as iOS — Apple allows this)
   - SKU: `pupportrait-mac-001`
   - Primary language: English (U.S.)
2. Upload the .app via Transporter (drag and drop the .app, click Deliver)
3. In App Store Connect, fill in metadata (reuse iOS listing with Mac-specific screenshots)
4. Submit for review

Apple typically approves Mac App Store submissions in 24–48 hours.

## File layout

```
apps/desktop/
├── package.json              # npm scripts and Tauri JS bindings
├── README.md                 # this file
└── src-tauri/
    ├── Cargo.toml            # Rust dependencies
    ├── tauri.conf.json       # Tauri configuration (window, bundle, security)
    ├── build.rs              # Cargo build script for Tauri
    ├── capabilities/
    │   └── default.json      # security capabilities (what the WebView can do)
    ├── icons/                # app icons (drop in 1024.png, generate rest with `tauri icon`)
    └── src/
        └── main.rs           # Rust entry point
```

## What this scaffold gives you

- Loads `https://app.pup-portrait.com` in production, `http://localhost:8081` in dev
- Native Mac/Windows/Linux window with proper title, icon, and menu bar
- File save dialogs work natively (for "Save portrait as...")
- Native share menu integration on Mac (via macOS sharing services)
- Auto-update via Tauri's built-in updater (configure in tauri.conf.json after launch)
- Code-signed and notarized for Mac App Store distribution
