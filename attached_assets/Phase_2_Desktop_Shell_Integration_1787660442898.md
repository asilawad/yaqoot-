# Phase 2 Master Guide — Desktop Shell Integration (Tauri 2.x)

**Scope:** Scaffold Tauri 2.x · Configure window properties · Bundle native app icons · Verify fully offline native launch
**Repo:** `artifacts/yaqoot-medical/` (all paths below are relative to this folder unless stated otherwise)
**Risk level:** Low-medium — this phase introduces new tooling (Rust, Tauri CLI) but touches **zero existing application code**. The React app, `repository.ts`, `DataContext`, and every page/component are wrapped, not modified.
**Depends on:** Phase 1 fully signed off (clean, offline-hardened web build)
**Exit condition:** A native `.exe` window opens, renders the exact same app you verified in Phase 1, and works fully offline — while every business-logic file remains byte-for-byte untouched.

---

## 0. Why this phase deliberately does *not* touch storage yet

Tauri's SQLite plugin (Phase 3) only runs inside the Tauri runtime — it's untestable from a plain browser. So this phase's entire job is: **get a native shell working around the app exactly as it is today, still reading/writing `localStorage`, which Tauri's WebView2 supports natively with zero extra work.** That isolates one risk at a time:

- If something breaks in this phase, you know with certainty it's a **packaging/shell** problem, not a data-layer problem — because the data layer hasn't changed.
- Phase 3 then swaps storage *inside a shell you've already proven works*, so any issue there is unambiguously a **storage** problem.

No file under `src/` is modified in this phase. Everything added lives in a new `src-tauri/` folder plus a handful of new `package.json` scripts.

---

## 1. Prerequisites (one-time machine setup)

Install these on your Windows development machine before starting. Skip anything already installed.

1. **Rust toolchain**: install via `https://rustup.rs` (downloads `rustup-init.exe`). Accept the default stable toolchain.
2. **Microsoft C++ Build Tools**: install "Visual Studio Installer" → in it, select the **"Desktop development with C++"** workload. Rust on Windows requires the MSVC linker this provides.
3. **WebView2 Runtime**: already preinstalled on Windows 11 and most updated Windows 10 (22H2+) machines. If missing, Tauri's build will warn you; get it from `https://developer.microsoft.com/microsoft-edge/webview2/`.
4. Confirm versions:
   ```bash
   rustc --version
   cargo --version
   node --version   # this repo targets Node 24 per .replit
   pnpm --version
   ```

You do **not** need to install the Tauri CLI globally — it will be added as a workspace dev dependency in Step 2, which is the reproducible, team-shareable approach (anyone who clones the repo and runs `pnpm install` gets the exact same CLI version).

---

## 2. Add Tauri dependencies

### Edit `artifacts/yaqoot-medical/package.json`

