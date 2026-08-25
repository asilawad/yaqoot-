# Phase 1 Master Guide — Project Cleanup & Offline Hardening

**Scope:** Remove seed/demo data · Self-host the real production font (Cairo) · Fix placeholder metadata · Remove dead build artifacts
**Repo:** `artifacts/yaqoot-medical/` (all paths below are relative to this folder unless stated otherwise)
**Risk level:** Low — every change in this phase is either a pure deletion of unused code, or an additive/config-level change. No business logic, state management, or data flow is touched.
**Depends on:** Nothing (clean starting point)
**Exit condition:** App builds, runs, and is byte-for-byte functionally identical to today — except it starts with zero fake patients, loads zero external network resources, and carries no dead files.

---

## 0. Why this phase is first, and why it's safe

Every change here is either **subtractive** (deleting things nothing depends on) or **purely configuration-level** (swapping a CDN font reference for a local one, editing static text in `index.html`). None of it touches `repository.ts`'s business logic, `DataContext`'s state management, routing, or any component's render logic beyond a single `fontFamily`/import path. That means:

- There is no code path where this phase can introduce a runtime bug in patient/visit/vitals logic — we're not touching that code.
- Every step is independently verifiable in the browser via the existing `pnpm dev` / `pnpm build` / `pnpm serve` scripts — no new tooling (Tauri, SQLite) is introduced yet, so if something breaks, the blast radius is obvious and small.
- Performance is only improved here (fewer external network round-trips at startup), never at risk.

---

## Files touched in this phase

| File | Action | Reason |
|---|---|---|
| `src/contexts/DataContext.tsx` | Modify | Gate demo-data seeding to dev-only |
| `src/index.css` | Modify | Replace Google Fonts `@import` for Cairo with a local `@font-face` |
| `public/fonts/cairo/*.woff2` | **Create** (5 files) | Self-hosted Cairo font weights |
| `index.html` | Modify | Remove dead "Inter" Google Fonts tags + preconnect hints; fix placeholder meta/OG text |
| `src/pages/PatientList.tsx.bak`, `.bak2`, `.bak3`, `.bak4` | **Delete** | Orphaned, unimported dead files |
| `src/pages/PatientProfile.tsx.bak`, `.bak2` | **Delete** | Orphaned, unimported dead files |
| `src/pages/VisitPage.tsx.bak`, `.bak2` | **Delete** | Orphaned, unimported dead files |
| `src/pages/DataManagementPage.tsx.bak` | **Delete** | Orphaned, unimported dead files |
| `src/layouts/Sidebar.tsx.bak` | **Delete** | Orphaned, unimported dead files |
| `src/layouts/AppLayout.tsx.bak` | **Delete** | Orphaned, unimported dead files |

---

## Step 1 — Gate demo-data seeding to development only

### Rationale
On every launch with an empty store, the app currently auto-creates two fabricated patients. A real clinic's first launch must start genuinely empty. We keep the seeding function available for your own local development, and simply stop it from ever running in a production build.

### Edit `src/contexts/DataContext.tsx`

Find:

```tsx
useEffect(() => {
  repo.seedInitialData();
  refreshData();
}, []);
```

Replace with:

```tsx
useEffect(() => {
  // Demo/seed data must never reach a production build — a real clinic's
  // first launch has to start genuinely empty. `import.meta.env.DEV` is a
  // Vite-provided compile-time constant: true under `vite dev`, false in
  // any `vite build` output, so this branch is fully removed (dead-code
  // eliminated) from the production bundle by Vite's minifier.
  if (import.meta.env.DEV) {
    repo.seedInitialData();
  }
  refreshData();
}, []);
```

No other line in this file changes.

---

## Step 2 — Self-host the Cairo font (remove the offline-breaking CDN dependency)

### Rationale — and a correction worth noting

While preparing this guide I re-checked the codebase and found the original migration plan's font note was imprecise, so here's the corrected picture:

- **"Inter"** is loaded via a `<link>` tag in `index.html`, but a full-text search confirms it is **never referenced by any `font-family` anywhere in the app** — it's pure dead weight, safe to just delete outright.
- **"Cairo"** is the font actually used everywhere: it's set as `--app-font-sans` in `index.css`, applied to `<body>`, and hardcoded via inline `fontFamily: "'Cairo', sans-serif"` across `Sidebar.tsx`, `PatientProfile.tsx`, `AddPatientModal.tsx`, `SettingsPage.tsx`, and more. **This is the one that needs self-hosting** — it's currently pulled from `fonts.googleapis.com` via `@import` in `index.css`, which silently fails with no internet connection, causing the app to fall back to a generic system sans-serif on every offline launch.

### 2a — Obtain the Cairo font files (one-time manual step)

The current `@import` requests weights `300;400;500;600;700`. Download matching **static WOFF2** files (not the variable-font version, for maximum WebView2 compatibility) using either method:

