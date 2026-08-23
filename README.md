# Tone

Tone is a visual-direction tool for the space between a color picker and a full design system.

Instead of returning a palette alone, Tone turns design intent into a reusable visual grammar: color, contrast, geometry, depth, typography and motion. It can also work in reverse: start from an existing logo, image or public website and estimate the closest Tone DNA.

## What it does

- 12 intent-first tone directions, from **Still** and **Authority** to **Signal**, **Archive**, **Nocturne** and **Orbit**
- Six adjustable Tone DNA axes: temperature, energy, contrast, chroma, formality and geometry
- Custom seed-color tuning
- Live desktop and mobile interface preview
- Generated semantic design tokens
- WCAG-oriented body/accent contrast readouts
- CSS, JSON and AI-ready design brief export
- Shareable tone URLs that preserve the current settings
- **Brand Reverse** for logos, photographs, screenshots and public website URLs
- Local image palette analysis; uploaded images never leave the browser
- Safe server-side public URL inspection with private-network blocking and bounded HTML/CSS reads
- Per-axis evidence scores so weak inferences are explicitly marked instead of presented as facts
- **Compare Lab** for 2–4 side-by-side directions using identical content and layout
- Goal-lens scoring, Tone DNA deltas, contrast/radius/motion metrics and one-click handoff back to Studio
- Responsive, dependency-light Next.js App Router implementation

## Brand Reverse

Image analysis quantizes a small local raster sample into weighted representative colors and estimates temperature, chroma, contrast and energy. Geometry and formality are deliberately shown with lower confidence when raster color alone cannot support a strong conclusion.

URL analysis reads public HTML plus up to three linked stylesheets. It uses theme colors, CSS color frequency, border-radius and font-family signals. Requests are limited to public `http(s)` resources on standard ports; private, loopback and local-network destinations are rejected, including redirects.

## Compare Lab

Compare Lab keeps sample content and layout fixed while changing only the Tone system. Up to four candidates can be compared at once. A selectable Goal lens scores each candidate against a target Tone DNA, while still exposing the raw axis values and implementation metrics so the score does not replace visual judgment.

A Brand Reverse result can be sent directly into Compare Lab, and any comparison candidate can be reopened in Studio through the same shareable Tone URL format.

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

- `app/` — App Router shell, global/lab styling and the public URL-analysis route
- `components/tone-studio.tsx` — interactive studio, preview and export workflow
- `components/tone-labs.tsx` — Brand Reverse and Compare Lab
- `lib/tones.ts` — presets, color math, token generation and export formatters
- `lib/tone-analysis.ts` — deterministic reverse-analysis and nearest-direction scoring

The primary color engine is deterministic. Image analysis stays local; only explicit URL inspection invokes the server route.
