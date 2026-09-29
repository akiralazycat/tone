# Traffic cost controls — 2026-09-29

## Scope

Reduce request amplification on `POST /api/analyze-url`, which can perform one HTML fetch plus up to three stylesheet fetches.

## Change

- Reject oversized JSON bodies before parsing.
- Add an IP-scoped fixed-window burst guard before DNS and outbound fetch work.
- Return `429` with `Retry-After` before expensive processing.

The preferred first layer remains Vercel Firewall because it can reject before a Function invocation.

## Progress

| Item | Status |
|---|---|
| Request body ceiling | done | 8 KiB before JSON parsing |
| Pre-fetch burst guard | done | 12 requests / minute / client key per warm instance |
| Static verification | done | guard runs before DNS and remote fetches |
| Production verification | pending |