**Method A — google-webfonts-helper (recommended, fastest):**
1. Go to `https://gwfh.mranftl.com/fonts/cairo?subsets=arabic,latin`
2. Select weights: **300, 400, 500, 600, 700**
3. Under "Copy CSS", set the CSS path to `../fonts/cairo/` (matches the folder structure below)
4. Click "Download files" — you'll get a `.zip` containing `cairo-v*-arabic_latin-300.woff2` (etc.) for each weight

**Method B — Google Fonts' own download:**
1. Go to `https://fonts.google.com/specimen/Cairo`
2. Download the family, which gives you `.ttf` files
3. Convert to `.woff2` locally (e.g. `npx google-font-installer` or any TTF→WOFF2 converter) — WOFF2 is required for reasonable file size and universal WebView2 support

### 2b — Place the files

Create the folder and place the 5 files, renamed exactly as below:

```
public/
└── fonts/
    └── cairo/
        ├── cairo-300.woff2
        ├── cairo-400.woff2
        ├── cairo-500.woff2
        ├── cairo-600.woff2
        └── cairo-700.woff2
```

> Vite serves everything under `public/` from the app's root path automatically, so these will be reachable at `/fonts/cairo/cairo-400.woff2` etc. in both dev and production builds — no Vite config changes needed.

### 2c — Edit `src/index.css`

Find the very first line of the file:

```css
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');
```

Replace it with local `@font-face` declarations:

```css
@font-face {
  font-family: 'Cairo';
  src: url('/fonts/cairo/cairo-300.woff2') format('woff2');
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Cairo';
  src: url('/fonts/cairo/cairo-400.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Cairo';
  src: url('/fonts/cairo/cairo-500.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Cairo';
  src: url('/fonts/cairo/cairo-600.woff2') format('woff2');
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Cairo';
  src: url('/fonts/cairo/cairo-700.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

**Error-handling note:** `font-display: swap` ensures that if a font file is ever missing or slow to load (e.g. a corrupted install), the browser/WebView immediately renders text in the fallback stack instead of showing invisible text — the app never blocks or breaks visually on a font issue.

### 2d — Strengthen the fallback stack (defense in depth)

While in this file, find the two existing declarations that hardcode a single-font stack with no fallback beyond generic `sans-serif`:

```css
--app-font-sans: 'Cairo', sans-serif;
```
```css
font-family: 'Cairo', sans-serif;
```

Update **both** occurrences to include a proper Arabic-aware fallback chain, so that even in the extremely unlikely case all 5 font files fail to load, Arabic text still renders legibly using the Windows-native Arabic UI font instead of tofu/system-default:

```css
--app-font-sans: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
```
```css
font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
```

*(Everywhere else in the codebase that hardcodes `fontFamily: "'Cairo', sans-serif"` inline is out of scope for this phase — those are cosmetic, non-network-dependent, and already safe since the browser only needs the fallback chain to matter if `Cairo` itself fails to resolve, which is now handled centrally by the `@font-face` block above.)*

---

## Step 3 — Fix `index.html`: remove dead CDN tags, fix placeholder metadata

### Rationale
Two separate issues live in this one file: (a) three tags loading the unused "Inter" font from Google's CDN — a pure offline-reliability bug — and (b) placeholder copy that was never replaced with real content.

### Edit `index.html`

Find this block:

```html
    <meta name="description" content="Yaqoot Medical Clinic — built on Replit. Update this description to reflect the app." />
    <meta name="robots" content="index, follow" />
    <meta property="og:title" content="Yaqoot Medical Clinic" />
    <meta property="og:description" content="Yaqoot Medical Clinic — built on Replit. Update this description to reflect the app." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Yaqoot Medical Clinic" />
    <meta name="twitter:description" content="Yaqoot Medical Clinic — built on Replit. Update this description to reflect the app." />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Replace it with:

