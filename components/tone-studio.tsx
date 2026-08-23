"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { HouseBar } from "@/components/house-bar";
import {
  axisMeta,
  createToneTokens,
  getContrast,
  toAiBrief,
  toCss,
  tonePresets,
  type ToneAxes,
  type TonePreset,
} from "@/lib/tones";

type ExportMode = "css" | "json" | "ai";
type PreviewMode = "desktop" | "mobile";

type IconProps = { size?: number };

function CopyIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="8" y="8" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16 8V6.7A1.7 1.7 0 0 0 14.3 5H6.7A1.7 1.7 0 0 0 5 6.7v7.6A1.7 1.7 0 0 0 6.7 16H8" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function LinkIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m9.5 14.5 5-5M7.8 17.9l-1.7 1.7a3 3 0 0 1-4.2-4.2l4.2-4.2a3 3 0 0 1 4.2 0M16.2 6.1l1.7-1.7a3 3 0 1 1 4.2 4.2l-4.2 4.2a3 3 0 0 1-4.2 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function SparkIcon({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2.8c.7 5.1 3.1 7.5 8.2 8.2-5.1.7-7.5 3.1-8.2 8.2-.7-5.1-3.1-7.5-8.2-8.2C8.9 10.3 11.3 7.9 12 2.8Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function DeviceIcon({ mobile = false }: { mobile?: boolean }) {
  return mobile ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="7" y="2.5" width="10" height="19" rx="2.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10.5 18.5h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2.5" y="4" width="19" height="13" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9 21h6M12 17v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 12.5 4.2 4.2L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const isHex = (value: string) => /^#[0-9a-fA-F]{6}$/.test(value);

function PresetCard({ preset, selected, onSelect }: { preset: TonePreset; selected: boolean; onSelect: () => void }) {
  return (
    <button className={`preset-card${selected ? " is-selected" : ""}`} type="button" onClick={onSelect} aria-pressed={selected}>
      <span className="preset-swatch" style={{ background: preset.seed }} />
      <span className="preset-copy">
        <strong>{preset.name}</strong>
        <small>{preset.eyebrow}</small>
      </span>
      {selected ? <span className="preset-check"><CheckIcon /></span> : null}
    </button>
  );
}