Add these entries to the existing `devDependencies` block (this file currently keeps everything under `devDependencies` rather than `dependencies` — we're matching that existing convention, not introducing a new one):

```json
"@tauri-apps/api": "^2",
"@tauri-apps/cli": "^2",
"cross-env": "^7.0.3",
```

> **Why `cross-env`:** the existing `vite.config.ts` reads `process.env.PORT` and `process.env.BASE_PATH` directly (no `.env` file loading). Today those are supplied by Replit's runtime. Locally on Windows, `VAR=value command` shell syntax doesn't work in `cmd`/PowerShell the way it does in bash — `cross-env` sets these portably across every shell your team might use.

Also add three new scripts to the same file's `"scripts"` block (alongside the existing `dev`/`build`/`serve`/`typecheck`):

```json
"dev:tauri-frontend": "cross-env PORT=20342 BASE_PATH=/ vite --config vite.config.ts",
"build:tauri-frontend": "cross-env PORT=20342 BASE_PATH=/ vite build --config vite.config.ts",
"tauri": "tauri"
```

(Port `20342` matches the port already assigned to this artifact in `.replit-artifact/artifact.toml`, kept for consistency — it has no special meaning beyond "not colliding with anything else on your machine.")

Then install:

```bash
cd artifacts/yaqoot-medical
pnpm install
```

---

## 3. Scaffold Tauri

From inside `artifacts/yaqoot-medical`, run:

```bash
pnpm tauri init
```

When prompted, answer:

| Prompt | Answer |
|---|---|
| App name | `Yaqoot Medical Clinic` |
| Window title | `Yaqoot Medical Clinic` |
| Web assets location (relative to `src-tauri`) | `../dist/public` |
| Dev server URL | `http://localhost:20342` |
| Frontend dev command | `pnpm run dev:tauri-frontend` |
| Frontend build command | `pnpm run build:tauri-frontend` |

This creates a new `src-tauri/` folder. We'll now replace its generated config files with the exact, reviewed versions below — this guarantees your setup matches this guide precisely rather than depending on whatever the CLI's interactive defaults happened to produce.

---

## 4. Replace generated config files with reviewed versions

### `src-tauri/tauri.conf.json`

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Yaqoot Medical Clinic",
  "version": "1.0.0",
  "identifier": "com.yaqoot.medical",
  "build": {
    "beforeDevCommand": "pnpm run dev:tauri-frontend",
    "beforeBuildCommand": "pnpm run build:tauri-frontend",
    "devUrl": "http://localhost:20342",
    "frontendDist": "../dist/public"
  },
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "Yaqoot Medical Clinic — عيادة ياقوت الطبية",
        "width": 1400,
        "height": 900,
        "minWidth": 1024,
        "minHeight": 700,
        "resizable": true,
        "maximizable": true,
        "center": true,
        "fullscreen": false
      }
    ],
    "security": {
      "csp": "default-src 'self'; img-src 'self' data: asset: https://asset.localhost; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'"
    }
  },
  "bundle": {
    "active": true,
    "targets": ["nsis", "msi"],
    "publisher": "Yaqoot Medical",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.ico"
    ],
    "windows": {
      "webviewInstallMode": {
        "type": "downloadBootstrapper"
      }
    }
  }
}
```

**Rationale for the CSP line:** Tauri 2 ships a restrictive default Content-Security-Policy. Rather than disabling it entirely (`csp: null`, which would be a real security regression), this explicit policy is scoped to exactly what the app needs today: `'self'` for scripts/styles (your own bundled JS/CSS), `'unsafe-inline'` on `style-src` only (required because the app extensively uses inline `style={{...}}` props — this is a style-attribute allowance, not a script one, so it doesn't weaken script injection protection), and `data:`/`asset:` for the locally-bundled images and self-hosted Cairo fonts from Phase 1. No external domain is allowed anywhere in this policy — which is itself a live verification that Phase 1's offline-hardening actually worked, since if anything still tried to reach an external CDN, the CSP would block it and you'd see it immediately in the console.

**`webviewInstallMode: downloadBootstrapper`**: keeps the installer small by downloading the WebView2 runtime only if it's missing on the target machine (it already is, on virtually every modern Windows install) rather than always bundling the full ~150MB runtime — directly serves your "small installer, low footprint" goal.

### `src-tauri/Cargo.toml`

```toml
[package]
name = "yaqoot-medical"
version = "1.0.0"
description = "Yaqoot Medical Clinic — offline-first patient records"
edition = "2021"

[lib]
name = "yaqoot_medical_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"

# Release-build tuning for a small, fast binary — directly relevant to the
# "low RAM/CPU footprint" priority. Safe to leave as-is through every future
# phase; nothing here needs revisiting when Phase 3 adds the SQL plugin.
[profile.release]
panic = "abort"
codegen-units = 1
lto = true
opt-level = "s"
strip = true
```

### `src-tauri/src/main.rs`

```rust
// Prevents an extra console/terminal window from appearing behind the app
// on Windows release builds — debug builds still show it for easier
// troubleshooting during development.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    yaqoot_medical_lib::run();
}
```

### `src-tauri/src/lib.rs`

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running Yaqoot Medical Clinic");
}
```

### `src-tauri/build.rs`

```rust
fn main() {
    tauri_build::build()
}
```

### `src-tauri/capabilities/default.json`