```html
    <meta name="description" content="Yaqoot Medical Clinic — offline-first patient records and visit management for clinical staff." />
    <meta name="robots" content="index, follow" />
    <meta property="og:title" content="Yaqoot Medical Clinic" />
    <meta property="og:description" content="Yaqoot Medical Clinic — offline-first patient records and visit management for clinical staff." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Yaqoot Medical Clinic" />
    <meta name="twitter:description" content="Yaqoot Medical Clinic — offline-first patient records and visit management for clinical staff." />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

(Feel free to further tune the description copy to your liking — the important structural change is the **removal of the two `preconnect` hints and the `Inter` stylesheet `<link>`**, which are the lines actually responsible for the offline-breaking network calls. Nothing on the page ever used the Inter font, so nothing visually changes.)

---

## Step 4 — Remove orphaned `.bak` files

### Rationale
11 backup files sit alongside live components, unreferenced by any import (verified via full-repo grep before writing this guide). They add merge-conflict risk and repo clutter with zero functional purpose — git history already preserves prior versions.

### Delete these files

```bash
cd artifacts/yaqoot-medical
git rm src/pages/PatientList.tsx.bak
git rm src/pages/PatientList.tsx.bak2
git rm src/pages/PatientList.tsx.bak3
git rm src/pages/PatientList.tsx.bak4
git rm src/pages/PatientProfile.tsx.bak
git rm src/pages/PatientProfile.tsx.bak2
git rm src/pages/VisitPage.tsx.bak
git rm src/pages/VisitPage.tsx.bak2
git rm src/pages/DataManagementPage.tsx.bak
git rm src/layouts/Sidebar.tsx.bak
git rm src/layouts/AppLayout.tsx.bak
```

(If any of these are untracked in your local working copy rather than committed, use `rm` instead of `git rm` for those specific files.)

---

## Full Verification Checklist

Work through every item in order. Do not proceed to Phase 2 until all boxes are checked.

### A. Build integrity
- [ ] `pnpm --filter @workspace/yaqoot-medical run typecheck` — passes with no new errors
- [ ] `pnpm --filter @workspace/yaqoot-medical run build` — completes with no errors or new warnings
- [ ] `git status` shows only the expected changes: 3 modified files (`DataContext.tsx`, `index.css`, `index.html`), 5 new font files under `public/fonts/cairo/`, 11 deleted `.bak` files

### B. Dev-mode regression check (seed data)
- [ ] Clear `localStorage` for the dev origin in DevTools
- [ ] Run `pnpm --filter @workspace/yaqoot-medical run dev`
- [ ] Confirm the 2 demo patients still appear (dev workflow intact)

### C. Production build check (seed data)
- [ ] Run `pnpm --filter @workspace/yaqoot-medical run build` then `run serve`
- [ ] Open the preview URL in a fresh/incognito window
- [ ] Confirm the patient list is **empty**, no console errors
- [ ] Manually create a patient — confirm create/list/refresh still works end-to-end

### D. Offline hardening check (the most important test for this phase)
- [ ] With the production preview (`run serve`) still running, open DevTools → **Network tab** → set throttling to **Offline**
- [ ] Hard-reload the page (Ctrl+Shift+R)
- [ ] **Expected: the app still loads and renders fully**, with the Cairo font visually applied (headings/labels should look identical to before — check the sidebar title, patient table headers, and buttons)
- [ ] In the Network tab, confirm **zero requests** to `fonts.googleapis.com` or `fonts.gstatic.com` — filter by "font" or search the domain to confirm
- [ ] Confirm the 5 local font files (`cairo-300.woff2` … `cairo-700.woff2`) appear in the Network tab loaded from your own origin (e.g. `http://localhost:PORT/fonts/cairo/...`), with status `200` (or `304`/`disk cache` on reload)

### E. Visual regression check
- [ ] Compare the sidebar, patient list table, and patient profile page against the live production site (`yaqoot-yaqoot-medical.vercel.app`) or a screenshot taken before this phase — text weight/spacing should be **pixel-identical**, since we're loading the exact same font family and weights, just from a local path instead of a CDN
- [ ] Confirm Arabic text (patient names, sidebar labels) still renders correctly — no tofu boxes, no fallback-font substitution

### F. Metadata check
- [ ] View page source (Ctrl+U) on the production preview — confirm the `<meta name="description">` and OG tags show your new copy, not the "built on Replit" placeholder
- [ ] Confirm no `preconnect` or Google Fonts `<link>` tags remain in the rendered `<head>`

### G. Cleanup check
- [ ] `find src -name "*.bak*"` (run from `artifacts/yaqoot-medical`) returns **no results**
- [ ] `pnpm --filter @workspace/yaqoot-medical run build` still succeeds after deletion (confirms nothing was secretly importing a `.bak` file)

---

## Rollback

Every change in this phase is isolated to the 3 modified files + 1 new folder + 11 deletions listed above. If anything fails verification:

```bash
git checkout -- src/contexts/DataContext.tsx src/index.css index.html
git checkout -- src/pages/PatientList.tsx.bak src/pages/PatientList.tsx.bak2 src/pages/PatientList.tsx.bak3 src/pages/PatientList.tsx.bak4 src/pages/PatientProfile.tsx.bak src/pages/PatientProfile.tsx.bak2 src/pages/VisitPage.tsx.bak src/pages/VisitPage.tsx.bak2 src/pages/DataManagementPage.tsx.bak src/layouts/Sidebar.tsx.bak src/layouts/AppLayout.tsx.bak
rm -rf public/fonts/cairo
```

This fully restores the pre-Phase-1 state with no side effects on any other part of the app.

---

## Sign-off

Once **every checkbox in sections A–G** is confirmed, Phase 1 is complete: the app is functionally identical to before, starts with zero fake data in production, loads zero external network resources, and carries no dead files. This is the exact "known-good, fully offline-hardened baseline" that Phase 2 (Tauri shell integration) will wrap — and because Phase 2 only adds a native shell around this working build without touching its internals, any issue that surfaces there will be clearly attributable to the shell, not to leftover Phase 1 risk.

Reply once this checklist is fully green, and I'll generate **Phase 2: Desktop Shell Integration**.
