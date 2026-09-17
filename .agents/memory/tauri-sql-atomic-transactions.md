---
name: Tauri SQL atomic transactions
description: Why multi-statement atomic operations cannot use separate tauri-plugin-sql execute calls.
---

Do not model a transaction as separate `BEGIN`, statement, and `COMMIT` calls through the Tauri SQL JavaScript plugin. Multi-statement atomic work must execute on one pinned SQLite connection and one SQLx transaction.

**Why:** The plugin executes commands through a SQLx pool, so separate frontend calls are not guaranteed to use the same physical connection. This can invalidate rollback and atomicity assumptions even when the SQL looks transactional.

**How to apply:** Route migrations, multi-table imports, replacement writes, and other atomic batches through a Rust command that acquires one connection, binds values as parameters, executes every statement in one transaction, and commits once.