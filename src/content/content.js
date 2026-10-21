(function () {
  'use strict';

  // Instant CSS styles injection at document_start
  const style = document.createElement('style');
  style.id = 'blockku-shield-instant';
  style.textContent = `
    #cts_test, #ad_ctd, .textads, .banner-ads, .banner_ads, .ad-unit, .afs_ads, .ad-zone, .ad-space, .adsbox, .adbox, .adbox-wrapper, .adSocial,
    #an-modal, .an-advert-banner, .interstitial-wrapper, [id*="interads"], [class*="interads"],
    [src*="pr_advertising_ads_banner"], [data*="pr_advertising_ads_banner"], div[data-ads], div[id^="yandex_rtb_"],
    .agc-ad-slot, .agc-ad-label, .agc-lazy-ad, #agc-lazy-ads, .klan, .klan-float-bottom, .kln, #kln-block,
    .slotiklan, .slotiklan-topdesktop, .gambar_pemanis, .gulai_asam_manis,
    #teaserbottom, #teaser1, #teaser2, #teaser3, #floatbanner, #floatcenter, #wp-iklan-overlay,
    .floating-ad, .floating-ads, a[href*="cek.to"], a[href*="linkfast.vip"], a[href*="menangjudi"],
    img[src*="gmbr.pro"], img[src*="88cdn.cloud"], img[src*="Bandar36"],
    .banner-ad, .ad-slot, .ad-box, .ad-banner, .ad-container, .advertisement,
    ins.adsbygoogle, [data-ad-slot], [data-ad-client], [data-google-query-id],
    iframe[src*="bannersnack"], iframe[src*="doubleclick"], iframe[src*="ybs2ffs7v"],
    iframe[src*="12ezo5v60"], iframe[src*="fvcwqkkqmuv"],
    div[id^="container-"], div[id*="revenuecpmgate"],
    .fluid_ad_container, .fluid_ad_banner, .fluid_ad_countdown, .fluid_ad_cta {
      display: none !important;
      visibility: hidden !important;
      height: 0px !important;
      max-height: 0px !important;
      width: 0px !important;
      max-width: 0px !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
  `;
  if (document.documentElement) {
    document.documentElement.appendChild(style);
  } else {
    document.addEventListener('DOMContentLoaded', () => document.documentElement.appendChild(style));
  }

  let isBlocked = true;

  function syncProtectionState() {
    chrome.storage.local.get(['enabled', 'whitelistedHosts'], (res) => {
      const enabled = res.enabled !== false;
      const whitelisted = (res.whitelistedHosts || []).includes(window.location.hostname);
      isBlocked = enabled && !whitelisted;

      const docEl = document.documentElement;
      if (!isBlocked) {
        if (style.parentNode) style.remove();
        if (docEl) {
          docEl.classList.add('blockku-disabled');
          docEl.setAttribute('data-blockku-disabled', 'true');
        }
        if (document.body) document.body.classList.add('blockku-disabled');
        window.postMessage({ type: 'BLOCKKU_STATE', blocked: false }, '*');
      } else {
        if (docEl) {
          docEl.classList.remove('blockku-disabled');
          docEl.setAttribute('data-blockku-disabled', 'false');
        }
        if (document.body) document.body.classList.remove('blockku-disabled');
        if (!style.parentNode && (document.head || docEl)) {
          (document.head || docEl).appendChild(style);
        }
        window.postMessage({ type: 'BLOCKKU_STATE', blocked: true }, '*');
        schedulePurge();
      }
    });
  }

  syncProtectionState();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes.enabled !== undefined || changes.whitelistedHosts !== undefined)) {
      syncProtectionState();
    }
  });

  // Helper: check if hostname/path is an ad, gambling, or shortener link
  function isAdHostOrPath(hostname, pathname, fullHref) {
    const host = (hostname || '').toLowerCase();
    const full = ((hostname || '') + (pathname || '')).toLowerCase();
    const href = (fullHref || '').toLowerCase();

    // Exact or subdomain matches for known shorteners & ad networks
    if (
      host === 's.id' || host.endsWith('.s.id') ||
      host === 'bit.ly' || host.endsWith('.bit.ly') ||
      host === 'tinyurl.com' || host.endsWith('.tinyurl.com') ||
      host === 'rebrand.ly' || host.endsWith('.rebrand.ly') ||
      host === 'linkfast.vip' || host.endsWith('.linkfast.vip') ||
      host === 'cek.to' || host.endsWith('.cek.to') ||
      host === 'heylink.me' || host.endsWith('.heylink.me') ||
      host === '88cdn.cloud' || host.endsWith('.88cdn.cloud') ||
      host === 'gmbr.pro' || host.endsWith('.gmbr.pro') ||
      host.includes('revenuecpmgate') ||
      host.includes('cloudpiko') ||
      host.includes('kettledrooping') ||
      host.includes('portalfluently')
    ) {
      return true;
    }

    // Word-bounded gambling keywords (e.g. slot88, bandar36, judi-online, gacor777, bet365)
    if (/(^|[._\/-])(judi|gacor[0-9]*|casino|bandar[0-9]*|slot[0-9]*|[0-9]+slot|bet[0-9]{2,}|[0-9]{2,}bet)([._\/-]|$)/i.test(full)) {
      return true;
    }

    return false;
  }

  // Helper: check if element is a full-screen or massive click trap overlay
  function isClickTrapElement(el) {
    if (!el || el === document.body || el === document.documentElement) return false;

    // Check tag and attributes
    const tag = el.tagName.toLowerCase();
    const href = (tag === 'a' ? (el.getAttribute('href') || '') : '') || (el.getAttribute('data-href') || '');

    // Links to blank, external ad patterns, or hash-only links with massive overlay
    const style = window.getComputedStyle(el);
    const isOverlayPos = style.position === 'absolute' || style.position === 'fixed';
    const zIndex = parseInt(style.zIndex, 10);
    const hasHighZIndex = !isNaN(zIndex) && zIndex >= 10;

    if (isOverlayPos && hasHighZIndex) {
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth || document.documentElement.clientWidth;
      const vh = window.innerHeight || document.documentElement.clientHeight;

      // Covers > 50% of viewport
      if (rect.width * rect.height > (vw * vh * 0.45)) {
        return true;
      }
    }

    // Transparent or deceptive click trap anchor
    if (tag === 'a' && isOverlayPos) {
      if (style.opacity === '0' || style.visibility === 'hidden') {
        return true;
      }
      try {
        const u = new URL(href, window.location.href);
        if (u.hostname !== window.location.hostname && isAdHostOrPath(u.hostname, u.pathname, href)) {
          return true;
        }
      } catch (_) {}
    }

    return false;
  }

  // Heuristic 1: Capture & neutralize trap clicks at top level
  function interceptTrapEvent(e) {
    if (!isBlocked) return;

    // Untrusted programmatic trigger of open / click
    if (!e.isTrusted) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return;
    }

    let t = e.target;
    while (t && t !== document) {
      // 1. Tag A click trap
      if (t.tagName === 'A') {
        const href = t.getAttribute('href') || '';
        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
          try {
            const u = new URL(href, window.location.href);
            if (u.hostname !== window.location.hostname && isAdHostOrPath(u.hostname, u.pathname, href)) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              t.remove();
              return;
            }
          } catch (_) {}
        }

        // Overlay trap link over video or body
        if (isClickTrapElement(t)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          t.remove();
          return;
        }
      }

      // 2. Element itself is a full-screen transparent or message overlay
      if (isClickTrapElement(t)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        t.remove();
        return;
      }

      t = t.parentNode;
    }
  }

  window.addEventListener('click', interceptTrapEvent, true);
  window.addEventListener('auxclick', interceptTrapEvent, true);

  // Heuristic 2: Neutralize video overlays & fake banners
  function purgeDOM() {
    if (!isBlocked) return;

    // 1. Hide bait & Indonesian manga/streaming ad containers
    const bait = document.querySelectorAll(
      '#cts_test, #ad_ctd, .textads, .banner-ads, .banner_ads, .ad-unit, .afs_ads, .ad-zone, .ad-space, .adsbox, .adbox, .adbox-wrapper, .adSocial, ' +
      'div[id^="container-"], [src*="pr_advertising_ads_banner"], [data*="pr_advertising_ads_banner"], div[data-ads], div[id^="yandex_rtb_"], ' +
      '.agc-ad-slot, .agc-ad-label, .agc-lazy-ad, #agc-lazy-ads, .klan, .klan-float-bottom, .kln, #kln-block, .slotiklan, .slotiklan-topdesktop, ' +
      '.gambar_pemanis, .gulai_asam_manis, #teaserbottom, #teaser1, #teaser2, #teaser3, #floatbanner, #floatcenter, #wp-iklan-overlay, ' +
      '.floating-ad, .floating-ads, a[href*="cek.to"], a[href*="linkfast.vip"], a[href*="menangjudi"], ' +
      'img[src*="gmbr.pro"], img[src*="88cdn.cloud"], img[src*="Bandar36"]'
    );
    bait.forEach(el => {
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('height', '0px', 'important');
      el.style.setProperty('width', '0px', 'important');
    });

    // 2. Remove known modal overlays and interstitials
    document.querySelectorAll('#an-modal, .interstitial-wrapper, [id*="interads"], [class*="interads"]').forEach(el => el.remove());
    document.querySelectorAll('.fluid_ad_container, .fluid_ad_banner').forEach(el => el.remove());
    document.querySelectorAll('.agc-ad-slot, .klan, .klan-float-bottom, .kln, #kln-block, .gambar_pemanis, .gulai_asam_manis, a[href*="cek.to"], a[href*="linkfast.vip"], a[href*="menangjudi"]').forEach(el => el.remove());

    // 3. Universal heuristic scan for video overlays
    const videos = document.querySelectorAll('video, iframe[src*="embed"], iframe[src*="iframe"], iframe[src*="player"], iframe[id*="video"]');
    videos.forEach(v => {
      try {
        const vRect = v.getBoundingClientRect();
        if (vRect.width < 50 || vRect.height < 50) return;

        // Check siblings or parent children positioned over the video
        const parent = v.parentElement;
        if (!parent) return;

        const siblings = parent.querySelectorAll('a, div');
        siblings.forEach(s => {
          if (s === v || s.contains(v)) return;
          const sStyle = window.getComputedStyle(s);
          if (sStyle.position === 'absolute' || sStyle.position === 'fixed') {
            const z = parseInt(sStyle.zIndex, 10);
            if (!isNaN(z) && z > 1) {
              const sRect = s.getBoundingClientRect();
              // Check if overlapping significantly with the video player
              const overlapW = Math.max(0, Math.min(vRect.right, sRect.right) - Math.max(vRect.left, sRect.left));
              const overlapH = Math.max(0, Math.min(vRect.bottom, sRect.bottom) - Math.max(vRect.top, sRect.top));
              const overlapArea = overlapW * overlapH;
              const videoArea = vRect.width * vRect.height;

              if (overlapArea > videoArea * 0.4) {
                // If contains link, ad text, or warning
                const text = (s.textContent || '').toLowerCase();
                const hasAdText = /iklan|ads?|klik|click|play movie|warning|sponsor|start movie/i.test(text);
                const isAnchor = s.tagName === 'A' || s.querySelector('a');

                if (hasAdText || isAnchor || sStyle.opacity === '0' || sStyle.visibility === 'hidden') {
                  s.style.setProperty('display', 'none', 'important');
                  s.style.setProperty('pointer-events', 'none', 'important');
                  try { s.remove(); } catch (_) {}
                }
              }
            }
          }
        });
      } catch (_) {}
    });

    // 4. Universal heuristic scan for direct affiliate/gambling image banners
    const candidateLinks = document.querySelectorAll('a[href]:has(img, picture)');
    candidateLinks.forEach(a => {
      try {
        const href = a.getAttribute('href') || '';
        if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
        const u = new URL(href, window.location.href);

        // Must be cross-origin
        if (u.hostname === window.location.hostname || u.hostname.endsWith('.' + window.location.hostname)) return;

        // Check for affiliate indicators:
        // A) Known ad/redirect shorteners or gambling hosts
        const isAdDomain = isAdHostOrPath(u.hostname, u.pathname, href);

        // B) Image source or alt text has gambling/ad patterns
        const img = a.querySelector('img, source');
        const imgAttr = img ? ((img.getAttribute('src') || '') + ' ' + (img.getAttribute('srcset') || '') + ' ' + (img.getAttribute('alt') || '')) : '';
        const hasAdImgAttr = /(slot[0-9]*|judi|gacor|bandar|casino|banner|iklan|advert|promo|bonus|jackpot|777|365|728x90|300x250|720x180)/i.test(imgAttr);

        // C) Banner geometry check (aspect ratio matching standard banners)
        let isBannerRatio = false;
        const rect = a.getBoundingClientRect();
        if (rect.width > 120 && rect.height > 30) {
          const ratio = rect.width / rect.height;
          // Wide banner (e.g. 728x90 = 8.1, 720x180 = 4.0, 468x60 = 7.8) or standard box (300x250 = 1.2)
          if ((ratio >= 2.8 && ratio <= 12.0) || (ratio >= 0.85 && ratio <= 1.4 && rect.width >= 180)) {
            isBannerRatio = true;
          }
        }

        const aStyle = window.getComputedStyle(a);
        const isFloating = aStyle.position === 'fixed' || aStyle.position === 'sticky' || a.closest('.fixed, .sticky, [style*="position: fixed"]');

        const isAdBanner = (isAdDomain || hasAdImgAttr) && (isBannerRatio || isFloating || a.getAttribute('target') === '_blank');

        if (isAdBanner) {
          a.style.setProperty('display', 'none', 'important');
          a.style.setProperty('pointer-events', 'none', 'important');
          const p = a.parentElement;
          if (p && p !== document.body && (p.children.length === 1 || /(ad|slot|banner|klan|promo)/i.test(p.className + ' ' + p.id))) {
            p.style.setProperty('display', 'none', 'important');
            p.remove();
          } else {
            a.remove();
          }
        }
      } catch (_) {}
    });

    // 5. Video ad skip buttons
    const skipBtn = Array.from(document.querySelectorAll('button, a')).find(b => {
      const txt = (b.textContent || '').toLowerCase();
      return txt.includes('skip ad') || txt.includes('lewatin') || (txt.includes('skip') && !txt.includes('intro'));
    });
    if (skipBtn) {
      skipBtn.removeAttribute('disabled');
      skipBtn.click();
    }

    // 6. YouTube player ads
    if (location.hostname.includes('youtube.com')) {
      const skip = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button');
      if (skip) skip.click();

      const ad = document.querySelector('.ad-showing, .ad-interrupting');
      const v = document.querySelector('video');
      if (ad && v && !isNaN(v.duration)) {
        v.muted = true;
        v.playbackRate = 16.0;
        v.currentTime = v.duration;
      }
    }
  }

  let purgeScheduled = false;
  function schedulePurge() {
    if (purgeScheduled || !isBlocked) return;
    purgeScheduled = true;
    requestAnimationFrame(() => {
      purgeScheduled = false;
      purgeDOM();
    });
  }

  schedulePurge();
  const observer = new MutationObserver(schedulePurge);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
