function setBadge(enabled) {
  chrome.action.setBadgeText({ text: enabled ? "ON" : "" });
  chrome.action.setBadgeBackgroundColor({ color: "#7c5cff" });
}

async function initBadge() {
  const { enabled } = await chrome.storage.local.get({ enabled: true });
  setBadge(enabled);
}

chrome.runtime.onInstalled.addListener(initBadge);
chrome.runtime.onStartup.addListener(initBadge);

chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) setBadge(changes.enabled.newValue);
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-dark-mode") return;
  const { enabled } = await chrome.storage.local.get({ enabled: true });
  await chrome.storage.local.set({ enabled: !enabled });
});