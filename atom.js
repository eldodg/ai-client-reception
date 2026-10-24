(function () {
  var WEBHOOK = "https://n8n.code4zone.com/webhook/fd64bc88-f35d-4b9d-9574-d38b6693d755/chat";
  var WA = "201111383748";

  var C = {
    ar: { n_pricing: "الأسعار", n_book: "احجز الآن", lang: "English", ask: "اسأل ATOM",
      f_copy: "© 2026 AUTOOM (ATOM) Solutions. جميع الحقوق محفوظة.", f_terms: "الشروط والأحكام", f_wa: "واتساب",
      c_title: "مساعد AUTOOM", c_sub: "نرد عليك على مدار الساعة", c_ph: "اكتب رسالتك هنا...", c_start: "ابدأ المحادثة",
      c_hi: "مرحبًا! أنا مساعد AUTOOM الذكي. كيف أقدر أساعدك؟" },
    en: { n_pricing: "Pricing", n_book: "Book now", lang: "العربية", ask: "Ask ATOM",
      f_copy: "© 2026 AUTOOM (ATOM) Solutions. All rights reserved.", f_terms: "Terms & Conditions", f_wa: "WhatsApp",
      c_title: "AUTOOM Assistant", c_sub: "Available 24/7", c_ph: "Type your message here...", c_start: "Start chat",
      c_hi: "Hello! I am the AUTOOM AI Assistant. How can I help you today?" }
  };

  var cur = "ar";
  try { cur = localStorage.getItem("autoom_lang") || "ar"; } catch (e) {}
  if (!C[cur]) cur = "ar";
  var d = C[cur], chat;

  window.ATOM = { lang: function () { return cur; }, t: function (k) { return d[k] != null ? d[k] : k; }, wa: WA };

  /* nav */
  var page = document.body.dataset.page || "";
  var nav = document.createElement("header");
  nav.className = "nav";
  nav.innerHTML =
    '<a class="logo" href="index.html"><img src="logo1.png" alt="" onerror="this.onerror=null;this.src=\'logo1.png.png\'"><span>ATOM</span></a>' +
    '<nav class="nav-r"><a class="l" data-p="pricing" href="pricing.html" data-i18n="n_pricing"></a>' +
    '<a class="l" data-p="booking" href="booking.html" data-i18n="n_book"></a>' +
    '<button class="l" id="lang" type="button"></button></nav>';
  document.body.prepend(nav);
  var cp = nav.querySelector('[data-p="' + page + '"]');
  if (cp) cp.setAttribute("aria-current", "page");

  /* footer */
  var foot = document.createElement("footer");
  foot.className = "foot";
  foot.innerHTML = '<span data-i18n="f_copy"></span><nav><a href="terms.html" data-i18n="f_terms"></a>' +
    '<a href="https://wa.me/' + WA + '" target="_blank" rel="noopener" data-i18n="f_wa"></a></nav>';
  document.body.appendChild(foot);

  /* launcher */
  var ask = document.createElement("button");
  ask.id = "ask"; ask.type = "button";
  ask.innerHTML = '<i></i><span data-i18n="ask"></span>';
  document.body.appendChild(ask);
  ask.addEventListener("click", function () {
    var t = document.querySelector(".chat-window-toggle");
    if (t) t.click(); else window.open("https://wa.me/" + WA, "_blank", "noopener");
  });

  /* orbit mark */
  document.querySelectorAll("[data-orbit]").forEach(function (el) {
    el.classList.add("has-orbit");
    var s = document.createElement("div");
    s.className = "orbit";
    s.setAttribute("aria-hidden", "true");
    s.innerHTML = '<svg viewBox="-100 -100 200 200"><ellipse rx="92" ry="34"/><ellipse rx="92" ry="34" transform="rotate(60)"/><ellipse rx="92" ry="34" transform="rotate(120)"/><circle r="3"/></svg>';
    el.prepend(s);
  });

  /* chat widget */
  var css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css";
  document.head.appendChild(css);

  function mountChat() {
    import("https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js").then(function (m) {
      try { if (chat) chat.unmount(); } catch (e) {}
      chat = m.createChat({
        webhookUrl: WEBHOOK, mode: "window", showWelcomeScreen: false, loadPreviousSession: false,
        metadata: { pageLang: cur }, defaultLanguage: "en", initialMessages: [d.c_hi],
        i18n: { en: { title: d.c_title, subtitle: d.c_sub, footer: "", getStarted: d.c_start, inputPlaceholder: d.c_ph } }
      });
    }).catch(function (e) { console.warn("chat failed", e); });
  }

  /* i18n */
  function apply(l, remount) {
    cur = l;
    var page_d = (window.I18N || {})[l] || {};
    d = Object.assign({}, C[l], page_d);
    var de = document.documentElement;
    de.lang = l; de.dir = l === "ar" ? "rtl" : "ltr";
    if (d.title) document.title = d.title;
    document.querySelectorAll("[data-i18n]").forEach(function (e) { var v = d[e.dataset.i18n]; if (v != null) e.textContent = v; });
    document.querySelectorAll("[data-i18n-html]").forEach(function (e) { var v = d[e.dataset.i18nHtml]; if (v != null) e.innerHTML = v; });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (e) { var v = d[e.dataset.i18nPh]; if (v != null) e.placeholder = v; });
    document.getElementById("lang").textContent = d.lang;
    ask.setAttribute("aria-label", d.ask);
    try { localStorage.setItem("autoom_lang", l); } catch (e) {}
    if (typeof window.onLang === "function") window.onLang(l);
    if (remount) mountChat();
  }
  document.getElementById("lang").addEventListener("click", function () { apply(cur === "ar" ? "en" : "ar", true); });

  apply(cur, false);
  mountChat();
})();
