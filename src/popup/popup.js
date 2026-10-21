document.addEventListener("DOMContentLoaded", () => {
  const logoBtn = document.getElementById("logoBtn");
  const blockedCount = document.getElementById("blockedCount");
  const statusText = document.getElementById("statusText");
  const currentHostLink = document.getElementById("currentHostLink");
  const whitelistBtn = document.getElementById("whitelistBtn");
  const reportBtn = document.getElementById("reportBtn");

  const inlineConfirm = document.getElementById("inlineConfirm");
  const confirmNo = document.getElementById("confirmNo");
  const confirmYes = document.getElementById("confirmYes");

  const reloadConfirm = document.getElementById("reloadConfirm");
  const reloadNo = document.getElementById("reloadNo");
  const reloadYes = document.getElementById("reloadYes");

  let isEnabled = true;
  let currentHostname = "";
  let isWhitelisted = false;
  let currentTabId = null;

  function updateUI(enabled, count = 0) {
    isEnabled = enabled;

    if (!enabled || isWhitelisted) {
      logoBtn.className = "logo-container disabled";
      statusText.textContent = isWhitelisted ? "Paused (Site)" : "Disabled";
      statusText.className = "status-text off";
    } else {
      logoBtn.className = "logo-container";
      statusText.textContent = "Active";
      statusText.className = "status-text";
    }

    const prev = blockedCount.textContent;
    const next = count > 999 ? "999+" : String(count);
    if (prev !== next) {
      blockedCount.textContent = next;
      blockedCount.classList.add("pulse");
      setTimeout(() => blockedCount.classList.remove("pulse"), 200);
    }
  }

  function updateWhitelistBtn(active) {
    if (active) {
      whitelistBtn.className = "action-btn active";
      whitelistBtn.textContent = "Remove whitelist";
    } else {
      whitelistBtn.className = "action-btn";
      whitelistBtn.textContent = "Add to whitelist";
    }
  }

  function markAsReported() {
    reportBtn.textContent = "Reported (1x max)";
    reportBtn.className = "report-btn reported";
    reportBtn.disabled = true;
  }

  // 1. Ambil info website aktif
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      currentTabId = tabs[0].id;
    }
    if (tabs && tabs[0] && tabs[0].url) {
      const rawUrl = tabs[0].url;
      try {
        const u = new URL(rawUrl);
        if (u.protocol.startsWith("http")) {
          currentHostname = u.hostname;
          currentHostLink.textContent = u.hostname;
          currentHostLink.href = rawUrl;
          currentHostLink.title = rawUrl;
        } else {
          currentHostname = "";
          currentHostLink.textContent = u.protocol.replace(":", "");
          currentHostLink.removeAttribute("href");
        }
      } catch (_) {
        currentHostname = "";
        currentHostLink.textContent = "-";
        currentHostLink.removeAttribute("href");
      }

      if (currentHostname) {
        chrome.storage.local.get(["whitelistedHosts", "reportedHosts"], (res) => {
          const whitelisted = res.whitelistedHosts || [];
          isWhitelisted = whitelisted.includes(currentHostname);
          updateWhitelistBtn(isWhitelisted);

          const reported = res.reportedHosts || [];
          if (reported.includes(currentHostname)) {
            markAsReported();
          }
          updateUI(isEnabled, parseInt(blockedCount.textContent) || 0);
        });
      }
    }
  });

  function syncToolbarIcon(enabled) {
    if (chrome.action && chrome.action.setIcon) {
      const iconObj = enabled ? {
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
      chrome.action.setIcon({ path: iconObj });
    }
  }

  // 2. Load stored state
  chrome.storage.local.get(["enabled", "blockedTotal"], (res) => {
    const enabled = res.enabled !== false;
    const count = res.blockedTotal || 0;
    updateUI(enabled, count);
  });

  // Live storage sync
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local") {
      if (changes.blockedTotal !== undefined) {
        updateUI(isEnabled, changes.blockedTotal.newValue || 0);
      }
      if (changes.enabled !== undefined) {
        const nextEnabled = changes.enabled.newValue !== false;
        updateUI(nextEnabled, parseInt(blockedCount.textContent) || 0);
      }
      if (changes.whitelistedHosts !== undefined && currentHostname) {
        const list = changes.whitelistedHosts.newValue || [];
        isWhitelisted = list.includes(currentHostname);
        updateWhitelistBtn(isWhitelisted);
        updateUI(isEnabled, parseInt(blockedCount.textContent) || 0);
      }
    }
  });

  // 3. Logo adalah ON / OFF switch utama (Zero-latency optimistic UI)
  logoBtn.addEventListener("click", () => {
    const next = !isEnabled;
    // 1. Update UI & toolbar icon INSTANTLY (0ms delay)
    updateUI(next, parseInt(blockedCount.textContent) || 0);
    syncToolbarIcon(next);

    // 2. Persist state asynchronously in background
    chrome.storage.local.set({ enabled: next }, () => {
      if (currentHostname && currentTabId) {
        inlineConfirm.classList.remove("show");
        reloadConfirm.classList.add("show");
      }
    });
  });

  // 4. Whitelist Action Link
  whitelistBtn.addEventListener("click", () => {
    if (!currentHostname) return;
    chrome.storage.local.get("whitelistedHosts", (res) => {
      let list = res.whitelistedHosts || [];
      if (isWhitelisted) {
        list = list.filter(h => h !== currentHostname);
        isWhitelisted = false;
      } else {
        list.push(currentHostname);
        isWhitelisted = true;
      }
      chrome.storage.local.set({ whitelistedHosts: list }, () => {
        updateWhitelistBtn(isWhitelisted);
        updateUI(isEnabled, parseInt(blockedCount.textContent) || 0);
        if (currentTabId) {
          inlineConfirm.classList.remove("show");
          reloadConfirm.classList.add("show");
        }
      });
    });
  });

  // 5. Reload Confirmation Handlers
  reloadNo.addEventListener("click", () => {
    reloadConfirm.classList.remove("show");
  });

  reloadYes.addEventListener("click", () => {
    reloadConfirm.classList.remove("show");
    if (currentTabId) {
      chrome.tabs.reload(currentTabId);
      window.close();
    }
  });

  // 6. Report Action Link (Konfirmasi inline di bawah)
  reportBtn.addEventListener("click", () => {
    if (reportBtn.disabled || !currentHostname) return;
    reloadConfirm.classList.remove("show");
    inlineConfirm.classList.toggle("show");
  });

  confirmNo.addEventListener("click", () => {
    inlineConfirm.classList.remove("show");
  });

  confirmYes.addEventListener("click", () => {
    inlineConfirm.classList.remove("show");
    chrome.storage.local.get("reportedHosts", (res) => {
      const list = res.reportedHosts || [];
      if (!list.includes(currentHostname)) {
        list.push(currentHostname);
        chrome.storage.local.set({ reportedHosts: list });
      }
      markAsReported();
      const issueUrl = `https://github.com/issues?q=is%3Aissue+${encodeURIComponent(currentHostname)}`;
      chrome.tabs.create({ url: issueUrl });
    });
  });
});
