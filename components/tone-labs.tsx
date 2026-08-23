"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { analyzePalette, type ToneAnalysis, type WeightedColor } from "@/lib/tone-analysis";
import { axisMeta, createToneTokens, getContrast, tonePresets, type ToneAxes, type TonePreset } from "@/lib/tones";

type SourceMode = "image" | "url";
type CompareCandidate = {
  key: string;
  label: string;
  presetId: string;
  seed: string;
  axes: ToneAxes;
  source?: "preset" | "reverse" | "current";
};

type IconProps = { size?: number };

function ArrowIcon({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UploadIcon({ size = 17 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 15.5v2.8A1.7 1.7 0 0 0 6.7 20h10.6a1.7 1.7 0 0 0 1.7-1.7v-2.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon({ size = 14 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

function analysisUrl(analysis: ToneAnalysis) {
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("tone", analysis.presetId);
  url.searchParams.set("seed", analysis.seed.slice(1));
  for (const { key } of axisMeta) url.searchParams.set(key, String(analysis.axes[key]));
  return url;
}

function applyAnalysis(analysis: ToneAnalysis) {
  const url = analysisUrl(analysis);
  url.hash = "studio";
  window.location.assign(url.toString());
}

function persistReverseResult(analysis: ToneAnalysis) {
  window.localStorage.setItem("tone.reverse.last", JSON.stringify(analysis));
  window.dispatchEvent(new Event("tone:reverse"));
}

function imageToPalette(file: File): Promise<WeightedColor[]> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const maxSide = 92;
        const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("Canvas is unavailable in this browser.");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        const buckets = new Map<string, number>();

        for (let index = 0; index < pixels.length; index += 4) {
          const alpha = pixels[index + 3];
          if (alpha < 40) continue;
          const quantize = (value: number) => Math.min(255, Math.round(value / 24) * 24);
          const r = quantize(pixels[index]);
          const g = quantize(pixels[index + 1]);
          const b = quantize(pixels[index + 2]);
          const hex = `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
          buckets.set(hex, (buckets.get(hex) ?? 0) + 1);
        }

        const palette = [...buckets.entries()]
          .map(([color, weight]) => ({ color, weight }))
          .sort((a, b) => b.weight - a.weight)
          .slice(0, 24);
        resolve(palette);
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("That image could not be decoded."));
    };
    image.src = objectUrl;
  });
}

function AnalysisResult({ analysis, caption, onCompare }: { analysis: ToneAnalysis; caption: string; onCompare: () => void }) {
  const preset = tonePresets.find((item) => item.id === analysis.presetId) ?? tonePresets[0];
  const tokens = createToneTokens({ ...preset, seed: analysis.seed }, analysis.axes);

  return (
    <div className="reverse-result">
      <div className="reverse-result-head">
        <div>
          <p>Closest direction</p>
          <h3>{analysis.presetName}</h3>
          <span>{caption}</span>
        </div>
        <div className="confidence-ring" style={{ "--confidence": `${analysis.confidence * 3.6}deg` } as CSSProperties}>
          <strong>{analysis.confidence}</strong><small>% fit</small>
        </div>
      </div>

      <div className="reverse-palette" aria-label="Extracted palette">
        {analysis.palette.map((color) => <span key={color} style={{ background: color }} title={color} />)}
      </div>

      <div className="reverse-dna">
        {axisMeta.map(({ key, label }) => (
          <div key={key}>
            <div><span>{label}</span><strong>{analysis.axes[key]}</strong></div>
            <div className="reverse-track"><i style={{ width: `${analysis.axes[key]}%` }} /></div>
            <small>{analysis.axisConfidence[key]}% evidence</small>
          </div>
        ))}
      </div>

      <div className="reverse-observations">
        {analysis.observations.map((observation) => <p key={observation}>{observation}</p>)}
      </div>

      <div className="reverse-token-preview">
        {[tokens.canvas, tokens.surface, tokens.text, tokens.accent, tokens.accentSoft].map((color) => <i key={color} style={{ background: color }} />)}
      </div>

      <div className="reverse-actions">
        <button type="button" className="lab-primary" onClick={() => applyAnalysis(analysis)}>Open in Studio <ArrowIcon /></button>
        <button type="button" className="lab-secondary" onClick={onCompare}>Send to Compare</button>
      </div>
    </div>
  );
}

export function BrandReverse() {
  const [mode, setMode] = useState<SourceMode>("image");
  const [analysis, setAnalysis] = useState<ToneAnalysis | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [pageCaption, setPageCaption] = useState("");
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleImage = async (file: File | undefined) => {
    if (!file) return;
    setStatus("working");
    setError(null);
    setAnalysis(null);
    setFileName(file.name);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const palette = await imageToPalette(file);
      const next = analyzePalette(palette, { source: "image" });
      setAnalysis(next);
      setPageCaption(`${file.name} · local image analysis`);
      persistReverseResult(next);
      setStatus("idle");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to analyze that image.");
      setStatus("error");
    }
  };

  const inspectUrl = async () => {
    if (!urlDraft.trim()) return;
    setStatus("working");
    setError(null);
    setAnalysis(null);
    try {
      const response = await fetch("/api/analyze-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: urlDraft.trim() }),
      });
      const payload = (await response.json()) as {
        error?: string;
        analysis?: ToneAnalysis;
        page?: { title?: string | null; url?: string; stylesheetsInspected?: number };
      };
      if (!response.ok || !payload.analysis) throw new Error(payload.error || "Unable to inspect that URL.");
      setAnalysis(payload.analysis);
      setPageCaption(`${payload.page?.title || new URL(payload.page?.url || urlDraft).hostname} · ${payload.page?.stylesheetsInspected ?? 0} stylesheets inspected`);
      persistReverseResult(payload.analysis);
      setStatus("idle");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to inspect that URL.");
      setStatus("error");
    }
  };

  const sendToCompare = () => {
    if (!analysis) return;
    persistReverseResult(analysis);
    window.location.hash = "compare";
  };

  return (
    <section className="labs-section reverse-section" id="reverse">
      <div className="labs-heading">
        <div>
          <span className="labs-index">04</span>
          <p className="eyebrow">Brand Reverse</p>
          <h2>Start from what<br />already exists.</h2>
        </div>
        <div className="labs-heading-copy">
          <p>Drop a logo, photograph or public URL. Tone extracts the visible evidence, estimates the Tone DNA and shows which decisions are high-confidence versus inferred.</p>
          <span>Images stay in your browser. URL inspection reads public HTML/CSS only.</span>
        </div>
      </div>

      <div className="reverse-grid">
        <div className="reverse-input-card">
          <div className="lab-tabs" role="tablist" aria-label="Reverse source">
            <button type="button" role="tab" aria-selected={mode === "image"} className={mode === "image" ? "is-active" : ""} onClick={() => setMode("image")}>Image / logo</button>
            <button type="button" role="tab" aria-selected={mode === "url"} className={mode === "url" ? "is-active" : ""} onClick={() => setMode("url")}>Website URL</button>
          </div>

          {mode === "image" ? (
            <label className="image-drop">
              <input type="file" accept="image/*" onChange={(event) => void handleImage(event.target.files?.[0])} />
              {previewUrl ? <img src={previewUrl} alt="Uploaded brand reference preview" /> : <div className="image-drop-placeholder"><UploadIcon /><strong>Choose a visual reference</strong><span>Logo, screenshot, photograph, poster</span></div>}
              {fileName ? <small>{fileName}</small> : null}
            </label>
          ) : (
            <div className="url-inspector">
              <label htmlFor="brand-url">Public website</label>
              <div>
                <input id="brand-url" type="url" inputMode="url" placeholder="example.com" value={urlDraft} onChange={(event) => setUrlDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void inspectUrl(); }} />
                <button type="button" onClick={() => void inspectUrl()} disabled={status === "working"}>{status === "working" ? "Reading…" : "Reverse"}</button>
              </div>
              <p>Theme colors, inline styles and up to three public stylesheets are sampled. Private networks and non-standard ports are blocked.</p>
            </div>
          )}

          <div className="reverse-explainer">
            <span>What Tone reads</span>
            <ul><li>dominant + supporting hues</li><li>light/dark distribution</li><li>chroma + contrast spread</li><li>CSS radius + typography signals on URLs</li></ul>
          </div>
          {error ? <p className="lab-error" role="alert">{error}</p> : null}
        </div>

        <div className="reverse-output-card">
          {analysis ? (
            <AnalysisResult analysis={analysis} caption={pageCaption} onCompare={sendToCompare} />
          ) : (
            <div className="reverse-empty">
              <span className="reverse-empty-mark" />
              <h3>{status === "working" ? "Reading the visual system…" : "No reference yet"}</h3>
              <p>Tone separates observed evidence from guessed design intent instead of pretending every axis can be known from a single color sample.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function presetCandidate(preset: TonePreset, index: number): CompareCandidate {
  return {
    key: `${preset.id}-${index}`,
    label: preset.name,
    presetId: preset.id,
    seed: preset.seed,
    axes: { ...preset.axes },
    source: "preset",
  };
}

function parseCurrentCandidate(): CompareCandidate | null {
  const params = new URLSearchParams(window.location.search);
  const preset = tonePresets.find((item) => item.id === params.get("tone"));
  if (!preset) return null;
  const axes = { ...preset.axes };
  for (const { key } of axisMeta) {
    const value = Number(params.get(key));
    if (Number.isFinite(value) && value >= 0 && value <= 100) axes[key] = value;
  }
  const seedRaw = params.get("seed")?.replace("#", "");
  const seed = seedRaw && /^[0-9a-f]{6}$/i.test(seedRaw) ? `#${seedRaw}` : preset.seed;
  return { key: "current", label: `${preset.name} / current`, presetId: preset.id, seed, axes, source: "current" };
}

function readReverseCandidate(): CompareCandidate | null {
  try {
    const raw = window.localStorage.getItem("tone.reverse.last");
    if (!raw) return null;
    const analysis = JSON.parse(raw) as ToneAnalysis;
    if (!analysis?.presetId || !analysis?.axes || !analysis?.seed) return null;
    return { key: "reverse", label: `${analysis.presetName} / reverse`, presetId: analysis.presetId, seed: analysis.seed, axes: analysis.axes, source: "reverse" };
  } catch {
    return null;
  }
}

function candidateScore(candidate: CompareCandidate, goal: TonePreset) {
  const keys = axisMeta.map(({ key }) => key);
  const distance = Math.sqrt(keys.reduce((sum, key) => sum + (candidate.axes[key] - goal.axes[key]) ** 2, 0) / keys.length);
  return Math.round(clamp(100 - distance * 1.35));
}

function MiniTonePreview({ candidate }: { candidate: CompareCandidate }) {
  const preset = tonePresets.find((item) => item.id === candidate.presetId) ?? tonePresets[0];
  const tokens = createToneTokens({ ...preset, seed: candidate.seed }, candidate.axes);
  const style = {
    "--c-canvas": tokens.canvas,
    "--c-surface": tokens.surface,
    "--c-text": tokens.text,
    "--c-soft": tokens.textSoft,
    "--c-accent": tokens.accent,
    "--c-accent-ink": tokens.accentInk,
    "--c-border": tokens.border,
    "--c-radius": `${tokens.radius}px`,
  } as CSSProperties;

  return (
    <div className="compare-preview" style={style}>
      <nav><strong><i />Aster</strong><span>Work&nbsp;&nbsp; Notes&nbsp;&nbsp; About</span><button type="button">Enter</button></nav>
      <div className="compare-hero"><small>One product. Different tone.</small><h4>Design should<br />feel inevitable.</h4><p>The content stays fixed so the visual system is the only variable.</p><button type="button">View system</button></div>
      <div className="compare-tiles"><i /><i /><i /></div>
    </div>
  );
}

function applyCandidate(candidate: CompareCandidate) {
  const analysis: ToneAnalysis = {
    seed: candidate.seed,
    palette: [candidate.seed],
    axes: candidate.axes,
    presetId: candidate.presetId,
    presetName: candidate.label,
    confidence: 100,
    observations: [],
    axisConfidence: { warmth: 100, energy: 100, contrast: 100, saturation: 100, formality: 100, roundness: 100 },
  };
  applyAnalysis(analysis);
}

export function CompareLab() {
  const [candidates, setCandidates] = useState<CompareCandidate[]>([
    presetCandidate(tonePresets[0], 0),
    presetCandidate(tonePresets[1], 1),
    presetCandidate(tonePresets[3], 2),
  ]);
  const [goalId, setGoalId] = useState("authority");
  const goal = tonePresets.find((item) => item.id === goalId) ?? tonePresets[1];

  useEffect(() => {
    const syncExternal = () => {
      const current = parseCurrentCandidate();
      const reverse = readReverseCandidate();
      if (!current && !reverse) return;
      setCandidates((existing) => {
        const next = [...existing];
        if (current) next[0] = current;
        if (reverse) next[Math.min(current ? 1 : 0, next.length - 1)] = reverse;
        return next;
      });
    };
    syncExternal();
    window.addEventListener("tone:reverse", syncExternal);
    return () => window.removeEventListener("tone:reverse", syncExternal);
  }, []);

  const spread = useMemo(() => {
    return axisMeta
      .map(({ key, label }) => {
        const values = candidates.map((candidate) => candidate.axes[key]);
        return { key, label, spread: Math.max(...values) - Math.min(...values) };
      })
      .sort((a, b) => b.spread - a.spread)[0];
  }, [candidates]);

  const setPreset = (candidateKey: string, presetId: string) => {
    const preset = tonePresets.find((item) => item.id === presetId);
    if (!preset) return;
    setCandidates((items) => items.map((item) => item.key === candidateKey ? { ...presetCandidate(preset, Date.now()), key: candidateKey } : item));
  };

  const addCandidate = () => {
    if (candidates.length >= 4) return;
    const used = new Set(candidates.map((candidate) => candidate.presetId));
    const preset = tonePresets.find((item) => !used.has(item.id)) ?? tonePresets[candidates.length % tonePresets.length];
    setCandidates((items) => [...items, presetCandidate(preset, Date.now())]);
  };

  const removeCandidate = (key: string) => {
    if (candidates.length <= 2) return;
    setCandidates((items) => items.filter((item) => item.key !== key));
  };

  return (
    <section className="labs-section compare-section" id="compare">
      <div className="compare-topline">
        <div>
          <span className="labs-index">05</span>
          <p className="eyebrow">Compare Lab</p>
          <h2>Hold the content.<br />Change the character.</h2>
        </div>
        <div className="compare-controls">
          <label>Goal lens<select value={goalId} onChange={(event) => setGoalId(event.target.value)}>{tonePresets.map((preset) => <option value={preset.id} key={preset.id}>{preset.name}</option>)}</select></label>
          <button type="button" onClick={addCandidate} disabled={candidates.length >= 4}><PlusIcon /> Add tone</button>
        </div>
      </div>

      <div className="compare-note"><strong>Largest difference: {spread.label}</strong><span>{spread.spread} points apart across the current candidates. Goal fit is measured against {goal.name} DNA, not against subjective “beauty”.</span></div>

      <div className="compare-cards" style={{ "--compare-count": candidates.length } as CSSProperties}>
        {candidates.map((candidate, index) => {
          const preset = tonePresets.find((item) => item.id === candidate.presetId) ?? tonePresets[0];
          const tokens = createToneTokens({ ...preset, seed: candidate.seed }, candidate.axes);
          const fit = candidateScore(candidate, goal);
          const bodyContrast = getContrast(tokens.canvas, tokens.text);

          return (
            <article className="compare-card" key={candidate.key}>
              <div className="compare-card-head">
                <span>0{index + 1}</span>
                <select aria-label={`Tone ${index + 1}`} value={candidate.presetId} onChange={(event) => setPreset(candidate.key, event.target.value)}>
                  {tonePresets.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
                </select>
                {candidate.source && candidate.source !== "preset" ? <small>{candidate.source}</small> : null}
                {candidates.length > 2 ? <button type="button" aria-label={`Remove ${candidate.label}`} onClick={() => removeCandidate(candidate.key)}>×</button> : null}
              </div>

              <MiniTonePreview candidate={candidate} />

              <div className="compare-score"><strong>{fit}%</strong><span>fit to {goal.name}</span><i style={{ width: `${fit}%` }} /></div>

              <div className="compare-axis-list">
                {axisMeta.map(({ key, label }) => <div key={key}><span>{label}</span><i><b style={{ width: `${candidate.axes[key]}%` }} /></i><strong>{candidate.axes[key]}</strong></div>)}
              </div>

              <div className="compare-metrics">
                <div><strong>{bodyContrast.toFixed(1)}:1</strong><span>contrast</span></div>
                <div><strong>{tokens.radius}px</strong><span>radius</span></div>
                <div><strong>{tokens.motion}ms</strong><span>motion</span></div>
              </div>

              <button type="button" className="compare-use" onClick={() => applyCandidate(candidate)}>Use this tone <ArrowIcon /></button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function ToneLabs() {
  return <><BrandReverse /><CompareLab /></>;
}
