# Tone

Tone is a visual-direction tool for the space between a color picker and a full design system.

Instead of returning a palette alone, Tone turns a design intent into a reusable visual grammar: color, contrast, geometry, depth, typography and motion. The current prototype is fully client-side and requires no account or backend.

## What it does

- 12 intent-first tone directions, from **Still** and **Authority** to **Signal**, **Archive**, **Nocturne** and **Orbit**
- Six adjustable Tone DNA axes: temperature, energy, contrast, chroma, formality and geometry
- Custom seed-color tuning
- Live desktop and mobile interface preview
- Generated semantic design tokens
- WCAG-oriented body/accent contrast readouts
- CSS, JSON and AI-ready design brief export
- Shareable tone URLs that preserve the current settings
- Responsive, dependency-light Next.js App Router implementation

## Development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Quality checks

```bash
npm run lint
npm run build
```

## Architecture

- `app/` — App Router shell and visual styling
- `components/tone-studio.tsx` — interactive studio, preview and export workflow
- `lib/tones.ts` — presets, color math, token generation and export formatters

The color engine is deterministic and local. A preset supplies the initial direction; the six axes alter the generated system without requiring an API call.
