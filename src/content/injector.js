(function() {
  'use strict';

  // 1. Defuse benchmark globals
  try {
    Object.defineProperty(window, 's_test_ads', { get: () => undefined, set: () => {}, configurable: false });
    Object.defineProperty(window, 's_test_pagead', { get: () => undefined, set: () => {}, configurable: false });
  } catch (_) {}

  // 2. Defuse FluidPlayer / VAST preroll ads & Manga ad triggers
  try {
    Object.defineProperty(window, 'vast_options', { get: () => ({ adList: [] }), set: () => {}, configurable: true });
    Object.defineProperty(window, 'customAdList', { get: () => [], set: () => {}, configurable: true });
    Object.defineProperty(window, 'customOptions', { get: () => ({ vastOptions: { adList: [] } }), set: () => {}, configurable: true });
    sessionStorage.setItem('showAds', '-32767');
    window.AGC_POPUNDER_DISABLE = true;
    window.__agcPopunderLoaded = true;
    localStorage.setItem('popundr1', String(Date.now()));
    localStorage.setItem('adLastClicked', String(Date.now()));
    window.canRunAds = true;
    window.isAdBlockActive = false;
  } catch (_) {}

  // 3. Fast lookup
  let isBlockkuDisabled = false;
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'BLOCKKU_STATE') {
      isBlockkuDisabled = !e.data.blocked;
    }
  });

  function isProtectionDisabled() {
    return isBlockkuDisabled || (document.documentElement && document.documentElement.getAttribute('data-blockku-disabled') === 'true');
  }

  const blockedHosts = new Set(["pl27675316.revenuecpmgate.com","pl27672085.revenuecpmgate.com","trakteer.id/animein","cpmrevenuegate.com","highcpmrevenuenetwork.com","protrafficinspector.com","mamshirt.com","abscloud.org","portalfluently.com","cloudpiko.com","kettledroopingcontinuation.com","revenuecpmgate.com","adtago.s3.amazonaws.com","analyticsengine.s3.amazonaws.com","advice-ads.s3.amazonaws.com","advertising-api-eu.amazon.com","amazon-adsystem.com","aax.amazon-adsystem.com","aan.amazon.com","c.amazon-adsystem.com","fls-na.amazon.com","ir-na.amazon-adsystem.com","rcm-na.amazon-adsystem.com","ws-na.amazon-adsystem.com","pagead2.googlesyndication.com","adservice.google.com","googleadservices.com","pagead2.googleadservices.com","afs.googlesyndication.com","tpc.googlesyndication.com","googletagservices.com","googleads.g.doubleclick.net","googleads4.g.doubleclick.net","ad.doubleclick.net","adclick.g.doubleclick.net","cm.g.doubleclick.net","stats.g.doubleclick.net","static.doubleclick.net","m.doubleclick.net","mediavisor.doubleclick.net","pubads.g.doubleclick.net","securepubads.g.doubleclick.net","pagead.l.doubleclick.net","media.net","static.media.net","contextual.media.net","adservetx.media.net","ads30.adcolony.com","adc3-launch.adcolony.com","events3alt.adcolony.com","wd.adcolony.com","criteo.com","static.criteo.net","bidder.criteo.com","dis.criteo.com","gum.criteo.com","sslwidget.criteo.com","cdn.taboola.com","trc.taboola.com","images.taboola.com","nr.taboola.com","api.taboola.com","log.outbrain.com","widgets.outbrain.com","odb.outbrain.com","mgid.com","cdn.mgid.com","servicer.mgid.com","bat.bing.com","bingads.microsoft.com","ads.microsoft.com","c.bing.com","propellerads.com","propellerclick.com","onclickads.net","applovin.com","d.applovin.com","rt.applovin.com","ms.applovin.com","api.vungle.com","vungle.com","liftoff.io","adnxs.com","ib.adnxs.com","secure.adnxs.com","acdn.adnxs.com","prebid.adnxs.com","sin3-ib.adnxs.com","pubmatic.com","ads.pubmatic.com","image6.pubmatic.com","hbopenbid.pubmatic.com","simage2.pubmatic.com","openx.net","us-ads.openx.net","rtb.openx.net","u.openx.net","oas.openx.net","rubiconproject.com","pixel.rubiconproject.com","fastlane.rubiconproject.com","optimized-by.rubiconproject.com","spotxchange.com","search.spotxchange.com","indexexchange.com","casalemedia.com","as.casalemedia.com","cdn.indexexchange.com","htlbid.com","htlb.casalemedia.com","ads.yahoo.com","analytics.yahoo.com","geo.yahoo.com","udc.yahoo.com","udcm.yahoo.com","advertising.yahoo.com","analytics.query.yahoo.com","partnerads.ysm.yahoo.com","log.fc.yahoo.com","gemini.yahoo.com","adtech.yahooinc.com","auction.unityads.unity3d.com","webview.unityads.unity3d.com","config.unityads.unity3d.com","adserver.unityads.unity3d.com","unityads.unity3d.com","metrika.yandex.ru","adfox.yandex.ru","adfstat.yandex.ru","appmetrica.yandex.ru","extmaps-api.yandex.net","offerwall.yandex.net","mc.yandex.ru","advertising.yandex.ru","live.chartboost.com","init.supersonicads.com","api.fyber.com","inmobi.com","ironsource.mobi","outcome-ssp.supersonicads.com","s.youtube.com","redirector.googlevideo.com","ads.youtube.com","adsrvr.org","insights.adsrvr.org","match.adsrvr.org","smartyads.com","ad.gt","contextweb.com","sharethrough.com","stackadapt.com","stickyadstv.com","ads.stickyadstv.com","eb2.3lift.com","tlx.3lift.com","apex.go.sonobi.com","c.gumgum.com","a.teads.tv","cdn.teads.tv","cdn.kargo.com","sync.kargo.com","d.adroll.com","s.adroll.com","adroll.com","pangleglobal.com","doubleverify.com","cdn.doubleverify.com","tps.doubleverify.com","pixel.adsafeprotected.com","static.adsafeprotected.com","fw.adsafeprotected.com","insightexpressai.com","analytics.google.com","region1.google-analytics.com","click.googleanalytics.com","google-analytics.com","ssl.google-analytics.com","www.google-analytics.com","googletagmanager.com","tagmanager.google.com","www.googletagmanager.com","analytics.adobe.io","omtrdc.net","metrics.adobe.com","clarity.ms","c.clarity.ms","s.clarity.ms","adm.hotjar.com","identify.hotjar.com","insights.hotjar.com","script.hotjar.com","surveys.hotjar.com","careers.hotjar.com","events.hotjar.io","static.hotjar.com","vars.hotjar.com","in.hotjar.com","cdn.mouseflow.com","o2.mouseflow.com","gtm.mouseflow.com","api.mouseflow.com","tools.mouseflow.com","cdn-test.mouseflow.com","claritybt.freshmarketer.com","fwtracks.freshmarketer.com","api.luckyorange.com","realtime.luckyorange.com","cdn.luckyorange.com","w1.luckyorange.com","upload.luckyorange.net","cs.luckyorange.net","settings.luckyorange.net","stats.wp.com","cdn.heapanalytics.com","api.mixpanel.com","api-js.mixpanel.com","decide.mixpanel.com","api.amplitude.com","api2.amplitude.com","cdn.segment.com","api.segment.io","events.segment.io","rs.fullstory.com","edge.fullstory.com","quantserve.com","pixel.quantserve.com","quantcast.com","sb.scorecardresearch.com","b.scorecardresearch.com","static.cloudflareinsights.com","cloudflareinsights.com","app.posthog.com","eu.posthog.com","us.i.posthog.com","rudderstack.com","cdn.rudderlabs.com","snowplowanalytics.com","tracker.snowplowanalytics.com","fingerprintjs.com","fpjs.io","siftscience.com","cdn.siftscience.com","cdn.permutive.com","bluekai.com","tags.bluekai.com","onetag-sys.com","pippio.com","id5-sync.com","sync.mathtag.com","pixel.mathtag.com","crwdcntrl.net","bcp.crwdcntrl.net","bidswitch.net","sync-tm.everesttech.net","prod.uidapi.com","idsync.rlcdn.com","api.rlcdn.com","tags.crwdcntrl.net","ad.crwdcntrl.net","sync.crwdcntrl.net","app.appsflyer.com","appsflyer.com","app.adjust.com","adjust.com","api2.branch.io","bnc.lt","kochava.com","control.kochava.com","sdk-api-v1.singular.net","wzrkt.com","notify.bugsnag.com","sessions.bugsnag.com","api.bugsnag.com","app.bugsnag.com","browser.sentry-cdn.com","app.getsentry.com","ingest.sentry.io","o0.ingest.sentry.io","bam.nr-data.net","bam-cell.nr-data.net","js-agent.newrelic.com","browser-intake-datadoghq.com","rum.browser-intake-datadoghq.com","cdn.lr-ingest.com","r.lr-ingest.com","coinimp.com","www.coinimp.com","webminepool.com","minero.cc","mineralt.io","monerominer.rocks","popads.net","popcash.net","popmyads.com","clickadu.com","trafficjunky.net","exoclick.com","juicyads.com","statdynamic.com","pixel.facebook.com","an.facebook.com","connect.facebook.net","graph.facebook.com","tr.facebook.com","graph.instagram.com","i.instagram.com","sc-static.net","tr.snapchat.com","ads.snapchat.com","sc-analytics.appspot.com","ads.linkedin.com","analytics.pointdrive.linkedin.com","snap.licdn.com","px.ads.linkedin.com","dc.ads.linkedin.com","static.ads-twitter.com","ads-api.twitter.com","ads-api.x.com","analytics.twitter.com","analytics.x.com","ads.x.com","events.reddit.com","events.redditmedia.com","pixel.redditmedia.com","d.reddit.com","ads-api.tiktok.com","analytics.tiktok.com","ads-sg.tiktok.com","analytics-sg.tiktok.com","business-api.tiktok.com","ads.tiktok.com","log.byteoversea.com","mon.byteoversea.com","mcs-va.tiktokv.com","mon.tiktokv.com","ads.pinterest.com","ct.pinterest.com","log.pinterest.com","analytics.pinterest.com","trk.pinterest.com","widgets.pinterest.com","pixel.quora.com","qevents.quora.com","px.srvcs.tumblr.com","ads.vk.com","vk.com","ad.mail.ru","top-fwz1.mail.ru","advertising.apple.com","tr.iadsdk.apple.com","iadsdk.apple.com","metrics.icloud.com","metrics.apple.com","metrics.mzstatic.com","api-adservices.apple.com","books-analytics-events.apple.com","notes-analytics-events.apple.com","xp.apple.com","iot-eu-logser.realme.com","iot-logser.realme.com","bdapi-ads.realmemobile.com","bdapi-in-ads.realmemobile.com","adsfs.oppomobile.com","adx.ads.oppomobile.com","ck.ads.oppomobile.com","data.ads.oppomobile.com","click.oneplus.cn","open.oneplus.net","metrics.data.hicloud.com","metrics2.data.hicloud.com","grs.hicloud.com","logservice.hicloud.com","logservice1.hicloud.com","logbak.hicloud.com","ads.huawei.com","api.ad.xiaomi.com","data.mistat.xiaomi.com","data.mistat.india.xiaomi.com","data.mistat.rus.xiaomi.com","sdkconfig.ad.xiaomi.com","sdkconfig.ad.intl.xiaomi.com","globalapi.ad.xiaomi.com","tracking.rus.miui.com","tracking.miui.com","samsungads.com","smetrics.samsung.com","nmetrics.samsung.com","samsung-com.112.2o7.net","analytics-api.samsunghealthcn.com","config.samsungads.com","adlog.vivo.com","ads-api.vivo.com","a.lenovo.com","us.info.lgsmartad.com","us.ibs.lgappstv.com","ad.lgappstv.com","info.lgsmartad.com","ngfts.lge.com","yumenetworks.com","smartclip.net","smartclip.com","settings-win.data.microsoft.com","vortex.data.microsoft.com","vortex-win.data.microsoft.com","watson.telemetry.microsoft.com","telemetry.microsoft.com","browser.events.data.msn.com","device-metrics-us.amazon.com","device-metrics-us-2.amazon.com","mads-eu.amazon.com","logs.roku.com","ads.roku.com","amoeba.web.roku.com","ads.vizio.com","tvinteractive.tv","tvpixel.com","firebase-settings.crashlytics.com","cdn.cookielaw.org","geolocation.onetrust.com","privacyportal.onetrust.com","consent.cookiebot.com","consentcdn.cookiebot.com","cookiebot.com","consent.trustarc.com","sdk.privacy-center.org","cdn.privacy-mgmt.com","app.usercentrics.eu","cmp.usercentrics.eu","cmp.inmobi.com","sourcepoint.mgr.consensu.org","cmp.osano.com","fundingchoicesmessages.google.com","www.anrdoezrs.net","www.dpbolvw.net","www.tkqlhce.com","shareasale.com","click.linksynergy.com","ad.linksynergy.com","track.linksynergy.com","d.impactradius-event.com","www.awin1.com","zenaps.com","prf.hn","partnerstack.com","api.partnerstack.com","refersion.com","t.pepperjamnetwork.com","s.skimresources.com","t.skimresources.com","go.skimresources.com","redirector.skimresources.com","go.redirectingat.com","redirect.viglink.com","cdn.viglink.com","api.viglink.com","cdn.optimizely.com","logx.optimizely.com","api.optimizely.com","cdn.dynamicyield.com","st.dynamicyield.com","events.launchdarkly.com","clientstream.launchdarkly.com","list-manage.com","track.hubspot.com","munchkin.marketo.net","click.mailchimp.com","widget.intercom.io","js.driftt.com","sdk.iad-01.braze.com","cdn.onesignal.com","api.onesignal.com","static.klaviyo.com","a.klaviyo.com","customer.io","track.customer.io","dai.google.com","g.jwpsrv.com","ssl.p.jwpcdn.com","prd.jwpltx.com","mssl.fwmrm.net","bea4.v.fwmrm.net","2975c.v.fwmrm.net","cd.connatix.com","capi.connatix.com","vid.connatix.com","metrics.brightcove.com","s.innovid.com","tremorhub.com","ads.tremorhub.com","ybs2ffs7v.com","12ezo5v60.com","fvcwqkkqmuv.com","fluidplayer.com","antiadblocksystems.com","kjfhenoqfyfljo.com","pgjlctmswgnwf.com","d3cod80thn7qnd.cloudfront.net","ad.com","bannersnack.com","steadfastsystem.com","taboola.com","outbrain.com","is.com","youtubei.googleapis.com","heapanalytics.com","scorecardresearch.com","api.fpjs.io","permutive.com","thetradedesk.com","tapad.com","singular.net","clevertap-prod.com","jsecoin.com","crypto-loot.org","2giga.link","greatis.com","vk.com/rtrg","weather-analytics-events.apple.com","app-measurement.com","shareasale-analytics.com","impact.com","api.impact.com","api.refersion.com","trackcmp.net","imasdk.googleapis.com"]);

  function isBlockedUrl(rawUrl) {
    if (isProtectionDisabled() || !rawUrl) return false;
    const str = String(rawUrl).toLowerCase();
    
    if (
      str.includes('fakepage.html') ||
      /(^|\/|\?|&)ads\.js($|\?|&|#)/i.test(str) ||
      /(^|\/|\?|&)pagead\.js($|\?|&|#)/i.test(str) ||
      str.includes('adblock_test') ||
      str.includes('revenuecpmgate') ||
      str.includes('cloudpiko') ||
      str.includes('kettledrooping') ||
      str.includes('portalfluently') ||
      str.includes('mamshirt') ||
      str.includes('yellowishgather') ||
      str.includes('seiklasnya.js') ||
      str.includes('invoke.js') ||
      str.includes('app-measurement.com') ||
      str.includes('pr_advertising_ads_banner') ||
      str.includes('sentry-cdn') ||
      str.includes('bugsnag') ||
      str.includes('an.yandex.ru') ||
      str.includes('mc.yandex.ru') ||
      str.includes('ymatuhin.ru') ||
      str.includes('88cdn.cloud') ||
      str.includes('gmbr.pro') ||
      str.includes('linkfast.vip') ||
      str.includes('cek.to') ||
      str.includes('ads.shinigami.io')
    ) {
      return true;
    }

    try {
      const u = new URL(str, window.location.href);
      const host = u.hostname.toLowerCase();
      if (blockedHosts.has(host)) return true;

      for (const b of blockedHosts) {
        if (host.endsWith('.' + b)) return true;
      }
    } catch (_) {}
    return false;
  }

  // 4. Intercept document.createElement
  const origCreateElement = document.createElement;
  document.createElement = function(tagName, ...args) {
    const el = origCreateElement.call(this, tagName, ...args);
    if (isProtectionDisabled()) return el;
    const tag = String(tagName).toLowerCase();

    if (tag === 'script') {
      const origSetAttribute = el.setAttribute;
      el.setAttribute = function(name, val) {
        if (name === 'src' && isBlockedUrl(val)) {
          setTimeout(() => el.dispatchEvent(new Event('error')), 0);
          return;
        }
        return origSetAttribute.call(this, name, val);
      };
      Object.defineProperty(el, 'src', {
        set: function(val) {
          if (isBlockedUrl(val)) {
            setTimeout(() => el.dispatchEvent(new Event('error')), 0);
            return;
          }
          el.setAttribute('src', val);
        },
        get: function() {
          return el.getAttribute('src') || '';
        },
        configurable: true
      });
    }

    if (tag === 'iframe') {
      const origSetAttribute = el.setAttribute;
      el.setAttribute = function(name, val) {
        if (name === 'src' && isBlockedUrl(val)) {
          el.style.display = 'none';
          return;
        }
        return origSetAttribute.call(this, name, val);
      };
    }

    return el;
  };

  // 5. Intercept window.fetch
  const origFetch = window.fetch;
  window.fetch = function(...args) {
    if (isProtectionDisabled()) return origFetch.apply(this, args);
    const target = args[0];
    const url = typeof target === 'string' ? target : (target && target.url) || '';
    const str = String(url).toLowerCase();

    // Kill animeinweb preroll API
    if (str.includes('/data/ads/show')) {
      return Promise.resolve(new Response(JSON.stringify({ ad: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
    }

    if (str.includes('/data/ads/click')) {
      return Promise.resolve(new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
    }

    if (isBlockedUrl(url)) {
      return Promise.reject(new TypeError('Failed to fetch (Blocked by Blockku)'));
    }
    return origFetch.apply(this, args);
  };

  // 6. Intercept XMLHttpRequest
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    if (!isProtectionDisabled()) {
      const str = String(url).toLowerCase();
      if (str.includes('/data/ads/show')) {
        this._blockkuAdShow = true;
      } else if (str.includes('/data/ads/click')) {
        this._blockkuAdClick = true;
      } else if (isBlockedUrl(url)) {
        this._blockkuBlocked = true;
      }
    }
    return origOpen.call(this, method, url, ...rest);
  };

  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function(...args) {
    if (isProtectionDisabled()) return origSend.apply(this, args);
    if (this._blockkuAdShow) {
      setTimeout(() => {
        Object.defineProperty(this, 'status', { value: 200, configurable: true });
        Object.defineProperty(this, 'responseText', { value: JSON.stringify({ ad: null }), configurable: true });
        Object.defineProperty(this, 'response', { value: JSON.stringify({ ad: null }), configurable: true });
        Object.defineProperty(this, 'readyState', { value: 4, configurable: true });
        if (typeof this.onreadystatechange === 'function') this.onreadystatechange();
        if (typeof this.onload === 'function') this.onload();
      }, 0);
      return;
    }

    if (this._blockkuAdClick) {
      setTimeout(() => {
        Object.defineProperty(this, 'status', { value: 200, configurable: true });
        Object.defineProperty(this, 'responseText', { value: JSON.stringify({ ok: true }), configurable: true });
        Object.defineProperty(this, 'readyState', { value: 4, configurable: true });
        if (typeof this.onreadystatechange === 'function') this.onreadystatechange();
        if (typeof this.onload === 'function') this.onload();
      }, 0);
      return;
    }

    if (this._blockkuBlocked) {
      setTimeout(() => {
        if (typeof this.onerror === 'function') {
          this.onerror(new ProgressEvent('error'));
        }
      }, 0);
      return;
    }
    return origSend.apply(this, args);
  };

  // 7. Neutralize HTMLMediaElement if ad video loads
  const origPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function() {
    if (isProtectionDisabled()) return origPlay.apply(this, arguments);
    const src = this.currentSrc || this.src || '';
    if (src.includes('ads') || src.includes('advert') || this.closest && this.closest('.z-50')) {
      this.muted = true;
      this.currentTime = this.duration || 9999;
    }
    return origPlay.apply(this, arguments);
  };

  // 8. Block window.open popunders universally
  const origWinOpen = window.open;
  window.open = function(url, ...rest) {
    if (isProtectionDisabled()) return origWinOpen.apply(this, [url, ...rest]);
    if (!url || url === 'about:blank') return null;

    if (isBlockedUrl(url)) return null;

    try {
      const u = new URL(url, window.location.href);
      if (
        /(\/ads?\/|click|pop|track|affil|bonus|bet|casino|revenue|gate|cloudpiko|portal|kettle|slot|gacor|linkfast|cek\.to)/i.test(u.href) ||
        blockedHosts.has(u.hostname.toLowerCase())
      ) {
        return null;
      }
    } catch (_) {
      if (/(\/ads?\/|click|pop|track|affil|bonus|bet|casino|revenue|gate|cloudpiko|portal|kettle|slot|gacor|linkfast|cek\.to)/i.test(url)) {
        return null;
      }
    }

    return origWinOpen.apply(this, [url, ...rest]);
  };
})();