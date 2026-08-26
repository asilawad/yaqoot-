---
name: Tauri native verification
description: Host boundary for verifying the Yaqoot Tauri desktop shell
---

Linux workspace validation is sufficient for the frontend build, TypeScript checks, Tauri manifest, and Rust compilation checks. Native Windows window behavior, WebView2 runtime behavior, NSIS/MSI packaging, and offline persistence still require a Windows machine.

**Why:** Tauri uses platform-specific native toolchains and window runtimes; a successful Linux check cannot prove the Windows installer or WebView2 launch path.

**How to apply:** Treat the Windows checklist as a separate verification gate after the cross-platform source/configuration checks pass.