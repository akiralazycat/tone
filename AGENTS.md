# AGENTS.md

- Use the [README commands](README.md#development) for setup and code verification. Run ESLint and the Next.js build as separate checks.
- Keep the Studio and Compare Lab share-link format compatible. Use `readSharedTone` in [lib/tones.ts](lib/tones.ts) when reading preset, seed and axis values from the query string.
- Keep uploaded-image analysis and previews in the browser. The [public URL-analysis route](app/api/analyze-url/route.ts) handles explicit website inspections.
