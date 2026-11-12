// BillKind — interactive demo. Vanilla JS, no build step.
// State lives in localStorage; nothing is sent anywhere except the waitlist and contact forms.
(() => {
  "use strict";
  const { RATES, REQUESTS, DONORS } = window.BK_DATA;
  const I18N = window.BK_I18N;
  const KEY = "billkind:v1";
  const ROUTES = ["welcome", "path", "discover", "leaderboard", "giving", "ask", "profile"];
  const TABS = [
    ["discover", "tDiscover", "search"],
    ["leaderboard", "tBoard", "trophy"],
    ["giving", "tGiving", "gift"],
    ["ask", "tAsk", "hand"],
    ["profile", "tProfile", "user"],
  ];
  const CATS = ["electricity", "gas", "water", "phone", "rent", "health", "medical", "home", "other"];
  const CAT_ICON = { electricity: "bolt", gas: "flame", water: "drop", phone: "phone", rent: "key", health: "shield", medical: "pulse", home: "home", other: "heart" };
  const CAT_HUE = { electricity: 42, gas: 18, water: 195, phone: 262, rent: 150, health: 340, medical: 350, home: 125, other: 30 };
  const STORY_CHIPS = [10, 25, 50, 100];

  // ---------- state ----------
  const defaults = () => ({
    lang: (navigator.language || "it").toLowerCase().startsWith("it") ? "it" : "en",
    seen: false,
    filter: "all",
    basket: [], // [{id, amount}]
    gifts: [], // [{id, amount, cur, date}]
    skipped: [],
    history: [], // [{type: "skip"|"add", id}]
    period: "month",
    profile: { mode: "anon", name: "", city: "", bio: "", story: "" },
    request: null,
  });
  let S = defaults();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && typeof saved === "object") S = { ...S, ...saved, profile: { ...S.profile, ...(saved.profile || {}) } };
  } catch { /* storage unavailable: run in memory */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* ignore */ } };

  let M = null; // open modal: {type, ...}
  const app = document.getElementById("app");
  const toastEl = document.createElement("div");
  toastEl.className = "toast";
  toastEl.setAttribute("role", "status");
  document.body.appendChild(toastEl);
  let toastTimer;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2600);
  };

  // ---------- helpers ----------
  const t = (k) => I18N[S.lang][k] ?? I18N.it[k] ?? k;
  const L = (o) => (o ? o[S.lang] ?? o.it ?? "" : "");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const locale = () => (S.lang === "it" ? "it-IT" : "en-GB");
  const money = (n, cur) => new Intl.NumberFormat(locale(), { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);
  const toEur = (n, cur) => n * (RATES[cur] || 1);
  const fmtDate = (iso) => new Intl.DateTimeFormat(locale(), { day: "numeric", month: "short" }).format(new Date(iso));
  const route = () => {
    const h = location.hash.slice(1);
    if (ROUTES.includes(h)) return h;
    return S.seen ? "discover" : "welcome";
  };
  const go = (r) => { if (location.hash.slice(1) === r) render(); else location.hash = r; };

  const ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.800-3.800"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.500 20h7M10 17h4"/>',
    gift: '<rect x="4" y="9" width="16" height="11" rx="1.500"/><path d="M3 9h18M12 9v11M12 9S10.500 4 8 4.500 7 9 12 9zM12 9s1.500-5 4-4.500S17 9 12 9z"/>',
    hand: '<path d="M4 14.500 8 12l5 1.500h3.500a1.500 1.500 0 0 1 0 3H12"/><path d="m4 19 3-1.500 6 1.500 7-3.500a1.600 1.600 0 0 0-1.500-2.800L16.500 14"/><path d="M12 8.500s-3-1.800-3-4a1.700 1.700 0 0 1 3-1 1.700 1.700 0 0 1 3 1c0 2.200-3 4-3 4z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.500 20a7.500 7.500 0 0 1 15 0"/>',
    bolt: '<path d="M13 3 5 13.500h6L10.500 21 19 10.500h-6L13 3z"/>',
    flame: '<path d="M12 21a6 6 0 0 1-6-6c0-3 2-4.500 3-7 .500 2 1.500 3 2.500 3.500C11 8 12 5 14 3c0 3.500 4 6 4 12a6 6 0 0 1-6 6z"/>',
    drop: '<path d="M12 3s6.500 6.500 6.500 11.500a6.500 6.500 0 0 1-13 0C5.500 9.500 12 3 12 3z"/>',
    phone: '<rect x="7" y="2.500" width="10" height="19" rx="2.500"/><path d="M11 18h2"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8.500-8.500M16 7l3 3M14 9l2 2"/>',
    shield: '<path d="M12 3 5 6v5.500c0 4.500 3 8 7 9.500 4-1.500 7-5 7-9.500V6l-7-3z"/><path d="M12 9v5M9.500 11.500h5"/>',
    pulse: '<path d="M12 20.500S3.500 15.500 3.500 9.300A4.500 4.500 0 0 1 12 7a4.500 4.500 0 0 1 8.500 2.300c0 6.200-8.500 11.200-8.500 11.200z"/><path d="M6.500 12.500h3l1.500-2.500 2 4.500 1.500-2h3"/>',
    home: '<path d="m3.500 11 8.500-7 8.500 7"/><path d="M5.500 9.500V20h13V9.500M10 20v-5.500h4V20"/>',
    heart: '<path d="M12 20.500S3.500 15.500 3.500 9.300A4.500 4.500 0 0 1 12 7a4.500 4.500 0 0 1 8.500 2.300c0 6.200-8.500 11.200-8.500 11.200z"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    right: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    left: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    check: '<path d="m5 12.500 4.500 4.500L19 7.500"/>',
    undo: '<path d="M4 9h10a5 5 0 0 1 0 10H9"/><path d="M8 5 4 9l4 4"/>',
    eyeoff: '<path d="M3 3l18 18M10.500 6.200A9.500 9.500 0 0 1 12 6c5 0 8.500 4 9.500 6a13 13 0 0 1-2.800 3.600M6.300 7.800A13 13 0 0 0 2.500 12c1 2 4.500 6 9.500 6a9 9 0 0 0 3.500-.700"/><path d="M9.900 9.900a3 3 0 0 0 4.200 4.200"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.500 7 8.500 6.500L20.500 7"/>',
    upload: '<path d="M12 16V5M7.500 9.500 12 5l4.500 4.500M5 19h14"/>',
    star: '<path d="m12 3.500 2.600 5.400 5.900.800-4.300 4.100 1 5.900L12 16.900l-5.200 2.800 1-5.900L3.500 9.700l5.900-.800L12 3.500z"/>',
    building: '<rect x="5" y="3.500" width="14" height="17" rx="1.500"/><path d="M9 8h1.500M13.500 8H15M9 12h1.500M13.500 12H15M10.500 20.500v-4h3v4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.500M12 7.500v.500"/>',
  };
  const ic = (name, size = 20) =>
    `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;

  const FLAGS = {
    it: '<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="10" height="20" fill="#1F8A4C"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#D2342D"/></svg>',
    en: '<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#1F3F8F"/><path d="M0 0l30 20M30 0 0 20" stroke="#fff" stroke-width="4"/><path d="M0 0l30 20M30 0 0 20" stroke="#D2342D" stroke-width="1.600"/><path d="M15 0v20M0 10h30" stroke="#fff" stroke-width="6.500"/><path d="M15 0v20M0 10h30" stroke="#D2342D" stroke-width="3.600"/></svg>',
  };

  const LOGO =
    '<svg class="logo-mark" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="16" fill="#0F5257"/><path d="M19 12h19l9 9v29l-4.500-3-4.500 3-4.500-3-4.500 3-4.500-3-5 3V12z" fill="#FBF6EC"/><path d="M38 12v9h9z" fill="#C9DCD2"/><path d="M33 41.500s-8.500-5.200-8.500-11.100c0-2.900 2.200-4.900 4.700-4.900 1.600 0 3 .800 3.800 2.100.800-1.300 2.200-2.100 3.800-2.100 2.500 0 4.700 2 4.700 4.900 0 5.900-8.500 11.100-8.500 11.100z" fill="#D9703E"/></svg>';

  // ---------- domain ----------
  const myRequest = () => {
    const q = S.request;
    if (!q) return null;
    const p = S.profile;
    const full = q.vis === "full" && p.mode === "full" && p.name.trim();
    return {
      id: "me", mine: true, type: q.type, cat: q.cat, cur: q.cur,
      amount: q.amount, goal: q.amount, raised: 0,
      city: p.city.trim() || "—", anon: !full, name: p.name.trim(), hue: 172, since: 2026,
      short: { it: q.short, en: q.short }, bio: { it: p.bio, en: p.bio }, story: { it: p.story, en: p.story },
    };
  };
  const getReq = (id) => (id === "me" ? myRequest() : REQUESTS.find((r) => r.id === id));
  const inBasket = (id) => S.basket.some((b) => b.id === id);
  const gifted = (id) => S.gifts.some((g) => g.id === id);
  const deck = () =>
    REQUESTS.filter((r) => (S.filter === "all" ? true : S.filter === "bills" ? r.type === "bill" : r.type === "story"))
      .filter((r) => !inBasket(r.id) && !gifted(r.id) && !S.skipped.includes(r.id));
  const need = (r) => (r.type === "bill" ? r.amount : r.goal);
  const basketTotalEur = () => S.basket.reduce((s, b) => s + toEur(b.amount, getReq(b.id).cur), 0);
  const giftsTotalEur = () => S.gifts.reduce((s, g) => s + toEur(g.amount, g.cur), 0);
  const displayName = (r) => (r.anon ? t("anonName") : r.name);
  const board = (period) => {
    const rows = DONORS.map((d) => ({ ...d, value: d[period] }));
    const mine = Math.round(giftsTotalEur());
    if (mine > 0) rows.push({ id: "you", you: true, value: mine, gifts: S.gifts.length });
    rows.sort((a, b) => b.value - a.value);
    return rows;
  };

  function addToBasket(id, amount) {
    const r = getReq(id);
    if (!r || r.mine || inBasket(id) || gifted(id)) return;
    S.basket.push({ id, amount: amount || (r.type === "bill" ? r.amount : 25) });
    S.history.push({ type: "add", id });
    save();
    toast(`${displayName(r)} · ${t("add")} ✓`);
  }

  // ---------- pieces ----------
  const initials = (name) => name.split(/\s+/).filter((w) => /^\p{L}/u.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  function avatar(p, size = 44, kind) {
    if (p.anon) return `<span class="avatar anon" style="--s:${size}px">${ic(kind === "company" ? "building" : "eyeoff", Math.round(size * 0.46))}</span>`;
    return `<span class="avatar" style="--s:${size}px;--h:${p.hue ?? 172}">${esc(initials(p.name || "?"))}</span>`;
  }
  const art = (cat) =>
    `<div class="art" style="--h:${CAT_HUE[cat] ?? 30}"><span class="art-sun"></span><span class="art-hill"></span><span class="art-icon">${ic(CAT_ICON[cat] || "heart", 64)}</span></div>`;
  const catLabel = (r) => `${t(r.type === "bill" ? "bill" : "story")} · ${t("c_" + r.cat)}`;
  const progress = (r) => {
    const pct = Math.min(100, Math.round((r.raised / r.goal) * 100));
    return `<div class="progress" role="img" aria-label="${pct}%"><span style="width:${pct}%"></span></div>
      <p class="progress-label"><strong>${money(r.raised, r.cur)}</strong> ${t("raisedOf")} ${money(r.goal, r.cur)}</p>`;
  };

  function reqCard(r, opts = {}) {
    return `<article class="card req-card ${opts.deck ? "deck-card" : ""}" data-id="${r.id}">
      <div class="req-art">${art(r.cat)}<span class="pill pill-cat">${ic(CAT_ICON[r.cat] || "heart", 14)} ${catLabel(r)}</span></div>
      <div class="req-body">
        ${opts.status ? `<span class="pill pill-soft">${ic("shield", 13)} ${opts.status}</span>` : ""}
        <button class="who" data-action="person" data-arg="${r.id}">
          ${avatar(r, 44)}
          <span class="who-text"><strong>${esc(displayName(r))}</strong><small>${esc(r.city)}${r.country ? " · " + r.country : ""}</small></span>
        </button>
        <p class="amount">${money(need(r), r.cur)}</p>
        ${r.type === "story" ? progress(r) : ""}
        <p class="short">${esc(L(r.short))}</p>
        <button class="link" data-action="person" data-arg="${r.id}">${t("seeProfile")} ${ic("chev", 16)}</button>
        ${opts.deck ? `<div class="deck-actions">
          <button class="ghost" data-action="skip">${ic("left", 18)} ${t("skip")}</button>
          <button class="ghost strong" data-action="add">${t("add")} ${ic("right", 18)}</button>
        </div>` : ""}
      </div>
    </article>`;
  }

  // ---------- screens ----------
  const screens = {
    welcome: () => `
      <section class="card hero">
        <div class="hero-art" aria-hidden="true">
          <span class="h-sun"></span><span class="h-hill"></span>
          <svg viewBox="0 0 200 150" class="h-scene">
            <path d="M52 132V78l34-26 34 26v54z" fill="#FFFDF8"/><path d="M46 80l40-31 40 31" fill="none" stroke="#0F5257" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="76" y="98" width="20" height="34" rx="3" fill="#0F5257"/><rect x="62" y="84" width="14" height="12" rx="2" fill="#F2B441"/><rect x="96" y="84" width="14" height="12" rx="2" fill="#F2B441"/>
            <g transform="rotate(9 150 80)"><path d="M126 42h36l10 10v62l-6-4-6 4-6-4-6 4-6-4-6 4-10-4z" fill="#FFFDF8" stroke="#0F5257" stroke-width="3" stroke-linejoin="round"/>
            <path d="M149 96s-12-7.300-12-15.500a6.400 6.400 0 0 1 12-3.200 6.400 6.400 0 0 1 12 3.200C161 88.700 149 96 149 96z" fill="#D9703E"/><path d="M135 58h20M135 66h12" stroke="#C9DCD2" stroke-width="3.500" stroke-linecap="round"/></g>
          </svg>
        </div>
        <div class="hero-copy">
          <h1>${t("wTitle")}</h1>
          <p>${t("wText")}</p>
          <button class="btn primary full" data-action="go" data-arg="path">${t("wCta")} ${ic("right")}</button>
        </div>
      </section>
      <ol class="how">
        <li><span>${ic("upload", 18)}</span>${t("wHow1")}</li>
        <li><span>${ic("shield", 18)}</span>${t("wHow2")}</li>
        <li><span>${ic("heart", 18)}</span>${t("wHow3")}</li>
      </ol>
      <p class="foot-line">${t("wFoot")}</p>`,

    path: () => `
      <button class="back" data-action="go" data-arg="welcome" aria-label="${t("back")}">${ic("left")}</button>
      <section class="card hero">
        <div class="hero-copy">
          <h1>${t("pTitle")}</h1>
          <p>${t("pText")}</p>
          <button class="choice" data-action="choose" data-arg="give"><span class="choice-ic">${ic("heart", 22)}</span><span><strong>${t("pGive")}</strong><small>${t("pGiveSub")}</small></span>${ic("chev", 18)}</button>
          <button class="choice alt" data-action="choose" data-arg="get"><span class="choice-ic">${ic("hand", 22)}</span><span><strong>${t("pGet")}</strong><small>${t("pGetSub")}</small></span>${ic("chev", 18)}</button>
        </div>
      </section>
      <p class="foot-line">${t("wFoot")}</p>`,

    discover: () => {
      const d = deck();
      const top = d[0];
      const filters = [["all", "fAll"], ["bills", "fBills"], ["stories", "fStories"]]
        .map(([f, k]) => `<button class="chip ${S.filter === f ? "on" : ""}" data-action="filter" data-arg="${f}" aria-pressed="${S.filter === f}">${t(k)}</button>`).join("");
      return `
        <div class="screen-head"><h1>${t("dTitle")}</h1>
          <button class="round" data-action="undo" aria-label="${t("undo")}" ${S.history.length ? "" : "disabled"}>${ic("undo", 18)}</button></div>
        <div class="chips">${filters}</div>
        ${top ? `<div class="deck">${d[1] ? '<div class="deck-shadow"></div>' : ""}${reqCard(top, { deck: true })}</div>
          <p class="hint">${t("swipeHint")}</p>`
          : `<section class="card empty"><span class="empty-ic">${ic("check", 26)}</span><h2>${t("emptyTitle")}</h2><p>${t("emptyText")}</p>
             <button class="btn outline" data-action="restart">${t("restart")}</button></section>`}
        <p class="hint">${t("noCharge")}</p>`;
    },

    leaderboard: () => {
      const rows = board(S.period);
      const tabs = [["month", "perMonth"], ["year", "perYear"], ["all", "perAll"]]
        .map(([p, k]) => `<button class="seg ${S.period === p ? "on" : ""}" data-action="period" data-arg="${p}" aria-pressed="${S.period === p}">${t(k)}</button>`).join("");
      const row = (d, i) => {
        if (d.you) {
          const p = S.profile;
          const anon = p.mode !== "full" || !p.name.trim();
          return `<li><button class="lb-row you" data-action="go" data-arg="profile"><span class="rank r${i + 1}">${i + 1}</span>
            ${avatar({ anon, name: p.name, hue: 172 }, 40)}
            <span class="lb-name"><strong>${anon ? t("youAnon") : esc(p.name) + " · " + t("you")}</strong><small>${d.gifts} ${t("gifts")}</small></span>
            <span class="lb-amt">${money(d.value, "EUR")}</span></button></li>`;
        }
        const name = d.anon ? t(d.kind === "company" ? "anonDonorCo" : "anonDonor") : d.name;
        const badge = !d.anon && d.kind !== "person" ? `<span class="pill pill-kind">${ic(d.kind === "creator" ? "star" : "building", 12)} ${t(d.kind === "creator" ? "kCreator" : "kCompany")}</span>` : "";
        return `<li><button class="lb-row" data-action="donor" data-arg="${d.id}"><span class="rank r${i + 1}">${i + 1}</span>
          ${avatar(d, 40, d.kind)}
          <span class="lb-name"><strong>${esc(name)}</strong><small>${badge || (d.anon ? "" : esc(d.city) + " · ")}${d.gifts} ${t("gifts")}</small></span>
          <span class="lb-amt">${money(d.value, "EUR")}</span></button></li>`;
      };
      const hasYou = rows.some((r) => r.you);
      return `
        <p class="kicker">${t("lKicker")}</p>
        <div class="screen-head"><h1>${t("lTitle")}</h1><span class="head-ic">${ic("trophy", 22)}</span></div>
        <p class="lede">${t("lText")}</p>
        <div class="segs" role="group">${tabs}</div>
        <ol class="card lb">${rows.map(row).join("")}</ol>
        ${hasYou ? "" : `<button class="you-zero" data-action="go" data-arg="discover">${ic("heart", 18)} ${t("youZero")} ${ic("chev", 16)}</button>`}
        <p class="hint">${t("lNote")}</p>`;
    },

    giving: () => {
      const total = Math.round(giftsTotalEur());
      const list = S.gifts.slice().reverse().map((g) => {
        const r = getReq(g.id);
        if (!r) return "";
        return `<li class="card gift"><div class="gift-top"><span>${ic("check", 14)} ${t("gDone")}</span><span>${fmtDate(g.date)}</span></div>
          <button class="gift-main" data-action="person" data-arg="${r.id}">${avatar(r, 44)}
            <span class="who-text"><strong>${esc(displayName(r))}</strong><small>${catLabel(r)}</small></span>
            <strong class="gift-amt">${money(g.amount, g.cur)}</strong></button>
          <p class="fine">${t("gSim")}</p></li>`;
      }).join("");
      return `
        <p class="kicker">${t("gKicker")}</p>
        <div class="screen-head"><h1>${t("gTitle")}</h1><span class="head-ic">${ic("gift", 22)}</span></div>
        <section class="impact"><small>${t("gImpact")}</small><p class="amount">${money(total, "EUR")}</p>
          <span>${S.gifts.length ? `${t("gAcross")} ${S.gifts.length} ${t("gifts")}` : t("gNone")}</span></section>
        ${S.gifts.length ? `<ul class="plain">${list}</ul>` : `<button class="btn primary full" data-action="go" data-arg="discover">${t("gStart")} ${ic("right")}</button>`}
        <button class="btn outline full" data-action="open" data-arg="waitlist">${t("thNotify")} ${ic("mail", 18)}</button>`;
    },

    ask: () => {
      const q = myRequest();
      const steps = ["aS1", "aS2", "aS3", "aS4"].map((k, i) => `<li><span>${i + 1}</span>${t(k)}</li>`).join("");
      if (q) {
        const wantsFull = S.request.vis === "full" && q.anon;
        return `
          <p class="kicker">${t("aKicker")}</p>
          <div class="screen-head"><h1>${t("aTitle")}</h1></div>
          <p class="lede">${t("aPreview")}</p>
          ${reqCard(q, { status: t("aStatus") })}
          ${wantsFull ? `<div class="notice">${ic("info", 18)}<span>${t("aNeedProfile")} <button class="link inline" data-action="go" data-arg="profile">${t("aGoProfile")}</button></span></div>` : ""}
          <section class="card pad"><h2>${t("aSteps")}</h2><ol class="steps">${steps}</ol></section>
          <button class="btn outline full" data-action="ask-remove">${t("aRemove")}</button>`;
      }
      const opt = (v, label, sel) => `<option value="${v}" ${sel ? "selected" : ""}>${label}</option>`;
      return `
        <p class="kicker">${t("aKicker")}</p>
        <div class="screen-head"><h1>${t("aTitle")}</h1><span class="head-ic">${ic("hand", 22)}</span></div>
        <p class="lede">${t("aText")}</p>
        <form class="card pad form" data-form="ask" novalidate>
          <fieldset><legend>${t("aType")}</legend><div class="radio-row">
            <label class="radio"><input type="radio" name="type" value="bill" checked><span>${ic("bolt", 18)} ${t("aBill")}</span></label>
            <label class="radio"><input type="radio" name="type" value="story"><span>${ic("pulse", 18)} ${t("aStory")}</span></label></div></fieldset>
          <label>${t("aCat")}<select name="cat">${CATS.map((c, i) => opt(c, t("c_" + c), i === 0)).join("")}</select></label>
          <div class="row2"><label>${t("aAmount")}<input name="amount" type="number" inputmode="numeric" min="1" max="20000" placeholder="120" required></label>
            <label>&nbsp;<select name="cur" aria-label="Currency">${["EUR", "CHF", "GBP"].map((c, i) => opt(c, c, i === 0)).join("")}</select></label></div>
          <label class="file"><span class="file-btn">${ic("upload", 18)} <span data-file-name>${t("aUpload")}</span></span><input type="file" name="file" accept="application/pdf,image/*"><small>${t("aUploadHint")}</small></label>
          <label>${t("aShort")}<textarea name="short" rows="2" maxlength="160" placeholder="${t("aShortPh")}" required></textarea></label>
          <fieldset><legend>${t("aVis")}</legend><div class="radio-col">
            <label class="radio big"><input type="radio" name="vis" value="anon" checked><span>${ic("eyeoff", 20)}<span><strong>${t("aVisAnon")}</strong><small>${t("aVisAnonSub")}</small></span></span></label>
            <label class="radio big"><input type="radio" name="vis" value="full"><span>${ic("user", 20)}<span><strong>${t("aVisFull")}</strong><small>${t("aVisFullSub")}</small></span></span></label></div></fieldset>
          <p class="form-error" role="alert"></p>
          <button class="btn primary full" type="submit">${t("aSubmit")} ${ic("right")}</button>
        </form>
        <section class="card pad"><h2>${t("aSteps")}</h2><ol class="steps">${steps}</ol></section>`;
    },

    profile: () => {
      const p = S.profile;
      const full = p.mode === "full";
      const mode = (m, icon, k) => `<button class="mode ${p.mode === m ? "on" : ""}" data-action="profile-mode" data-arg="${m}" aria-pressed="${p.mode === m}">
        ${ic(icon, 22)}<strong>${t(k)}</strong><small>${t(k + "Sub")}</small></button>`;
      const preview = full
        ? `<div class="pv">${avatar({ anon: !p.name.trim(), name: p.name, hue: 172 }, 56)}<div><strong>${esc(p.name.trim() || t("anonName"))}</strong><small>${esc(p.city)}</small></div></div>
           ${p.bio.trim() ? `<h3>${t("aboutMe")}</h3><p>${esc(p.bio)}</p>` : `<p class="muted">${t("prEmptyBio")}</p>`}
           ${p.story.trim() ? `<h3>${t("myStory")}</h3><p>${esc(p.story)}</p>` : ""}`
        : `<div class="pv">${avatar({ anon: true }, 56)}<div><strong>${t("anonName")}</strong><small>${esc(p.city)}</small></div></div><p class="muted">${t("prAnonPreview")}</p>`;
      return `
        <p class="kicker">${t("prKicker")}</p>
        <div class="screen-head"><h1>${t("prTitle")}</h1></div>
        <p class="lede">${t("prText")}</p>
        <div class="modes">${mode("anon", "eyeoff", "prModeAnon")}${mode("full", "user", "prModeFull")}</div>
        <form class="card pad form" data-form="profile" novalidate>
          ${full ? `<label>${t("prName")}<input name="name" maxlength="40" value="${esc(p.name)}" placeholder="${t("prNamePh")}" autocomplete="off"></label>` : ""}
          <label>${t("prCity")}<input name="city" maxlength="40" value="${esc(p.city)}" placeholder="${t("prCityPh")}" autocomplete="off"></label>
          ${full ? `<label>${t("prBio")}<textarea name="bio" rows="3" maxlength="400" placeholder="${t("prBioPh")}">${esc(p.bio)}</textarea></label>
          <label>${t("prStory")}<textarea name="story" rows="4" maxlength="800" placeholder="${t("prStoryPh")}">${esc(p.story)}</textarea></label>` : ""}
          <button class="btn primary full" type="submit">${t("prSave")}</button>
          <p class="fine">${t("prLocal")}</p>
        </form>
        <section class="card pad preview"><p class="kicker">${t("prPreview")}</p>${preview}</section>
        <div class="links">
          <button class="row-link" data-action="open" data-arg="waitlist">${ic("mail", 18)} ${t("waitlist")} ${ic("chev", 16)}</button>
          <button class="row-link" data-action="open" data-arg="contact">${ic("hand", 18)} ${t("contact")} ${ic("chev", 16)}</button>
          <button class="row-link" data-action="open" data-arg="about">${ic("info", 18)} ${t("about")} ${ic("chev", 16)}</button>
          <button class="row-link danger" data-action="reset">${ic("undo", 18)} ${t("prReset")}</button>
        </div>`;
    },
  };

  // ---------- modals ----------
  const verifyList = () => `<ul class="verify">${["vId", "vDoc", "vPay"].map((k) => `<li>${ic("check", 14)} ${t(k)}</li>`).join("")}</ul>`;

  const modals = {
    person: () => {
      const r = getReq(M.id);
      if (!r) return "";
      const isStory = r.type === "story";
      const amt = M.amount || 25;
      const cta = r.mine ? "" : inBasket(r.id) || gifted(r.id)
        ? `<button class="btn outline full" disabled>${ic("check", 18)} ${t("inBasket")}</button>`
        : `${isStory ? `<p class="label">${t("chooseAmount")}</p><div class="chips">${STORY_CHIPS.map((c) => `<button class="chip ${amt === c ? "on" : ""}" data-action="amount" data-arg="${c}">${money(c, r.cur)}</button>`).join("")}</div>` : ""}
           <button class="btn primary full" data-action="add-id" data-arg="${r.id}">${t("addToBasket")} · ${money(isStory ? amt : r.amount, r.cur)} ${ic("right")}</button>`;
      const head = `<div class="p-head">${avatar(r, 72)}
        <div><h2 id="modal-title">${esc(displayName(r))}</h2>
        <p class="muted">${r.anon ? "" : (r.age ? `${r.age} ${t("years")} · ` : "")}${esc(r.city)}${r.country ? " · " + r.country : ""}</p></div></div>`;
      const ask = `<div class="p-ask"><span class="pill pill-cat static">${ic(CAT_ICON[r.cat] || "heart", 14)} ${catLabel(r)}</span>
        <p class="amount">${money(need(r), r.cur)}</p>${isStory ? progress(r) : ""}</div>`;
      const body = r.anon
        ? `<p class="quote">“${esc(L(r.short))}”</p>
           <div class="notice">${ic("eyeoff", 18)}<span><strong>${t("anonWhy")}</strong> ${t("anonExplain")}</span></div>`
        : `${L(r.bio).trim() ? `<h3>${t("aboutMe")}</h3><p>${esc(L(r.bio))}</p>` : ""}
           <h3>${t("myStory")}</h3><p>${esc(L(r.story).trim() || L(r.short))}</p>
           ${r.updates ? `<h3>${t("updates")}</h3><ul class="updates">${r.updates.map((u) => `<li><small>${fmtDate(u.date)}</small>${esc(L(u))}</li>`).join("")}</ul>` : ""}
           <p class="fine">${t("memberSince")} ${r.since}. ${t("fullExplain")}</p>`;
      return `${head}${ask}${verifyList()}${body}<p class="fine demo">${t("demoVerify")}</p>${cta}`;
    },

    donor: () => {
      const d = DONORS.find((x) => x.id === M.id);
      if (!d) return "";
      const name = d.anon ? t(d.kind === "company" ? "anonDonorCo" : "anonDonor") : d.name;
      const stats = `<div class="stats"><div><small>${t("perMonth")}</small><strong>${money(d.month, "EUR")}</strong></div>
        <div><small>${t("perYear")}</small><strong>${money(d.year, "EUR")}</strong></div>
        <div><small>${t("perAll")}</small><strong>${money(d.all, "EUR")}</strong></div></div>
        <p class="fine">${d.gifts} ${t("dGifts").toLowerCase()}</p>`;
      const kind = !d.anon && d.kind !== "person" ? `<span class="pill pill-kind">${ic(d.kind === "creator" ? "star" : "building", 12)} ${t(d.kind === "creator" ? "kCreator" : "kCompany")}</span>` : "";
      return `<div class="p-head">${avatar(d, 72, d.kind)}
          <div><h2 id="modal-title">${esc(name)}</h2>
          <p class="muted">${d.anon ? "" : `${d.handle ? esc(d.handle) + " · " : ""}${esc(d.city)}`}</p>
          ${kind}</div></div>
        ${stats}
        ${d.anon ? `<div class="notice">${ic("eyeoff", 18)}<span>${t("donorAnonExplain")}</span></div>`
          : `<h3>${t("aboutMe")}</h3><p>${esc(L(d.bio))}</p><h3>${t("whyGive")}</h3><p class="quote">“${esc(L(d.why))}”</p>`}
        <p class="fine demo">${t("lNote")}</p>`;
    },

    basket: () => {
      if (!S.basket.length) return `<h2 id="modal-title">${t("bTitle")}</h2><p class="muted">${t("bEmpty")}</p>
        <button class="btn outline full" data-action="close">${t("bKeep")}</button>`;
      const items = S.basket.map((b) => {
        const r = getReq(b.id);
        const chips = r.type === "story" ? `<div class="chips small">${STORY_CHIPS.map((c) => `<button class="chip ${b.amount === c ? "on" : ""}" data-action="basket-amount" data-arg="${r.id}:${c}">${money(c, r.cur)}</button>`).join("")}</div>` : "";
        return `<li><div class="b-row">${avatar(r, 40)}<span class="who-text"><strong>${esc(displayName(r))}</strong><small>${catLabel(r)}</small></span>
          <strong>${money(b.amount, r.cur)}</strong>
          <button class="round small" data-action="basket-remove" data-arg="${r.id}" aria-label="${t("remove")}">${ic("x", 14)}</button></div>${chips}</li>`;
      }).join("");
      const mixed = S.basket.some((b) => getReq(b.id).cur !== "EUR");
      return `<h2 id="modal-title">${t("bTitle")}</h2>
        <ul class="plain b-list">${items}</ul>
        <div class="b-total"><span>${t("bTotal")}${mixed ? `<small>${t("bApprox")}</small>` : ""}</span><strong>${mixed ? "≈ " : ""}${money(Math.round(basketTotalEur()), "EUR")}</strong></div>
        <div class="notice">${ic("shield", 18)}<span>${t("bNote")}</span></div>
        <button class="btn primary full" data-action="confirm">${t("bConfirm")} ${ic("heart", 18)}</button>
        <button class="btn text full" data-action="close">${t("bKeep")}</button>`;
    },

    thanks: () => {
      const rank = board("month").findIndex((r) => r.you) + 1;
      return `<div class="thanks"><span class="empty-ic big">${ic("heart", 30)}</span>
        <h2 id="modal-title">${t("thTitle")}</h2><p>${t("thText")}</p>
        ${rank ? `<p class="rank-line">${ic("trophy", 18)} ${t("thRank")} <strong>${rank}</strong></p>` : ""}</div>
        <button class="btn primary full" data-action="go" data-arg="leaderboard">${t("thBoard")} ${ic("right")}</button>
        <button class="btn outline full" data-action="open" data-arg="waitlist">${t("thNotify")} ${ic("mail", 18)}</button>`;
    },

    waitlist: () => {
      if (M.done) return `<div class="thanks"><span class="empty-ic big">${ic("check", 30)}</span><h2 id="modal-title">${t("wlDone")}</h2></div>
        <button class="btn outline full" data-action="close">${t("close")}</button>`;
      const role = M.role || "give";
      return `<h2 id="modal-title">${t("wlTitle")}</h2><p class="muted">${t("wlText")}</p>
        <form class="form" data-form="waitlist" novalidate>
          <p class="label">${t("wlRole")}</p>
          <div class="segs" role="group">${[["give", "wlGive"], ["get", "wlGet"], ["both", "wlBoth"]].map(([r, k]) => `<button type="button" class="seg ${role === r ? "on" : ""}" data-action="wl-role" data-arg="${r}" aria-pressed="${role === r}">${t(k)}</button>`).join("")}</div>
          <label>${t("email")}<input name="email" type="email" autocomplete="email" placeholder="${t("emailPh")}" required></label>
          <label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
          <p class="form-error" role="alert"></p>
          <button class="btn primary full" type="submit">${t("wlSubmit")} ${ic("right")}</button>
          <p class="fine">${t("wlNote")} <button type="button" class="link inline" data-action="open" data-arg="about">${t("about")}</button></p>
        </form>
        <hr><p class="muted small">${t("wlQuestion")}</p><button class="link" data-action="open" data-arg="contact">${t("contact")} ${ic("right", 16)}</button>`;
    },

    contact: () => {
      if (M.done) return `<div class="thanks"><span class="empty-ic big">${ic("check", 30)}</span><h2 id="modal-title">${t("ctDone")}</h2></div>
        <button class="btn outline full" data-action="close">${t("close")}</button>`;
      return `<h2 id="modal-title">${t("ctTitle")}</h2><p class="muted">${t("ctText")}</p>
        <form class="form" data-form="contact" novalidate>
          <label>${t("name")} <span class="muted">${t("optional")}</span><input name="name" maxlength="120" autocomplete="name" placeholder="${t("namePh")}"></label>
          <label>${t("email")}<input name="email" type="email" autocomplete="email" placeholder="${t("emailPh")}" required></label>
          <label>${t("topic")}<select name="topic" required><option value="">${t("topicPh")}</option>
            <option value="partnerships">${t("topicPartnerships")}</option><option value="build">${t("topicBuild")}</option></select></label>
          <label>${t("message")}<textarea name="message" rows="5" maxlength="4000" placeholder="${t("messagePh")}" required></textarea></label>
          <label class="hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off"></label>
          <p class="form-error" role="alert"></p>
          <button class="btn primary full" type="submit">${t("ctSubmit")} ${ic("right")}</button>
          <p class="fine">${t("ctNote")}</p>
        </form>`;
    },

    about: () => `<h2 id="modal-title">${t("abTitle")}</h2><p>${t("ab4")}</p>
      <button class="btn outline full" data-action="close">${t("close")}</button>`,
  };

  // ---------- render ----------
  function render() {
    const r = route();
    const inApp = r !== "welcome" && r !== "path";
    document.documentElement.lang = S.lang;
    document.title = t("title");
    document.body.classList.toggle("modal-open", !!M);

    const langs = ["it", "en"].map((l) => `<button class="flag ${S.lang === l ? "on" : ""}" data-action="lang" data-arg="${l}" aria-pressed="${S.lang === l}" aria-label="${l === "it" ? "Italiano" : "English"}" title="${l === "it" ? "Italiano" : "English"}">${FLAGS[l]}</button>`).join("");
    const header = `<header class="top">
      <button class="brand" data-action="go" data-arg="${inApp ? "discover" : "welcome"}" aria-label="BillKind">${LOGO}<span>Bill<b>Kind</b></span></button>
      <div class="top-actions"><button class="mini" data-action="open" data-arg="waitlist">${t("waitlist")} ${ic("right", 14)}</button>
        <div class="flags" role="group" aria-label="${t("langLabel")}">${langs}</div></div>
    </header>
    <p class="strip">${t("demoStrip")} · <button class="link inline" data-action="open" data-arg="contact">${t("contact")}</button></p>`;

    const count = S.basket.length;
    const bar = r === "discover" ? `<button class="basket-bar" data-action="open" data-arg="basket"><span>${t("viewBasket")}${count ? ` (${count})` : ""}</span>
      <span class="bb-amt">${money(Math.round(basketTotalEur()), "EUR")} ${ic("chev", 18)}</span></button>` : "";
    const tabs = inApp ? `<nav class="tabs" aria-label="BillKind">${TABS.map(([id, k, icon]) => `<button class="tab ${r === id ? "on" : ""}" data-action="go" data-arg="${id}" ${r === id ? 'aria-current="page"' : ""}>${ic(icon, 22)}<span>${t(k)}</span></button>`).join("")}</nav>` : "";

    const modal = M ? `<div class="overlay" data-action="close-overlay"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">
      <button class="round close" data-action="close" aria-label="${t("close")}">${ic("x", 18)}</button>${modals[M.type]()}</div></div>` : "";

    app.className = inApp ? "in-app" : "onboarding";
    app.innerHTML = `${header}<main class="screen s-${r}">${screens[r]()}</main>${inApp ? `<div class="dock">${bar}${tabs}</div>` : ""}${modal}`;
    if (M) app.querySelector(".modal").focus({ preventScroll: true });
  }

  const openModal = (type, extra = {}) => { M = { type, ...extra }; render(); };
  const closeModal = () => { M = null; render(); };

  // ---------- actions ----------
  function readProfileForm() {
    const f = app.querySelector('form[data-form="profile"]');
    if (!f) return;
    for (const k of ["name", "city", "bio", "story"]) if (f.elements[k]) S.profile[k] = f.elements[k].value;
  }

  const actions = {
    go: (r) => { M = null; if (r !== "welcome" && r !== "path") { S.seen = true; save(); } go(r); window.scrollTo(0, 0); },
    choose: (side) => { S.seen = true; save(); go(side === "get" ? "ask" : "discover"); },
    lang: (l) => { readProfileForm(); S.lang = l; save(); render(); },
    open: (type) => openModal(type, type === "waitlist" ? { role: route() === "ask" ? "get" : "give" } : {}),
    close: () => closeModal(),
    filter: (f) => { S.filter = f; save(); render(); },
    skip: () => { const top = deck()[0]; if (!top) return; S.skipped.push(top.id); S.history.push({ type: "skip", id: top.id }); save(); render(); },
    add: () => { const top = deck()[0]; if (!top) return; addToBasket(top.id); render(); },
    undo: () => {
      const last = S.history.pop();
      if (!last) return;
      if (last.type === "skip") S.skipped = S.skipped.filter((id) => id !== last.id);
      else S.basket = S.basket.filter((b) => b.id !== last.id);
      save(); render();
    },
    restart: () => { S.skipped = []; S.history = []; S.filter = "all"; save(); render(); },
    person: (id) => openModal("person", { id }),
    donor: (id) => openModal("donor", { id }),
    amount: (v) => { M.amount = Number(v); render(); },
    "add-id": (id) => { addToBasket(id, getReq(id).type === "story" ? M.amount || 25 : undefined); closeModal(); },
    "basket-remove": (id) => { S.basket = S.basket.filter((b) => b.id !== id); S.history = S.history.filter((h) => h.id !== id); save(); render(); },
    "basket-amount": (arg) => { const [id, v] = arg.split(":"); const b = S.basket.find((x) => x.id === id); if (b) b.amount = Number(v); save(); render(); },
    confirm: () => {
      const date = new Date().toISOString();
      for (const b of S.basket) S.gifts.push({ id: b.id, amount: b.amount, cur: getReq(b.id).cur, date });
      S.basket = []; S.history = []; save();
      openModal("thanks");
    },
    period: (p) => { S.period = p; save(); render(); },
    "profile-mode": (m) => { readProfileForm(); S.profile.mode = m; save(); render(); },
    "ask-remove": () => { S.request = null; save(); render(); },
    "wl-role": (r, el) => {
      M.role = r;
      for (const b of el.parentElement.children) { b.classList.toggle("on", b === el); b.setAttribute("aria-pressed", b === el); }
    },
    reset: () => { const lang = S.lang; S = defaults(); S.lang = lang; M = null; save(); toast(t("prResetDone")); go("welcome"); window.scrollTo(0, 0); },
  };

  app.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el || el.disabled) return;
    const name = el.dataset.action;
    if (name === "close-overlay") { if (e.target === el) closeModal(); return; }
    if (actions[name]) { e.preventDefault(); actions[name](el.dataset.arg, el); }
  });

  app.addEventListener("change", (e) => {
    if (e.target.type === "file") {
      const label = e.target.closest(".file").querySelector("[data-file-name]");
      if (e.target.files[0]) label.textContent = e.target.files[0].name;
    }
  });

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  async function post(form, path, body) {
    const btn = form.querySelector('button[type="submit"]');
    const err = form.querySelector(".form-error");
    const label = btn.innerHTML;
    btn.disabled = true; btn.textContent = t("sending"); err.textContent = "";
    try {
      const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.ok) throw new Error(out.error || "send");
      return true;
    } catch {
      err.textContent = t("errSend");
      btn.disabled = false; btn.innerHTML = label;
      return false;
    }
  }

  const forms = {
    profile: (f) => { readProfileForm(); save(); toast(t("prSaved")); render(); },
    ask: (f) => {
      const amount = Math.round(Number(f.elements.amount.value));
      const short = f.elements.short.value.trim();
      const err = f.querySelector(".form-error");
      if (!(amount > 0) || amount > 20000) { err.textContent = t("aAmount") + "?"; f.elements.amount.focus(); return; }
      if (short.length < 5) { err.textContent = t("aShort") + "?"; f.elements.short.focus(); return; }
      S.request = { type: f.elements.type.value, cat: f.elements.cat.value, amount, cur: f.elements.cur.value, short, vis: f.elements.vis.value };
      save(); render(); window.scrollTo(0, 0);
    },
    waitlist: async (f) => {
      const email = f.elements.email.value.trim();
      if (!EMAIL_RE.test(email)) { f.querySelector(".form-error").textContent = t("errEmail"); f.elements.email.focus(); return; }
      if (await post(f, "api/waitlist", { email, role: M.role || "give", lang: S.lang, website: f.elements.website.value })) { M.done = true; render(); }
    },
    contact: async (f) => {
      const v = (k) => f.elements[k].value.trim();
      const err = f.querySelector(".form-error");
      if (!EMAIL_RE.test(v("email"))) { err.textContent = t("errEmail"); f.elements.email.focus(); return; }
      if (!v("topic")) { err.textContent = t("errTopic"); f.elements.topic.focus(); return; }
      if (v("message").length < 5) { err.textContent = t("errMessage"); f.elements.message.focus(); return; }
      if (await post(f, "api/contact", { name: v("name"), email: v("email"), topic: v("topic"), message: v("message"), lang: S.lang, website: f.elements.website.value })) { M.done = true; render(); }
    },
  };
  app.addEventListener("submit", (e) => {
    const f = e.target.closest("form[data-form]");
    if (!f) return;
    e.preventDefault();
    forms[f.dataset.form]?.(f);
  });

  // ---------- keyboard + swipe ----------
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && M) return closeModal();
    if (M || route() !== "discover" || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === "ArrowLeft") actions.skip();
    if (e.key === "ArrowRight") actions.add();
  });

  let drag = null;
  app.addEventListener("pointerdown", (e) => {
    const card = e.target.closest(".deck-card");
    if (!card || e.target.closest("button") || M) return;
    drag = { card, x: e.clientX, dx: 0 };
    card.classList.add("dragging");
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag) return;
    drag.dx = e.clientX - drag.x;
    drag.card.style.transform = `translateX(${drag.dx}px) rotate(${drag.dx / 28}deg)`;
    drag.card.dataset.dir = drag.dx > 40 ? "add" : drag.dx < -40 ? "skip" : "";
  });
  const endDrag = () => {
    if (!drag) return;
    const { card, dx } = drag;
    drag = null;
    card.classList.remove("dragging");
    if (dx > 90) actions.add();
    else if (dx < -90) actions.skip();
    else { card.style.transform = ""; card.dataset.dir = ""; }
  };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  window.addEventListener("hashchange", () => { M = null; render(); });
  render();
})();
