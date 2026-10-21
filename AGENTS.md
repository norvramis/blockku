# AGENTS.md

Guidance for AI agents working in `Blockku`.

## What This Repo Is

Chromium Manifest V3 ad-blocker extension. Zero build toolchain (vanilla JS, CSS, JSON; no bundler/package manager).

## Architecture & Execution Model

1. **Declarative Net Request (DNR)**
   - `rules.json`: Static DNR rules (`adblock_rules`). EasyList + ABPindo compiled (~26,612 rules).
   - `src/background/service-worker.js`: Service worker toggling static ruleset and managing dynamic DNR rules (used **only** for `whitelistedHosts` via `allowAllRequests`, priority 100).
2. **Main-World Hooking (`src/content/injector.js`)**
   - Runs in `"world": "MAIN"` at `document_start`.
   - Intercepts `window.fetch`, `XMLHttpRequest`, `window.open`, `document.createElement('script'/'iframe')`, and `HTMLMediaElement.prototype.play`.
   - Blocks programmatic popunders while allowing legitimate OAuth/external navigation.
   - Defuses anti-adblock globals (`s_test_ads`, `vast_options`, `showAds`, `AGC_POPUNDER_DISABLE`, `popundr1`).
   - Contains serialized `blockedHosts` set matching `rules.json`.
3. **Isolated-World DOM Shield (`src/content/content.js` + `src/content/cosmetic.css`)**
   - Runs in isolated content script world at `document_start`.
   - Scopes all `cosmetic.css` rules under `:is(html:not(.blockku-disabled))` so disabling protection deactivates cosmetic styles instantly.
   - Universal affiliate banner detector (`a[href]:has(img, picture)` + bounded ad heuristics + aspect ratios).
   - Geometric overlay click-trap interceptor (`isClickTrapElement`), video ad skip triggers, and `MutationObserver` DOM purging.
4. **Popup UI (`src/popup/popup.html`, `popup.css`, `popup.js`)**
   - Main switch toggles protection globally (`chrome.storage.local`).
   - Optimistic UI updates popup and toolbar icon immediately (0ms delay) before async DNR storage commit.
   - Whitelist toggle for active tab hostname.
   - Inline reload confirmation prompt (`#reloadConfirm`).

## Critical Gotchas & Constraints

- **Toolbar Icon Requirements (`chrome.action.setIcon`)**:
  - Chrome strictly requires standard square icons (`16`, `32`, `48`, `128`) supplied as a dictionary: `{ "16": "...", "32": "...", "48": "...", "128": "..." }`.
  - Supplying non-square dimensions (like raw rectangular `icon.png`) or a single string path causes Chrome to silently ignore toolbar icon updates.
  - Active color icons: `assets/icons/icon-{16,32,48,128}.png`. Grayscale OFF icons: `assets/icons/icon-{16,32,48,128}-off.png`.
  - Always update UI and toolbar icon optimistically in `src/popup/popup.js` before calling `chrome.storage.local.set`. Re-compiling 26k+ DNR rules in the background worker takes 500ms–1s and blocks popup responsiveness if awaited.
- **Static vs. Dynamic DNR limits in Chrome MV3**:
  - Static DNR limit: 30,000 rules per extension. Current count: ~26,612. Keep additions below 30,000.
  - Dynamic DNR limit: 5,000 rules. **Do not** mirror static rules into dynamic rules; dynamic rules are reserved for active whitelist bypass rules.
  - Rule IDs in `rules.json` must be unique positive integers (`id >= 1`).
- **Subdomain matching direction**:
  - In `src/content/injector.js`: only match `host.endsWith('.' + b)`. **Never** check `b.endsWith('.' + host)` or root domains (`google.com`, `bing.com`) will match subdomain entries like `adservice.google.com` and collapse.
- **Substring collisions & false-positives**:
  - Never do naive `.includes('ads.js')`: matches `downloads.js`, `uploads.js`, `reads.js`, `threads.js`. Use boundary regex `/(^|\/|\?|&)ads\.js($|\?|&|#)/i`.
  - Never do raw substring checks like `.includes('ad.com')`: matches `download.com`, `upload.com`, `read.com`, `broad.com`.
  - Never use unbounded short patterns like `bet`, `s.id`, `click`, `redirect=`, `token=`: breaks `alphabet.com`, `better.com`, `kompas.id`, `clickup.com`, `clickhouse.com`, and OAuth logins. Use word-boundary regexes and host-anchored checks.
- **Cosmetic CSS scoping**:
  - Never use broad generic class/id or layout selectors (`.code-block`, `[class*="-ad-"]`, `[class*="sponsor"]`, `div[style*="min-height: 180px"]`). They break developer docs, syntax highlighters, and legitimate page layouts.
- **Dual-sync requirement**:
  - When blocking new ad networks or tracking domains, update **both** `rules.json` (browser-level network drops) and `src/content/injector.js` (`blockedHosts` / keyword checks for programmatic in-page requests).
- **Image Assets**:
  - Never tamper with original branding assets (`icon.png`, `assets/*.png`) unless explicitly requested.
- **Ignored artifacts**:
  - Chromium cache folder `_metadata/` is in `.gitignore` and must never be committed.

## Validation & Test Commands

Run syntax and rule validation before committing changes:

```bash
# 1. Validate JS syntax across all scripts
node -e "const vm=require('vm'), fs=require('fs'); ['src/background/service-worker.js','src/content/content.js','src/content/injector.js','src/popup/popup.js'].forEach(f => { new vm.Script(fs.readFileSync(f,'utf8'), {filename:f}); console.log(f + ': OK'); });"

# 2. Validate rules.json integrity & uniqueness
node -e "const r=JSON.parse(require('fs').readFileSync('rules.json')); const ids=new Set(); r.forEach(x=>{if(ids.has(x.id))throw new Error('Duplicate ID '+x.id); ids.add(x.id);}); console.log('Valid rules:', r.length);"
```

## Testing & Verification Matrix

- **Browser Verification**:
  - Extension reload: click **Reload** in `chrome://extensions/`.
  - Hard refresh target pages (`Ctrl + Shift + R`).
- **Synthetic benchmarks**:
  - **d3ward / TurtleCute**: `https://adblock.turtlecute.org/` (Cosmetic hiding + script blocking).
  - **AdBlock-Tester**: `https://adblock-tester.com/` (Banner, analytics, context ad suites).
  - **SuperAdblockTest**: `https://superadblocktest.com/` (OEM, tracker, and ad network domains).
  - **CanYouBlockIt**: `https://canyoublockit.com/extreme-test/` (Popups, modals, video prerolls).
- **Real-world edge cases**:
  - Search engines: `https://www.google.com/search?q=shinigami` (Verify zero search drops/hangs).
  - Web apps: `https://clickup.com/`, `https://alphabet.com/` (Verify no false-positive blocking).
  - Toolbar icon: Click popup main switch -> confirm instant grayscale toolbar switch with 0ms UI delay.
  - Streaming & prerolls: `https://animeinweb.com/anime/1280`, `https://tv12.lk21official.cc/`
  - Manga & popunders: `https://www.manhwaindo.my/`, `https://11.shinigami.asia/`