function StudioPreview({ preset, axes, seed, mode }: { preset: TonePreset; axes: ToneAxes; seed: string; mode: PreviewMode }) {
  const tunedPreset = useMemo(() => ({ ...preset, seed }), [preset, seed]);
  const tokens = useMemo(() => createToneTokens(tunedPreset, axes), [tunedPreset, axes]);
  const previewStyle = {
    "--p-canvas": tokens.canvas,
    "--p-surface": tokens.surface,
    "--p-surface-strong": tokens.surfaceStrong,
    "--p-text": tokens.text,
    "--p-soft": tokens.textSoft,
    "--p-accent": tokens.accent,
    "--p-accent-soft": tokens.accentSoft,
    "--p-accent-ink": tokens.accentInk,
    "--p-border": tokens.border,
    "--p-radius": `${tokens.radius}px`,
    "--p-shadow": tokens.shadow,
    "--p-motion": `${tokens.motion}ms`,
    "--p-track": `${tokens.tracking}em`,
  } as CSSProperties;

  return (
    <div className={`preview-shell ${mode}`} style={previewStyle}>
      <div className="browser-chrome">
        <span /><span /><span />
        <div className="address-pill">sample.tone</div>
      </div>
      <div className="preview-page">
        <nav className="sample-nav">
          <div className="sample-brand"><span className="sample-mark" /> Northstar</div>
          <div className="sample-links"><span>Product</span><span>Journal</span><span>About</span></div>
          <button type="button" className="sample-ghost">Sign in</button>
        </nav>

        <main className="sample-main">
          <section className="sample-hero">
            <div className="sample-kicker"><span /> A considered digital system</div>
            <h2>Make the interface<br />feel intentional.</h2>
            <p>Design direction with enough structure to stay coherent from the first screen to the hundredth.</p>
            <div className="sample-actions">
              <button type="button" className="sample-primary">Explore the system <span>↗</span></button>
              <button type="button" className="sample-text-button">Read the notes</button>
            </div>
          </section>

          <section className="sample-grid">
            <article className="sample-feature sample-feature-large">
              <div className="sample-feature-top"><span>01</span><span>Principle</span></div>
              <div className="sample-orbit">
                <span className="orbit-one" /><span className="orbit-two" /><span className="orbit-core" />
              </div>
              <div>
                <h3>Signal over decoration.</h3>
                <p>Every visual decision earns its place.</p>
              </div>
            </article>
            <article className="sample-feature">
              <div className="sample-feature-top"><span>02</span><span>System</span></div>
              <div className="sample-bars"><i /><i /><i /><i /></div>
              <div>
                <h3>One visual grammar.</h3>
                <p>Color, shape and motion speak together.</p>
              </div>
            </article>
            <article className="sample-feature sample-quote">
              <div className="sample-feature-top"><span>03</span><span>Note</span></div>
              <blockquote>“The quieter the system, the clearer the hierarchy.”</blockquote>
              <div className="sample-avatar-row"><span className="sample-avatar" /><span>Studio note · 04</span></div>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}

export default function ToneStudio() {
  const [presetId, setPresetId] = useState(tonePresets[0].id);
  const preset = tonePresets.find((item) => item.id === presetId) ?? tonePresets[0];
  const [axes, setAxes] = useState<ToneAxes>(tonePresets[0].axes);
  const [seed, setSeed] = useState(tonePresets[0].seed);
  const [hexDraft, setHexDraft] = useState(tonePresets[0].seed);
  const [exportMode, setExportMode] = useState<ExportMode>("css");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedPreset = tonePresets.find((item) => item.id === params.get("tone"));
    if (!sharedPreset) return;

    const nextAxes = { ...sharedPreset.axes };
    for (const { key } of axisMeta) {
      const parsed = Number(params.get(key));
      if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 100) nextAxes[key] = parsed;
    }
    const sharedSeed = params.get("seed");
    const nextSeed = sharedSeed && isHex(`#${sharedSeed.replace("#", "")}`) ? `#${sharedSeed.replace("#", "")}` : sharedPreset.seed;

    setPresetId(sharedPreset.id);
    setAxes(nextAxes);
    setSeed(nextSeed);
    setHexDraft(nextSeed);
  }, []);

  const tunedPreset = useMemo(() => ({ ...preset, seed }), [preset, seed]);
  const tokens = useMemo(() => createToneTokens(tunedPreset, axes), [tunedPreset, axes]);
  const contrast = getContrast(tokens.accent, tokens.accentInk);
  const bodyContrast = getContrast(tokens.canvas, tokens.text);

  const exportText = useMemo(() => {
    if (exportMode === "css") return toCss(tokens);
    if (exportMode === "json") {
      return JSON.stringify({ tone: preset.name, seed, axes, tokens }, null, 2);
    }
    return toAiBrief(tunedPreset, axes, tokens);
  }, [axes, exportMode, preset.name, seed, tokens, tunedPreset]);

  const selectPreset = (nextPreset: TonePreset) => {
    setPresetId(nextPreset.id);
    setAxes(nextPreset.axes);
    setSeed(nextPreset.seed);
    setHexDraft(nextPreset.seed);
  };

  const updateAxis = (key: keyof ToneAxes, value: number) => {
    setAxes((current) => ({ ...current, [key]: value }));
  };

  const commitHex = () => {
    if (isHex(hexDraft)) setSeed(hexDraft.toLowerCase());
    else setHexDraft(seed);
  };

  const copy = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 1500);
  };

  const copyShareLink = async () => {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("tone", preset.id);
    url.searchParams.set("seed", seed.slice(1));
    for (const { key } of axisMeta) url.searchParams.set(key, String(axes[key]));
    await copy(url.toString(), "link");
  };

  const remix = () => {
    const next = tonePresets[Math.floor(Math.random() * tonePresets.length)];
    const jitter = (value: number) => Math.max(0, Math.min(100, value + Math.round(Math.random() * 20 - 10)));
    setPresetId(next.id);
    setAxes({
      warmth: jitter(next.axes.warmth),
      energy: jitter(next.axes.energy),
      contrast: jitter(next.axes.contrast),
      saturation: jitter(next.axes.saturation),
      formality: jitter(next.axes.formality),
      roundness: jitter(next.axes.roundness),
    });
    setSeed(next.seed);
    setHexDraft(next.seed);
  };

  return (
    <>
      <HouseBar product="Tone" />
      <main className="studio">
      <header className="site-header">
        <a className="tone-logo" href="#top" aria-label="Tone home"><span className="tone-logo-dot" />Tone</a>
        <nav className="site-nav" aria-label="Primary navigation">
          <a href="#studio">Studio</a>
          <a href="#library">Library</a>
          <a href="#handoff">Handoff</a>
        </nav>
        <button className="header-link" type="button" onClick={copyShareLink}>
          {copied === "link" ? <CheckIcon /> : <LinkIcon />}
          {copied === "link" ? "Link copied" : "Share tone"}
        </button>
      </header>

      <section className="intro" id="top">
        <div>
          <p className="eyebrow">Color direction, beyond palettes</p>
          <h1>Give a product<br />the right <em>tone.</em></h1>
        </div>
        <div className="intro-copy">
          <p>Translate intent into a coherent visual grammar: color, contrast, geometry, depth, typography and motion — then hand the result directly to code or AI.</p>
          <button type="button" className="remix-button" onClick={remix}><SparkIcon /> Remix direction</button>
        </div>
      </section>

      <section className="workspace" id="studio">
        <aside className="control-panel">
          <div className="panel-heading">
            <div><span className="step-index">01</span><h2>Direction</h2></div>
            <span className="panel-caption">Start with intent</span>
          </div>

          <div className="preset-list" id="library">
            {tonePresets.map((item) => (
              <PresetCard key={item.id} preset={item} selected={item.id === preset.id} onSelect={() => selectPreset(item)} />
            ))}
          </div>

          <div className="panel-divider" />

          <div className="control-section">
            <div className="section-label-row"><label htmlFor="seed-color">Accent seed</label><span>Foundation hue</span></div>
            <div className="color-control">
              <label className="color-chip" style={{ background: seed }} aria-label="Choose accent seed color">
                <input id="seed-color" type="color" value={seed} onChange={(event) => { setSeed(event.target.value); setHexDraft(event.target.value); }} />
              </label>
              <input className="hex-input" value={hexDraft} onChange={(event) => setHexDraft(event.target.value)} onBlur={commitHex} onKeyDown={(event) => { if (event.key === "Enter") commitHex(); }} aria-label="Accent seed hex value" />
              <span className="color-result" style={{ background: tokens.accent }} title="Generated accent" />
            </div>
          </div>

          <div className="axis-controls">
            {axisMeta.map(({ key, label, low, high }) => (
              <label className="axis-control" key={key}>
                <span className="axis-head"><strong>{label}</strong><output>{axes[key]}</output></span>
                <input type="range" min="0" max="100" value={axes[key]} onChange={(event) => updateAxis(key, Number(event.target.value))} />
                <span className="axis-ends"><small>{low}</small><small>{high}</small></span>
              </label>
            ))}
          </div>
        </aside>

        <section className="preview-panel">
          <div className="preview-heading">
            <div>
              <span className="step-index">02</span>
              <div><h2>See it in context</h2><p>{preset.description}</p></div>
            </div>
            <div className="device-toggle" aria-label="Preview size">
              <button type="button" aria-label="Desktop preview" className={previewMode === "desktop" ? "is-active" : ""} onClick={() => setPreviewMode("desktop")}><DeviceIcon /></button>
              <button type="button" aria-label="Mobile preview" className={previewMode === "mobile" ? "is-active" : ""} onClick={() => setPreviewMode("mobile")}><DeviceIcon mobile /></button>
            </div>
          </div>

          <StudioPreview preset={preset} axes={axes} seed={seed} mode={previewMode} />

          <div className="token-strip">
            {[
              ["Canvas", tokens.canvas], ["Surface", tokens.surface], ["Text", tokens.text], ["Accent", tokens.accent], ["Soft accent", tokens.accentSoft], ["Border", tokens.border],
            ].map(([label, color]) => (
              <button type="button" className="token-swatch" key={label} onClick={() => copy(color, `color-${label}`)} title={`Copy ${color}`}>
                <span style={{ background: color }} />
                <small>{label}</small>
                <strong>{copied === `color-${label}` ? "Copied" : color.toUpperCase()}</strong>
              </button>
            ))}
          </div>

          <div className="quality-row">
            <div><span className={`quality-dot ${bodyContrast >= 7 ? "excellent" : "good"}`} /><strong>{bodyContrast.toFixed(1)}:1</strong><small>Body contrast</small></div>
            <div><span className={`quality-dot ${contrast >= 7 ? "excellent" : "good"}`} /><strong>{contrast.toFixed(1)}:1</strong><small>Accent contrast</small></div>
            <div><strong>{tokens.radius}px</strong><small>Radius system</small></div>
            <div><strong>{tokens.motion}ms</strong><small>Base motion</small></div>
          </div>
        </section>
      </section>

      <section className="handoff" id="handoff">
        <div className="handoff-intro">
          <span className="step-index">03</span>
          <p className="eyebrow">From taste to specification</p>
          <h2>Hand the direction<br />to anything.</h2>
          <p className="handoff-copy">Tone exports the decisions behind the look, not just six hex values. Paste the AI brief into a coding agent, or use the same tokens directly in your codebase.</p>
          <div className="tone-dna">
            <span>Tone DNA</span>
            <div>{axisMeta.map(({ key, label }) => <i key={key} title={`${label}: ${axes[key]}`} style={{ height: `${22 + axes[key] * 0.34}px` }} />)}</div>
          </div>
        </div>

        <div className="export-card">
          <div className="export-tabs" role="tablist" aria-label="Export format">
            {(["css", "json", "ai"] as ExportMode[]).map((mode) => (
              <button type="button" role="tab" aria-selected={exportMode === mode} className={exportMode === mode ? "is-active" : ""} key={mode} onClick={() => setExportMode(mode)}>
                {mode === "ai" ? "AI brief" : mode.toUpperCase()}
              </button>
            ))}
            <button className="export-copy" type="button" onClick={() => copy(exportText, "export")}>
              {copied === "export" ? <CheckIcon /> : <CopyIcon />}{copied === "export" ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="export-code"><code>{exportText}</code></pre>
          <div className="export-footer">
            <span><i style={{ background: tokens.accent }} /> {preset.name} / custom</span>
            <span>No account · no upload · local only</span>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div><span className="tone-logo-dot" />Tone</div>
        <p>Color is a symptom. Tone is the system.</p>
        <span>Built for deliberate interfaces.</span>
      </footer>
      </main>
    </>
  );
}
