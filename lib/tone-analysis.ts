import { tonePresets, type ToneAxes } from "@/lib/tones";

export type WeightedColor = {
  color: string;
  weight: number;
};

export type AxisConfidence = Record<keyof ToneAxes, number>;

export type ToneAnalysis = {
  seed: string;
  palette: string[];
  axes: ToneAxes;
  presetId: string;
  presetName: string;
  confidence: number;
  observations: string[];
  axisConfidence: AxisConfidence;
};

type AnalysisSignals = {
  roundness?: number;
  formality?: number;
  energy?: number;
  contrast?: number;
  source?: "image" | "url";
};

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const normalizeHex = (value: string) => {
  const raw = value.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(raw)) return raw;
  if (/^#[0-9a-f]{3}$/.test(raw)) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`;
  }
  return null;
};

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
};

const rgbToHsl = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const lightness = (max + min) / 2;
  const delta = max - min;
  let hue = 0;
  let saturation = 0;

  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (max === rn) hue = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) hue = 60 * ((bn - rn) / delta + 2);
    else hue = 60 * ((rn - gn) / delta + 4);
  }

  return { h: (hue + 360) % 360, s: saturation * 100, l: lightness * 100 };
};

const luminance = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const linear = (channel: number) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
};

const circularDistance = (a: number, b: number) => {
  const delta = Math.abs(a - b) % 360;
  return Math.min(delta, 360 - delta);
};

const weightedMean = (items: WeightedColor[], getter: (color: string) => number) => {
  const total = items.reduce((sum, item) => sum + item.weight, 0) || 1;
  return items.reduce((sum, item) => sum + getter(item.color) * item.weight, 0) / total;
};

const nearestPreset = (axes: ToneAxes) => {
  const weights: Record<keyof ToneAxes, number> = {
    warmth: 1,
    energy: 1.05,
    contrast: 1.15,
    saturation: 1.15,
    formality: 0.7,
    roundness: 0.55,
  };

  return tonePresets
    .map((preset) => {
      const distance = (Object.keys(weights) as Array<keyof ToneAxes>).reduce((sum, key) => {
        const delta = axes[key] - preset.axes[key];
        return sum + delta * delta * weights[key];
      }, 0);
      return { preset, distance: Math.sqrt(distance) };
    })
    .sort((a, b) => a.distance - b.distance)[0];
};

export function analyzePalette(samples: WeightedColor[], signals: AnalysisSignals = {}): ToneAnalysis {
  const merged = new Map<string, number>();
  for (const sample of samples) {
    const color = normalizeHex(sample.color);
    if (!color || !Number.isFinite(sample.weight) || sample.weight <= 0) continue;
    merged.set(color, (merged.get(color) ?? 0) + sample.weight);
  }

  const colors = [...merged.entries()]
    .map(([color, weight]) => ({ color, weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 24);

  if (colors.length === 0) {
    const fallback = tonePresets[0];
    return {
      seed: fallback.seed,
      palette: [fallback.seed],
      axes: fallback.axes,
      presetId: fallback.id,
      presetName: fallback.name,
      confidence: 20,
      observations: ["Not enough usable color evidence was found, so Tone fell back to a neutral baseline."],
      axisConfidence: { warmth: 20, energy: 15, contrast: 20, saturation: 20, formality: 10, roundness: 5 },
    };
  }

  const meanSaturation = weightedMean(colors, (color) => rgbToHsl(color).s);
  const meanLightness = weightedMean(colors, (color) => rgbToHsl(color).l);
  const meanLuminance = weightedMean(colors, luminance);
  const luminances = colors.map((item) => luminance(item.color));
  const spread = Math.max(...luminances) - Math.min(...luminances);
  const chromatic = colors.filter((item) => {
    const hsl = rgbToHsl(item.color);
    return hsl.s >= 12 && hsl.l >= 12 && hsl.l <= 90;
  });

  const seedCandidates = chromatic.length > 0 ? chromatic : colors;
  const seed = [...seedCandidates]
    .sort((a, b) => {
      const score = (item: WeightedColor) => {
        const hsl = rgbToHsl(item.color);
        const usableLightness = 1 - Math.min(1, Math.abs(hsl.l - 52) / 52);
        return item.weight * (0.35 + hsl.s / 100) * (0.55 + usableLightness * 0.45);
      };
      return score(b) - score(a);
    })[0].color;

  const warmth = weightedMean(colors, (color) => {
    const { h, s } = rgbToHsl(color);
    if (s < 8) return 50;
    const warm = (Math.cos((circularDistance(h, 45) / 180) * Math.PI) + 1) / 2;
    return warm * 100;
  });

  const contrast = signals.contrast ?? clamp(24 + spread * 76);
  const saturation = clamp(meanSaturation * 1.08);
  const diversity = clamp((colors.length / 12) * 100);
  const energy = signals.energy ?? clamp(saturation * 0.46 + contrast * 0.32 + diversity * 0.22);
  const formality = signals.formality ?? clamp(76 - saturation * 0.35 + contrast * 0.12 + (50 - Math.abs(meanLightness - 50)) * 0.08);
  const roundness = signals.roundness ?? 46;

  const axes: ToneAxes = {
    warmth: Math.round(warmth),
    energy: Math.round(energy),
    contrast: Math.round(contrast),
    saturation: Math.round(saturation),
    formality: Math.round(formality),
    roundness: Math.round(roundness),
  };

  const nearest = nearestPreset(axes);
  const evidence = clamp(34 + Math.min(colors.length, 10) * 4 + (chromatic.length > 0 ? 12 : 0));
  const nearestScore = clamp(100 - nearest.distance * 0.72);
  const confidence = Math.round(evidence * 0.58 + nearestScore * 0.42);

  const temperatureLabel = axes.warmth >= 62 ? "warm" : axes.warmth <= 38 ? "cool" : "balanced";
  const chromaLabel = axes.saturation >= 65 ? "high-chroma" : axes.saturation <= 28 ? "restrained" : "moderate-chroma";
  const contrastLabel = axes.contrast >= 68 ? "high-contrast" : axes.contrast <= 38 ? "soft-contrast" : "mid-contrast";
  const brightnessLabel = meanLuminance < 0.22 ? "dark-weighted" : meanLuminance > 0.68 ? "light-weighted" : "tonally balanced";

  const axisConfidence: AxisConfidence = {
    warmth: Math.round(clamp(evidence + 8)),
    energy: Math.round(clamp(evidence - 4)),
    contrast: Math.round(clamp(evidence + 10)),
    saturation: Math.round(clamp(evidence + 10)),
    formality: signals.formality === undefined ? Math.round(clamp(evidence - 28)) : Math.round(clamp(evidence)),
    roundness: signals.roundness === undefined ? 18 : Math.round(clamp(evidence)),
  };

  return {
    seed,
    palette: colors.slice(0, 8).map((item) => item.color),
    axes,
    presetId: nearest.preset.id,
    presetName: nearest.preset.name,
    confidence,
    observations: [
      `${temperatureLabel} temperature with ${chromaLabel} color`,
      `${contrastLabel}, ${brightnessLabel} tonal structure`,
      `${nearest.preset.name} is the nearest existing Tone direction`,
      signals.source === "image"
        ? "Geometry and formality are intentionally lower-confidence when the evidence is mainly raster color."
        : "URL analysis combines public CSS signals with palette evidence; dynamic canvas/WebGL styling may not be visible.",
    ],
    axisConfidence,
  };
}
