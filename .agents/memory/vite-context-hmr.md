---
name: Vite context HMR crashes
description: Diagnosing transient React context failures caused by Fast Refresh invalidation.
---

When a React context module exports both a context object and a provider component, Vite Fast Refresh can invalidate the module and briefly leave consumers attached to a different context identity. A consumer may then report that it is outside its provider even though the provider tree is correct.

**Why:** The failure can appear during hot reload while a clean page load works normally, making it easy to misdiagnose as an application wiring bug.

**How to apply:** Check the fresh workflow logs and browser console after a clean restart before changing provider wiring. If the error disappears after restart, treat it as stale HMR state unless it reproduces on a cold load.