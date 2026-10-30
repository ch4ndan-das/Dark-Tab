const STYLE_ID = "dark-tab-style";
const CACHE_KEY = "dark-tab-native-dark";
const DEFAULTS = { enabled: true, disabledSites: [], brightness: 90, contrast: 100 };

let s = { ...DEFAULTS };
let nativeDark = null;
let raf = 0;

try {
  const c = localStorage.getItem(CACHE_KEY);
  if (c !== null) nativeDark = c === "1";
} catch {}

function buildCSS(b, c) {
  return `
    html, body { background-color: #e8edff !important; }
    html { filter: invert(1) hue-rotate(180deg) brightness(${b}%) contrast(${c}%) !important; }
    img, video, picture, canvas, svg, iframe, embed, object,
    [style*="background-image"] { filter: invert(1) hue-rotate(180deg) !important; }
  `;
}

function parseColor(str) {
  const m = (str || "").match(/[\d.]+/g);
  if (!m || m.length < 3) return null;
  const [r, g, b, a = 1] = m.map(Number);
  return { r, g, b, a };
}

const lum = ({ r, g, b }) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;

function detectNativeDark() {
  const style = document.getElementById(STYLE_ID);
  if (style) style.media = "not all";

  let dark = null;
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta && /^\s*dark/i.test(meta.content)) dark = true;

  if (dark === null) {
    for (const el of [document.body, document.documentElement]) {
      if (!el) continue;
      const c = parseColor(getComputedStyle(el).backgroundColor);
      if (c && c.a > 0.05) { dark = lum(c) < 0.45; break; }
    }
  }
  if (dark === null && document.body) {
    const t = parseColor(getComputedStyle(document.body).color);
    dark = t ? lum(t) > 0.65 : false;
  }

  if (style) style.media = "all";
  return !!dark;
}

function apply() {
  let on = s.enabled && nativeDark !== true && !s.disabledSites.includes(location.hostname);
  let style = document.getElementById(STYLE_ID);
  if (on) {
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(style);
    }
    style.textContent = buildCSS(s.brightness, s.contrast);
  } else if (style) {
    style.remove();
  }
}

function schedule() {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(apply);
}

function runDetect() {
  const result = detectNativeDark();
  if (result !== nativeDark) {
    nativeDark = result;
    try { localStorage.setItem(CACHE_KEY, result ? "1" : "0"); } catch {}
    schedule();
  }
}

chrome.storage.local.get(DEFAULTS).then((v) => { s = v; apply(); });

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  for (const k in changes) s[k] = changes[k].newValue;
  schedule();
});

document.addEventListener("DOMContentLoaded", runDetect);
window.addEventListener("load", () => {
  runDetect();
  setTimeout(runDetect, 1000);
});