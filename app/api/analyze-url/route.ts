import dns from "node:dns/promises";
import net from "node:net";
import { NextResponse } from "next/server";
import { analyzePalette, type WeightedColor } from "@/lib/tone-analysis";

export const runtime = "nodejs";

const MAX_HTML_BYTES = 900_000;
const MAX_CSS_BYTES = 360_000;
const MAX_STYLESHEETS = 3;

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

function isPrivateIpv4(ip: string) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) return true;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a >= 224
  );
}

function isPrivateIp(ip: string) {
  const version = net.isIP(ip);
  if (version === 4) return isPrivateIpv4(ip);
  if (version === 6) {
    const normalized = ip.toLowerCase();
    return (
      normalized === "::1" ||
      normalized === "::" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe8") ||
      normalized.startsWith("fe9") ||
      normalized.startsWith("fea") ||
      normalized.startsWith("feb") ||
      normalized.startsWith("::ffff:127.") ||
      normalized.startsWith("::ffff:10.") ||
      normalized.startsWith("::ffff:192.168.")
    );
  }
  return true;
}

async function validatePublicUrl(input: string | URL) {
  const url = input instanceof URL ? input : new URL(input);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Only public http(s) URLs are supported.");
  if (url.username || url.password) throw new Error("Credentialed URLs are not supported.");
  if (url.port && !["80", "443"].includes(url.port)) throw new Error("Non-standard ports are not supported.");
  if (url.hostname === "localhost" || url.hostname.endsWith(".local")) throw new Error("Local addresses are not supported.");

  const addresses = await dns.lookup(url.hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateIp(address))) {
    throw new Error("Private or unresolved network addresses are not supported.");
  }
  return url;
}

async function readLimited(response: Response, limit: number) {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limit) throw new Error("The remote resource is too large to inspect.");
  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > limit) {
      await reader.cancel();
      throw new Error("The remote resource is too large to inspect.");
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

async function fetchPublicText(input: URL, limit: number) {
  let url = await validatePublicUrl(input);

  for (let redirect = 0; redirect <= 3; redirect += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);
    let response: Response;
    try {
      response = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "user-agent": "ToneBrandInspector/1.0 (+https://github.com/akiralazycat/tone)",
          accept: "text/html,text/css;q=0.9,*/*;q=0.1",
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirect === 3) throw new Error("Too many redirects while inspecting the URL.");
      url = await validatePublicUrl(new URL(location, url));
      continue;
    }

    if (!response.ok) throw new Error(`The site returned HTTP ${response.status}.`);
    return { text: await readLimited(response, limit), finalUrl: url };
  }

  throw new Error("Unable to inspect the URL.");
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((value) => Math.round(clamp(value, 0, 255)).toString(16).padStart(2, "0")).join("")}`;
}

function normalizeCssColor(raw: string) {
  const value = raw.trim().toLowerCase();
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hex) {
    const body = hex[1];
    if (body.length === 3 || body.length === 4) return `#${body[0]}${body[0]}${body[1]}${body[1]}${body[2]}${body[2]}`;
    return `#${body.slice(0, 6)}`;
  }

  const rgb = value.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
  if (rgb) return rgbToHex(Number(rgb[1]), Number(rgb[2]), Number(rgb[3]));
  return null;
}

function collectColors(text: string, map: Map<string, number>, multiplier = 1) {
  const colorPattern = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g;
  for (const match of text.matchAll(colorPattern)) {
    const color = normalizeCssColor(match[0]);
    if (!color) continue;
    map.set(color, (map.get(color) ?? 0) + multiplier);
  }
}

function attribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  return match?.[1] ?? null;
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1]?.replace(/\s+/g, " ").trim().slice(0, 160) || null;
}

function extractStylesheets(html: string, base: URL) {
  const urls: URL[] = [];
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    const rel = attribute(tag, "rel")?.toLowerCase() ?? "";
    const href = attribute(tag, "href");
    if (!href || !rel.split(/\s+/).includes("stylesheet")) continue;
    try {
      const url = new URL(href, base);
      if (url.protocol === "http:" || url.protocol === "https:") urls.push(url);
    } catch {
      // Ignore malformed stylesheet links.
    }
    if (urls.length >= MAX_STYLESHEETS) break;
  }
  return urls;
}

function inferCssSignals(cssText: string) {
  const radii: number[] = [];
  for (const match of cssText.matchAll(/border-radius\s*:\s*([\d.]+)(px|rem)/gi)) {
    const px = Number(match[1]) * (match[2].toLowerCase() === "rem" ? 16 : 1);
    if (Number.isFinite(px) && px <= 96) radii.push(px);
  }
  radii.sort((a, b) => a - b);
  const medianRadius = radii.length ? radii[Math.floor(radii.length / 2)] : null;
  const roundness = medianRadius === null ? undefined : Math.round(clamp(12 + medianRadius * 2.8));

  const fontBlocks = [...cssText.matchAll(/font-family\s*:\s*([^;}]+)/gi)].map((match) => match[1].toLowerCase());
  const serifSignal = fontBlocks.filter((value) => /\b(serif|georgia|garamond|times|baskerville)\b/.test(value)).length;
  const casualSignal = fontBlocks.filter((value) => /\b(rounded|comic|cursive)\b/.test(value)).length;
  let formality: number | undefined;
  if (fontBlocks.length) formality = Math.round(clamp(62 + serifSignal * 6 - casualSignal * 10 - (roundness ?? 45) * 0.12));

  return { roundness, formality };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { url?: unknown };
    if (typeof body.url !== "string" || body.url.length > 2048) {
      return NextResponse.json({ error: "Enter a valid public URL." }, { status: 400 });
    }

    const requested = body.url.match(/^https?:\/\//i) ? body.url : `https://${body.url}`;
    const initialUrl = await validatePublicUrl(requested);
    const { text: html, finalUrl } = await fetchPublicText(initialUrl, MAX_HTML_BYTES);
    const content = html.slice(0, MAX_HTML_BYTES);
    const colorWeights = new Map<string, number>();

    collectColors(content, colorWeights, 1);

    for (const meta of content.matchAll(/<meta\b[^>]*>/gi)) {
      const tag = meta[0];
      const name = attribute(tag, "name")?.toLowerCase();
      const property = attribute(tag, "property")?.toLowerCase();
      if (name === "theme-color" || property === "theme-color") {
        const color = normalizeCssColor(attribute(tag, "content") ?? "");
        if (color) colorWeights.set(color, (colorWeights.get(color) ?? 0) + 18);
      }
    }

    let cssText = "";
    const stylesheets = extractStylesheets(content, finalUrl);
    const results = await Promise.allSettled(
      stylesheets.map(async (stylesheet) => {
        const safe = await validatePublicUrl(stylesheet);
        return fetchPublicText(safe, MAX_CSS_BYTES);
      }),
    );

    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      cssText += `\n${result.value.text}`;
      collectColors(result.value.text, colorWeights, 2.2);
    }

    const samples: WeightedColor[] = [...colorWeights.entries()].map(([color, weight]) => ({ color, weight }));
    const signals = inferCssSignals(`${content}\n${cssText}`);
    const analysis = analyzePalette(samples, { ...signals, source: "url" });

    return NextResponse.json({
      analysis,
      page: {
        title: extractTitle(content),
        url: finalUrl.toString(),
        stylesheetsInspected: results.filter((result) => result.status === "fulfilled").length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to inspect that URL.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
