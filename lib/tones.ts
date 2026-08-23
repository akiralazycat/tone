export type ToneAxes = {
  warmth: number;
  energy: number;
  contrast: number;
  saturation: number;
  formality: number;
  roundness: number;
};

export type TonePreset = {
  id: string;
  name: string;
  eyebrow: string;
  description: string;
  keywords: string[];
  seed: string;
  axes: ToneAxes;
};

export type ToneTokens = {
  canvas: string;
  surface: string;
  surfaceStrong: string;
  text: string;
  textSoft: string;
  accent: string;
  accentSoft: string;
  accentInk: string;
  border: string;
  radius: number;
  shadow: string;
  tracking: number;
  motion: number;
};

export const tonePresets: TonePreset[] = [
  {
    id: "still",
    name: "Still",
    eyebrow: "Quiet / precise",
    description: "Whitespace, restrained chroma and soft edges. Designed to feel calm without becoming sterile.",
    keywords: ["quiet", "editorial", "focused"],
    seed: "#5d6f67",
    axes: { warmth: 46, energy: 18, contrast: 38, saturation: 22, formality: 67, roundness: 42 },
  },
  {
    id: "authority",
    name: "Authority",
    eyebrow: "Institutional / assured",
    description: "Deep, deliberate contrast with disciplined geometry for finance, governance and serious products.",
    keywords: ["trust", "weight", "discipline"],
    seed: "#233d63",
    axes: { warmth: 25, energy: 29, contrast: 74, saturation: 42, formality: 92, roundness: 18 },
  },
  {
    id: "vitality",
    name: "Vitality",
    eyebrow: "Human / alive",
    description: "Warm color, generous rhythm and optimistic emphasis without the visual noise of a typical bright palette.",
    keywords: ["energy", "human", "optimistic"],
    seed: "#d36135",
    axes: { warmth: 84, energy: 82, contrast: 61, saturation: 71, formality: 31, roundness: 69 },
  },
  {
    id: "tech",
    name: "Signal",
    eyebrow: "Technical / luminous",
    description: "Cool surfaces, precise highlights and a controlled synthetic accent for infrastructure and AI interfaces.",
    keywords: ["tech", "future", "precision"],
    seed: "#5968ee",
    axes: { warmth: 12, energy: 72, contrast: 82, saturation: 73, formality: 59, roundness: 34 },
  },
  {
    id: "minimal",
    name: "Essential",
    eyebrow: "Minimal / neutral",
    description: "Near-monochrome structure with tiny tonal separations. The interface recedes and content takes priority.",
    keywords: ["minimal", "clean", "neutral"],
    seed: "#63666c",
    axes: { warmth: 43, energy: 13, contrast: 55, saturation: 7, formality: 72, roundness: 28 },
  },
  {
    id: "nature",
    name: "Canopy",
    eyebrow: "Organic / grounded",
    description: "Botanical hue, warmer paper-like surfaces and soft containment for products connected to place and material.",
    keywords: ["nature", "organic", "grounded"],
    seed: "#477251",
    axes: { warmth: 61, energy: 39, contrast: 47, saturation: 38, formality: 45, roundness: 61 },
  },
  {
    id: "academic",
    name: "Archive",
    eyebrow: "Academic / legible",
    description: "Ink-like hierarchy, conservative saturation and measured spacing for research, knowledge and documentation.",
    keywords: ["academic", "knowledge", "credible"],
    seed: "#73594a",
    axes: { warmth: 63, energy: 20, contrast: 68, saturation: 29, formality: 88, roundness: 12 },
  },
  {
    id: "heritage",
    name: "Heritage",
    eyebrow: "Historic / tactile",
    description: "Oxide warmth, low-gloss surfaces and compact geometry that suggest continuity without becoming nostalgic cosplay.",
    keywords: ["history", "craft", "material"],
    seed: "#98533d",
    axes: { warmth: 91, energy: 32, contrast: 63, saturation: 43, formality: 81, roundness: 16 },
  },
  {
    id: "luxury",
    name: "Nocturne",
    eyebrow: "Luxury / cinematic",
    description: "Dark tonal depth, quiet metallic warmth and sharp restraint. Premium without defaulting to black-and-gold cliché.",
    keywords: ["luxury", "cinematic", "exclusive"],
    seed: "#9d8167",
    axes: { warmth: 68, energy: 25, contrast: 89, saturation: 27, formality: 95, roundness: 24 },
  },
  {
    id: "playful",
    name: "Play",
    eyebrow: "Friendly / expressive",
    description: "High chroma and forgiving geometry balanced by clean typography, useful for consumer and learning experiences.",
    keywords: ["friendly", "bright", "approachable"],
    seed: "#e0548d",
    axes: { warmth: 69, energy: 91, contrast: 57, saturation: 84, formality: 18, roundness: 91 },
  },
  {
    id: "editorial",
    name: "Editorial",
    eyebrow: "Cultural / composed",
    description: "Paper-adjacent neutrals, a literary accent and decisive hierarchy for reading-heavy or cultural products.",
    keywords: ["culture", "reading", "curated"],
    seed: "#8a4652",
    axes: { warmth: 72, energy: 34, contrast: 72, saturation: 37, formality: 78, roundness: 8 },
  },
  {
    id: "cosmic",
    name: "Orbit",
    eyebrow: "Atmospheric / expansive",
    description: "Deep cool space, luminous accent and subtle motion for products that should feel exploratory rather than gamified.",
    keywords: ["space", "explore", "ambient"],
    seed: "#7868df",
    axes: { warmth: 19, energy: 58, contrast: 86, saturation: 66, formality: 63, roundness: 55 },
  },
];

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map((value) => Math.round(value).toString(16).padStart(2, "0"))
    .join("")}`;

const mix = (a: string, b: string, amount: number) => {
  const start = hexToRgb(a);
  const end = hexToRgb(b);
  const t = clamp(amount) / 100;
  return rgbToHex(
    start.r + (end.r - start.r) * t,
    start.g + (end.g - start.g) * t,
    start.b + (end.b - start.b) * t,
  );
};

const rgbToHsl = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;

  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === rn) h = 60 * (((gn - bn) / d) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / d + 2);
    else h = 60 * ((rn - gn) / d + 4);
  }

  return { h: (h + 360) % 360, s: s * 100, l: l * 100 };
};

const hslToHex = (h: number, s: number, l: number) => {
  const sat = clamp(s) / 100;
  const light = clamp(l) / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = light - c / 2;
  let [r, g, b] = [0, 0, 0];

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
};

const tuneSeed = (seed: string, axes: ToneAxes) => {
  const hsl = rgbToHsl(seed);
  const warmShift = ((axes.warmth - 50) / 50) * 11;
  const hue = (hsl.h + warmShift + 360) % 360;
  const saturation = clamp(hsl.s * 0.45 + axes.saturation * 0.62, 8, 92);
  const lightness = clamp(hsl.l + (axes.energy - 50) * 0.035, 31, 68);
  return hslToHex(hue, saturation, lightness);
};

export function createToneTokens(preset: TonePreset, axes: ToneAxes): ToneTokens {
  const accent = tuneSeed(preset.seed, axes);
  const darkMode = preset.id === "luxury" || preset.id === "cosmic";
  const warmth = axes.warmth / 100;
  const basePaper = mix("#f4f7fb", "#faf3e8", warmth * 72);
  const canvas = darkMode ? mix("#080b12", "#14100e", warmth * 36) : mix(basePaper, "#ffffff", 34);
  const surface = darkMode ? mix(canvas, "#ffffff", 6 + axes.energy * 0.025) : mix(canvas, "#ffffff", 62);
  const surfaceStrong = darkMode ? mix(canvas, "#ffffff", 11) : mix(canvas, "#111318", 4 + axes.contrast * 0.018);
  const text = darkMode ? mix("#ffffff", accent, 5) : mix("#17191d", accent, axes.saturation * 0.025);
  const textSoft = darkMode ? mix(text, canvas, 34) : mix(text, canvas, 42);
  const border = darkMode ? mix(surface, "#ffffff", 13 + axes.contrast * 0.05) : mix(surface, text, 8 + axes.contrast * 0.07);
  const accentSoft = darkMode ? mix(accent, canvas, 74) : mix(accent, canvas, 84 - axes.saturation * 0.12);
  const accentInk = getContrast(accent, "#ffffff") >= 4.5 ? "#ffffff" : mix("#0d1015", accent, 8);
  const radius = Math.round(2 + axes.roundness * 0.22);
  const shadowAlpha = darkMode ? 0.34 : 0.09 + axes.contrast * 0.0009;
  const shadow = `0 ${Math.round(10 + axes.energy * 0.1)}px ${Math.round(30 + axes.roundness * 0.28)}px rgba(8, 12, 18, ${shadowAlpha.toFixed(2)})`;

  return {
    canvas,
    surface,
    surfaceStrong,
    text,
    textSoft,
    accent,
    accentSoft,
    accentInk,
    border,
    radius,
    shadow,
    tracking: Number((((axes.formality - 50) / 50) * 0.035).toFixed(3)),
    motion: Math.round(140 + axes.energy * 3.2),
  };
}

const relativeLuminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

export function getContrast(a: string, b: string) {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export const axisMeta: Array<{
  key: keyof ToneAxes;
  label: string;
  low: string;
  high: string;
}> = [
  { key: "warmth", label: "Temperature", low: "Cool", high: "Warm" },
  { key: "energy", label: "Energy", low: "Still", high: "Kinetic" },
  { key: "contrast", label: "Contrast", low: "Soft", high: "Sharp" },
  { key: "saturation", label: "Chroma", low: "Muted", high: "Vivid" },
  { key: "formality", label: "Formality", low: "Casual", high: "Ceremonial" },
  { key: "roundness", label: "Geometry", low: "Architectural", high: "Soft" },
];

export function toCss(tokens: ToneTokens) {
  return `:root {\n  --tone-canvas: ${tokens.canvas};\n  --tone-surface: ${tokens.surface};\n  --tone-surface-strong: ${tokens.surfaceStrong};\n  --tone-text: ${tokens.text};\n  --tone-text-soft: ${tokens.textSoft};\n  --tone-accent: ${tokens.accent};\n  --tone-accent-soft: ${tokens.accentSoft};\n  --tone-accent-ink: ${tokens.accentInk};\n  --tone-border: ${tokens.border};\n  --tone-radius: ${tokens.radius}px;\n  --tone-shadow: ${tokens.shadow};\n  --tone-tracking: ${tokens.tracking}em;\n  --tone-motion: ${tokens.motion}ms;\n}`;
}

export function toAiBrief(preset: TonePreset, axes: ToneAxes, tokens: ToneTokens) {
  const axisText = axisMeta
    .map(({ key, label }) => `${label.toLowerCase()} ${axes[key]}/100`)
    .join(", ");

  return `Design this interface in the “${preset.name}” tone: ${preset.description}\n\nTone DNA: ${axisText}.\nKeywords: ${preset.keywords.join(", ")}.\n\nUse these exact design tokens:\n${toCss(tokens)}\n\nCarry the tone beyond color: use ${tokens.radius}px radii, ${axes.formality > 70 ? "precise, restrained" : "open, approachable"} typography, ${axes.energy > 65 ? "purposeful micro-motion" : "quiet transitions"}, low-noise borders, and preserve generous hierarchy. Avoid generic gradients, excessive glassmorphism, decorative icons, and arbitrary colors outside the token system.`;
}
