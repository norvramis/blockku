# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

Blockku is a lightweight Chromium Manifest V3 ad-blocker extension. It uses pure vanilla JavaScript, CSS, and declarative rules with no build tools or package managers.

- `manifest.json`: Manifest V3 config declaring DNR rulesets, content scripts, and service worker.
- `rules.json`: Declarative Net Request (DNR) static rule definitions for blocking network requests by URL filter patterns.
- `src/background/service-worker.js`: Service worker managing declarative ruleset state (`adblock_rules`) synced with `chrome.storage.local.get("enabled")`.
- `src/content/injector.js`: Main-world script intercepting APIs (`fetch`, `XHR`, `window.open`) and ad scripts.
- `src/content/content.js`: Content script injected at `document_start`. Handles DOM purging, banner heuristics, and click traps.
- `src/content/cosmetic.css`: Static stylesheet hiding common ad containers, banners, and sponsored units across matching sites.
- `src/popup/`: Extension toolbar popup markup (`popup.html`), stylesheet (`popup.css`), and logic (`popup.js`).

## Development & Testing Workflow

There is no compilation or build pipeline.

### Loading into Browser
1. Open Chrome/Chromium: navigate to `chrome://extensions/`.
2. Enable **Developer mode** (top right toggle).
3. Click **Load unpacked** and select the extension root directory (`D:\Tools\Blockku`).
4. Click the refresh icon on the extension card after making edits to reload scripts and rulesets.

### Debugging
- **Background Service Worker**: Click `service worker` link under Blockku in `chrome://extensions/` to inspect console logs (`[Blockku] Enabled rulesets`).
- **Popup UI**: Right-click the extension toolbar icon and select `Inspect popup`.
- **Content Scripts**: Open standard DevTools (`F12`) on any loaded webpage and inspect Console / Elements tab.
