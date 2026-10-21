const RULESET_ID = "adblock_rules";

// Update icon visual state: active color icon vs muted grayscale icon
async function updateIconState(isEnabled) {
  try {
    const iconObj = isEnabled ? {
      "16": "assets/icons/icon-16.png",
      "32": "assets/icons/icon-32.png",
      "48": "assets/icons/icon-48.png",
      "128": "assets/icons/icon-128.png"
    } : {
      "16": "assets/icons/icon-16-off.png",
      "32": "assets/icons/icon-32-off.png",
      "48": "assets/icons/icon-48-off.png",
      "128": "assets/icons/icon-128-off.png"
    };
    await chrome.action.setIcon({ path: iconObj });
  } catch (err) {
    console.warn("[Blockku] updateIconState error:", err);
  }
}

// Dynamic rules sync
async function syncRuleset() {
  const { enabled } = await chrome.storage.local.get("enabled");
  const isEnabled = enabled !== false;
  if (enabled === undefined) {
    await chrome.storage.local.set({ enabled: true });
  }

  // 0. Update toolbar icon image (color when ON, grayscale when OFF)
  await updateIconState(isEnabled);

  // 1. Static ruleset sync
  try {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      [isEnabled ? "enableRulesetIds" : "disableRulesetIds"]: [RULESET_ID]
    });
  } catch (err) {
    console.warn("[Blockku] updateEnabledRulesets error:", err);
  }

  // 2. Dynamic rules sync for whitelisted domains
  try {
    const { whitelistedHosts = [] } = await chrome.storage.local.get("whitelistedHosts");
    const existingDynamic = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existingDynamic.map(r => r.id);

    const addRules = (!isEnabled || whitelistedHosts.length === 0) ? [] : whitelistedHosts.map((host, idx) => ({
      id: idx + 1,
      priority: 100,
      action: { type: "allowAllRequests" },
      condition: {
        initiatorDomains: [host],
        resourceTypes: ["main_frame", "sub_frame", "stylesheet", "script", "image", "font", "object", "xmlhttprequest", "ping", "csp_report", "media", "websocket", "other"]
      }
    }));

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules
    });
  } catch (err) {
    console.warn("[Blockku] Whitelist dynamic rules error:", err);
  }
}

// Track blocked requests counter via DNR Feedback API
if (chrome.declarativeNetRequest && chrome.declarativeNetRequest.onRuleMatchedDebug) {
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(async (info) => {
    if (info && info.rule) {
      const tabId = info.request && info.request.tabId;
      const keys = ["blockedTotal"];
      if (tabId && tabId > 0) keys.push(`tab_${tabId}`);

      const res = await chrome.storage.local.get(keys);
      const updates = {
        blockedTotal: (res.blockedTotal || 0) + 1
      };
      if (tabId && tabId > 0) {
        updates[`tab_${tabId}`] = (res[`tab_${tabId}`] || 0) + 1;
      }
      await chrome.storage.local.set(updates);
    }
  });
}

// Bersihkan hitungan tab lama saat tab ditutup
if (chrome.tabs && chrome.tabs.onRemoved) {
  chrome.tabs.onRemoved.addListener((tabId) => {
    chrome.storage.local.remove(`tab_${tabId}`);
  });
}

chrome.runtime.onInstalled.addListener(syncRuleset);
chrome.runtime.onStartup.addListener(syncRuleset);

// Sync immediately on worker start
syncRuleset();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.enabled !== undefined || changes.whitelistedHosts !== undefined)) {
    syncRuleset();
  }
});