Tauri 2's permission system defaults to zero API access unless explicitly granted. This phase calls **no** Tauri APIs from the frontend yet (that starts in Phase 3/4), so the capability file stays minimal — this is itself a security property worth keeping, not just a placeholder:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default capability for the main window",
  "windows": ["main"],
  "permissions": ["core:default"]
}
```

---

## 5. Bundle the native app icon

Good news: `attached_assets/yaqoot_logo_nobg.png` is already exactly **1024×1024 RGBA** — the ideal source size for Tauri's icon generator, no manual resizing needed.

From `artifacts/yaqoot-medical`, run:

```bash
pnpm tauri icon ../../attached_assets/yaqoot_logo_nobg.png
```

This auto-generates the full Windows icon set (`.ico` with all embedded resolutions, plus the `.png` variants referenced in `tauri.conf.json`'s `bundle.icon` array above) directly into `src-tauri/icons/`. No manual conversion tool or online service needed — this is a built-in, offline-capable Tauri CLI feature.

---

## 6. Update `.gitignore`

Add these lines (Rust build artifacts are large and machine-specific — never commit them):

```gitignore
# Tauri / Rust
src-tauri/target/
src-tauri/gen/
```

---

## 7. Run it — first native launch

From `artifacts/yaqoot-medical`:

```bash
pnpm tauri dev
```

This will:
1. Compile the Rust shell (first run takes a few minutes; subsequent runs are fast, incremental)
2. Start the Vite dev server via `dev:tauri-frontend` automatically
3. Open a native window titled "Yaqoot Medical Clinic — عيادة ياقوت الطبية" rendering the app

You should see **the exact same app** you verified at the end of Phase 1 — patient list, sidebar, RTL Arabic layout, Cairo font — now inside a native window instead of a browser tab.

---

## Full Verification Checklist

Do not proceed to Phase 3 until every item is checked.

### A. Dev-mode native launch
- [ ] `pnpm tauri dev` compiles with no Rust errors or warnings
- [ ] Native window opens, titled correctly, sized 1400×900, centered on screen
- [ ] Patient list, sidebar navigation, and all 8 routes (`/`, `/patients/:id`, `/patients/:id/visits/new`, `/visits/:visitId`, `/settings`, `/settings/analytics`, `/settings/vitals`, `/settings/data`) load and navigate correctly inside the native window
- [ ] Cairo font renders correctly (compare visually against Phase 1's verified state)
- [ ] Window resizes smoothly down to the 1024×700 minimum and back up, with no layout breakage
- [ ] Open DevTools inside the Tauri window (right-click → Inspect, or `Ctrl+Shift+I`) — **zero console errors**, and specifically zero CSP violation warnings (confirms the CSP policy in Step 4 is correctly scoped)

### B. Data-layer regression check (must be byte-identical to Phase 1 behavior)
- [ ] Create a new patient inside the native window
- [ ] Close and fully reopen the app (`pnpm tauri dev` again, or relaunch the built `.exe` in section D) — **confirm the patient persists** (WebView2 retains `localStorage` per-app, same as a browser profile)
- [ ] Run the full CRUD cycle: create patient → add visit → add vitals/treatment/investigation → edit → delete — confirm identical behavior to the Phase 1 browser build
- [ ] Use the existing Backup (export JSON) and Restore (import JSON) feature from `/settings/data` — confirm both still work exactly as before (this exercises the file-picker/Blob-download path, a good early signal for Phase 4's native-dialog upgrade)

### C. Production build
- [ ] Run:
  ```bash
  pnpm tauri build
  ```
- [ ] Confirm it completes with no errors and produces both an NSIS `.exe` and an MSI installer under `src-tauri/target/release/bundle/`
- [ ] Install the built app on your machine (or a clean VM) via the generated installer
- [ ] Launch the installed app from the Start Menu — confirm it opens correctly with the custom app icon visible in the taskbar and window title bar

### D. Fully offline native launch (the critical test for this phase)
- [ ] Disconnect your machine from the network entirely (disable Wi-Fi/Ethernet, or use Airplane Mode)
- [ ] Launch the installed app from Step C
- [ ] **Expected:** the app opens instantly, renders fully, Cairo font displays correctly, and all navigation/CRUD functionality works exactly as it did online
- [ ] Create a patient while offline, close the app, relaunch while still offline — confirm the patient persisted
- [ ] Reconnect the network afterward — no special reconnection behavior should be needed (the app never expected a network in the first place)

### E. Performance sanity check
- [ ] Open Windows Task Manager while the app is running idle on the patient list — confirm RAM usage is in the tens-of-MB range (roughly 40–90MB is the expected Tauri/WebView2 range), not the 150–250MB+ you'd see from an equivalent Electron shell
- [ ] Cold-launch timing: close the app fully, then time from double-click to fully rendered patient list — should be near-instant (well under 1 second on typical hardware), since WebView2 has no Chromium bundle to spin up

### F. Zero-regression confirmation
- [ ] Run `git diff --stat` and confirm **no files under `src/` appear** — only new files under `src-tauri/`, the `.gitignore` addition, and the `package.json` script/dependency additions
- [ ] Run `pnpm --filter @workspace/yaqoot-medical run typecheck` — passes with no new errors (Tauri additions don't touch any typechecked source)

---

## Rollback

Since no existing file was modified, rollback is simply removing what was added:

```bash
git checkout -- package.json .gitignore
git rm -r --cached src-tauri 2>/dev/null
rm -rf src-tauri
pnpm install
```

This returns the project to exactly its Phase-1-signed-off state.

---

## Sign-off

Once **every checkbox in sections A–F** is green, you have a verified, fully offline, native Windows shell wrapping the exact application you already trust — with the data layer completely untouched. This is the stable foundation Phase 3 needs: because you've now isolated and confirmed "the shell works," any issue that surfaces while migrating to SQLite in Phase 3 will be unambiguously attributable to the new storage code, not to packaging.

Reply once this checklist is fully green, and I'll generate **Phase 3: SQLite Migration & Async Architecture**.
