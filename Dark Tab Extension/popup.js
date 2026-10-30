const $ = (id) => document.getElementById(id);
const globalToggle = $("globalToggle"), siteToggle = $("siteToggle");
const siteName = $("siteName"), statusEl = $("status");
const brightness = $("brightness"), contrast = $("contrast");
const bVal = $("bVal"), cVal = $("cVal");

let currentHost = "";
let dragging = false;
let saveTimer = 0;
const DEFAULTS = { enabled: true, disabledSites: [], brightness: 90, contrast: 100 };

// Tabs
document.querySelectorAll(".tab").forEach((t) =>
  t.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("active", x === t));
    document.querySelectorAll(".panel").forEach((p) =>
      p.classList.toggle("active", p.id === t.dataset.panel));
  }));

function refresh({ enabled, disabledSites, brightness: b, contrast: c }) {
  globalToggle.checked = enabled;
  const excluded = disabledSites.includes(currentHost);
  siteToggle.checked = excluded;
  siteToggle.disabled = !currentHost;
  siteName.textContent = currentHost || "n/a";
  if (!dragging) {
    brightness.value = b; bVal.textContent = b + "%";
    contrast.value = c; cVal.textContent = c + "%";
  }
  statusEl.textContent = !enabled ? "Off everywhere" : excluded ? "Off on this site" : "On";
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    const u = new URL(tab.url);
    currentHost = /^https?:$/.test(u.protocol) ? u.hostname : "";
  } catch { currentHost = ""; }
  chrome.storage.local.get(DEFAULTS, refresh);
}

globalToggle.addEventListener("change", () =>
  chrome.storage.local.set({ enabled: globalToggle.checked }));

siteToggle.addEventListener("change", () => {
  chrome.storage.local.get({ disabledSites: [] }, ({ disabledSites }) => {
    const list = siteToggle.checked
      ? [...new Set([...disabledSites, currentHost])]
      : disabledSites.filter((h) => h !== currentHost);
    chrome.storage.local.set({ disabledSites: list });
  });
});

// Sliders: update label instantly, save throttled to avoid lag
function onSlide() {
  dragging = true;
  bVal.textContent = brightness.value + "%";
  cVal.textContent = contrast.value + "%";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 60);
}
function save() {
  chrome.storage.local.set({ brightness: +brightness.value, contrast: +contrast.value });
}
[brightness, contrast].forEach((el) => {
  el.addEventListener("input", onSlide);
  el.addEventListener("change", () => { dragging = false; save(); });
});

$("reset").addEventListener("click", () => {
  dragging = false;
  chrome.storage.local.set({ brightness: DEFAULTS.brightness, contrast: DEFAULTS.contrast });
});

chrome.storage.onChanged.addListener(() => chrome.storage.local.get(DEFAULTS, refresh));

init();