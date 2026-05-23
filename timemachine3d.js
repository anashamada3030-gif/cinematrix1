/**
 * CinaMatrix — Time Machine (Oscar Timeline Edition v2)
 * CSS 3D carousel — matches oscar-timeline-3d.html exactly.
 * Fix: staggered eager loading, no lazy/display:none conflicts.
 */
(function () {
  "use strict";

  /* ─── STYLES ─── */
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Raleway:wght@300;400;500;600&display=swap');

    #tm-root {
      position:relative; width:100%; height:100%;
      display:flex; flex-direction:column; overflow:hidden;
      background:#03030A;
      background-image:
        radial-gradient(ellipse 70% 40% at 50% 0%, rgba(201,162,39,.07) 0%, transparent 70%),
        radial-gradient(ellipse 100% 60% at 50% 100%, rgba(10,10,40,.8) 0%, transparent 70%);
      font-family:'Raleway',sans-serif;
      border-radius:inherit;
      color:#F0EDE6;
    }
    #tm-root::before {
      content:''; position:absolute; inset:0; pointer-events:none; z-index:99; opacity:.1;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }
    #tm-vp {
      flex:1; position:relative; min-height:0;
      perspective:1200px; perspective-origin:50% 50%;
      cursor:grab; overflow:hidden;
    }
    #tm-vp.tm-drag { cursor:grabbing; }
    #tm-track { position:relative; width:100%; height:100%; transform-style:preserve-3d; }

    .tm-card {
      position:absolute;
      width:160px; height:240px;
      left:50%; top:50%;
      margin-left:-80px; margin-top:-120px;
      border-radius:10px; overflow:hidden;
      border:1px solid rgba(255,255,255,.06);
      transition:transform .5s cubic-bezier(.25,.46,.45,.94), opacity .5s ease, box-shadow .5s ease;
      cursor:pointer; background:#111;
    }
    .tm-card.tm-act {
      box-shadow:0 0 45px rgba(201,162,39,.25), 0 20px 55px rgba(0,0,0,.8);
      border-color:rgba(201,162,39,.4);
    }
    .tm-card.tm-live { transition:none; }

    /* Poster image — always block, opacity fade-in */
    .tm-card-img {
      position:absolute; inset:0;
      width:100%; height:100%; object-fit:cover;
      opacity:0; transition:opacity .4s ease;
      z-index:2;
    }
    .tm-card-img.loaded { opacity:1; }

    /* Gradient fallback — always visible behind image */
    .tm-card-fb {
      position:absolute; inset:0; z-index:1;
      display:flex; flex-direction:column; justify-content:flex-end;
      padding:.8rem;
    }

    /* Bottom info bar — always on top */
    .tm-card-bot {
      position:absolute; bottom:0; left:0; right:0; z-index:3;
      padding:.6rem .8rem;
      background:linear-gradient(to top, rgba(0,0,0,.95) 0%, rgba(0,0,0,.6) 60%, transparent 100%);
    }
    .tm-card-yr {
      font-family:'Cinzel',serif; font-size:.52rem;
      letter-spacing:.25em; color:#C9A227; display:block; margin-bottom:.1rem;
    }
    .tm-card-ttl {
      font-family:'Cinzel',serif; font-size:.64rem;
      font-weight:600; color:#fff; line-height:1.25; display:block;
    }

    #tm-nav {
      display:flex; align-items:center; gap:1rem;
      justify-content:center; padding:.45rem 0;
      flex-shrink:0; position:relative; z-index:10;
    }
    .tm-nav-btn {
      width:32px; height:32px; border-radius:50%;
      border:1px solid rgba(201,162,39,.3); background:transparent;
      color:#C9A227; font-size:.9rem; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      transition:all .2s;
    }
    .tm-nav-btn:hover { background:rgba(201,162,39,.12); border-color:#C9A227; }
    #tm-cnt {
      font-family:'Cinzel',serif; font-size:.6rem;
      color:#8A8A9A; letter-spacing:.1em; min-width:42px; text-align:center;
    }

    #tm-dots {
      display:flex; justify-content:center; gap:5px;
      padding:.25rem 1rem; flex-wrap:wrap;
      max-width:90%; margin:0 auto;
      flex-shrink:0; position:relative; z-index:10;
    }
    .tm-dot {
      width:5px; height:5px; border-radius:50%;
      background:rgba(255,255,255,.12); cursor:pointer;
      transition:all .3s; flex-shrink:0;
    }
    .tm-dot.on { background:#C9A227; transform:scale(1.6); }

    #tm-detail {
      padding:.5rem 1.5rem .7rem; text-align:center;
      flex-shrink:0; position:relative; z-index:10;
    }
    #tm-di { transition:opacity .25s ease, transform .25s ease; }
    #tm-di.out { opacity:0; transform:translateY(6px); }
    #tm-dyr {
      font-family:'Cinzel',serif; font-size:.55rem;
      letter-spacing:.4em; color:#C9A227; margin-bottom:.2rem;
    }
    #tm-dttl {
      font-family:'Cinzel',serif; font-size:1.15rem;
      font-weight:900; color:#F0EDE6; line-height:1.2; margin-bottom:.25rem;
    }
    #tm-dbdg {
      display:inline-flex; align-items:center; gap:.3rem;
      background:rgba(201,162,39,.1); border:1px solid rgba(201,162,39,.25);
      border-radius:20px; padding:.18rem .75rem;
      font-family:'Cinzel',serif; font-size:.58rem; letter-spacing:.07em;
      color:#C9A227; margin-bottom:.25rem;
    }
    #tm-dmeta { font-size:.68rem; color:#8A8A9A; letter-spacing:.03em; }

    #tm-prog-bar { height:2px; background:rgba(255,255,255,.04); flex-shrink:0; }
    #tm-prog-fill { height:100%; background:#C9A227; transition:width .4s ease; width:0%; }
  `;
  document.head.appendChild(styleEl);

  /* ─── WAIT FOR DATA ─── */
  let TM = null;
  const _poll = setInterval(() => {
    if (TM) { clearInterval(_poll); return; }
    if (typeof DATA === "undefined" || !DATA.awards?.length) return;
    patchNav();
    patchMode();
    clearInterval(_poll);
  }, 200);

  function patchNav() {
    const _orig = window.nav;
    window.nav = function (page, el) {
      _orig(page, el);
      if (page === "timemachine") setTimeout(boot, 60);
    };
  }

  function patchMode() {
    window.setTlMode = function (mode, el) {
      document.querySelectorAll(".tl-mode-btn").forEach(b => b.classList.remove("active"));
      el.classList.add("active");
      if (TM) TM.setMode(mode);
    };
    if (document.getElementById("page-timemachine")?.classList.contains("active")) {
      setTimeout(boot, 60);
    }
  }

  /* ─── BOOT ─── */
  function boot() {
    if (TM) { TM.resize(); return; }
    const wrap = document.getElementById("timeline-canvas-wrap");
    if (!wrap) return;

    wrap.style.cssText += ";overflow:visible;height:auto;flex:1;";
    wrap.innerHTML = `
      <div id="tm-root">
        <div id="tm-vp"><div id="tm-track"></div></div>
        <div id="tm-nav">
          <button class="tm-nav-btn" id="tm-prev">&#8592;</button>
          <div id="tm-cnt">1 / 0</div>
          <button class="tm-nav-btn" id="tm-next">&#8594;</button>
        </div>
        <div style="display:flex;justify-content:center;">
          <div id="tm-dots"></div>
        </div>
        <div id="tm-detail">
          <div id="tm-di">
            <div id="tm-dyr"></div>
            <div id="tm-dttl"></div>
            <div id="tm-dbdg"></div>
            <div id="tm-dmeta"></div>
          </div>
        </div>
        <div id="tm-prog-bar"><div id="tm-prog-fill"></div></div>
      </div>`;

    const hint = document.querySelector(".tl-scroll-hint");
    if (hint) hint.textContent = "← → keys  •  click arrows  •  drag  •  click to open";

    TM = new OscarCarousel();
    TM.setMode("Oscar");

    document.addEventListener("keydown", e => {
      if (!document.getElementById("page-timemachine")?.classList.contains("active")) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); TM.go(1); }
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   { e.preventDefault(); TM.go(-1); }
    });
  }

  /* ─── CAROUSEL ─── */
  class OscarCarousel {
    constructor() {
      this.movies   = [];
      this.cur      = 0;
      this.live     = 0;
      this.dragging = false;
      this.dsx = 0; this.dsi = 0;
      this._loadTimers = [];

      this.vp     = document.getElementById("tm-vp");
      this.track  = document.getElementById("tm-track");
      this.dotsEl = document.getElementById("tm-dots");
      this.cntEl  = document.getElementById("tm-cnt");
      this.diEl   = document.getElementById("tm-di");
      this.progEl = document.getElementById("tm-prog-fill");

      this._bindEvents();
    }

    setMode(mode) {
      this.mode = mode;
      // Cancel pending loads
      this._loadTimers.forEach(clearTimeout);
      this._loadTimers = [];

      const raw = (DATA.awards || []).filter(a => {
        const t = (a.award_type || "").trim();
        if (mode === "Oscar")       return /oscar/i.test(t);
        if (mode === "GoldenGlobe") return /golden|globe/i.test(t);
        return true;
      });
      this.movies = raw.slice().sort((a, b) =>
        +(a.award_year || a.year || 0) - +(b.award_year || b.year || 0)
      );
      this.cur  = Math.max(0, this.movies.length - 1);
      this.live = this.cur;
      this._build();
    }

    resize() { this._pose(this.cur); }
    go(d)    { this._snap(this.cur + d, true); }

    /* ── build cards ── */
    _build() {
      this.track.innerHTML = "";
      this.dotsEl.innerHTML = "";
      this._loadTimers.forEach(clearTimeout);
      this._loadTimers = [];

      const PALS = [
        ["#1a1035","#06020f"],["#0e1f3d","#020b1a"],["#1d0e0e","#0a0202"],
        ["#0d1f18","#020a06"],["#1a160a","#080601"],["#0d0d28","#03030f"],
        ["#1a0d1f","#060208"],["#1f1a0d","#080601"],
      ];

      this.movies.forEach((m, i) => {
        const pal   = PALS[i % PALS.length];
        const year  = m.award_year || m.year || "?";
        const title = m.title || "";
        const dir   = m.director || "";
        const stars = "★".repeat(Math.min(Math.round(+(m.vote_average || 0) / 2), 5)) || "★";

        const card = document.createElement("div");
        card.className = "tm-card";
        card.dataset.i = i;

        // Note: img has NO loading="lazy" — we control loading ourselves
        card.innerHTML = `
          <img class="tm-card-img" alt="${title.replace(/"/g,"&quot;")}">
          <div class="tm-card-fb" style="background:linear-gradient(160deg,${pal[0]} 0%,${pal[1]} 100%);">
            <div style="font-family:'Cinzel',serif;font-size:.55rem;letter-spacing:.2em;color:#C9A227;">${year}</div>
            <div style="font-family:'Cinzel',serif;font-size:.72rem;font-weight:700;color:#fff;line-height:1.3;margin:.15rem 0;">${title}</div>
            <div style="font-size:.55rem;color:rgba(255,255,255,.38);">${dir}</div>
            <div style="color:#C9A227;font-size:.58rem;margin-top:.3rem;">${stars}</div>
          </div>
          <div class="tm-card-bot">
            <span class="tm-card-yr">${year}</span>
            <span class="tm-card-ttl">${title}</span>
          </div>`;

        card.addEventListener("click", () => {
          if (Math.abs(i - this.cur) > 0.4) { this._snap(i); return; }
          if (typeof openMovieObj === "function") openMovieObj(m);
        });

        this.track.appendChild(card);

        // Dot
        const dot = document.createElement("div");
        dot.className = "tm-dot" + (i === this.cur ? " on" : "");
        dot.addEventListener("click", () => this._snap(i));
        this.dotsEl.appendChild(dot);
      });

      // Staggered poster loading: current card first, then spiral outward
      this._schedulePosters(this.cur);
      this._pose(this.cur);
      this._refresh();
    }

    /* ── staggered poster loading from center outward ── */
    _schedulePosters(center) {
      this._loadTimers.forEach(clearTimeout);
      this._loadTimers = [];

      const cards  = Array.from(this.track.querySelectorAll(".tm-card"));
      const n      = cards.length;
      if (!n) return;

      // Build load order: center, center±1, center±2, ...
      const order = [];
      order.push(center);
      for (let d = 1; d < n; d++) {
        if (center + d < n) order.push(center + d);
        if (center - d >= 0) order.push(center - d);
      }

      order.forEach((idx, rank) => {
        const card = cards[idx];
        const m    = this.movies[idx];
        if (!card || !m?.poster_url) return;

        // First 8 cards load immediately, rest staggered 80ms apart
        const delay = rank < 8 ? 0 : (rank - 8) * 80;
        const t = setTimeout(() => {
          const img = card.querySelector(".tm-card-img");
          if (img.src) return; // already loading
          img.onload  = () => img.classList.add("loaded");
          img.onerror = () => {}; // gradient fallback stays
          img.src = m.poster_url;
        }, delay);
        this._loadTimers.push(t);
      });
    }

    /* ── CSS 3D pose ── */
    _pose(idx) {
      const GAP = 220, TZ = 85, RY = 20, SC = 0.82, OP = 0.22, MAX = 4;
      this.track.querySelectorAll(".tm-card").forEach((c, i) => {
        const off = i - idx, ab = Math.abs(off);
        if (ab > MAX) { c.style.opacity = "0"; c.style.pointerEvents = "none"; return; }
        const sc = Math.pow(SC, ab), op = Math.max(.06, 1 - ab * OP);
        c.style.transform  = `translateX(${off * GAP}px) translateZ(${-ab * TZ}px) rotateY(${-off * RY}deg) scale(${sc})`;
        c.style.opacity    = op;
        c.style.zIndex     = 100 - Math.floor(ab * 12);
        c.style.pointerEvents = ab > 2 ? "none" : "auto";
        c.classList.toggle("tm-act",  Math.round(idx) === i);
        c.classList.toggle("tm-live", this.dragging);
      });
    }

    /* ── refresh detail + counter + dots ── */
    _refresh(anim) {
      const m = this.movies[this.cur];
      if (!m) return;

      this.cntEl.textContent = `${this.cur + 1} / ${this.movies.length}`;
      const pct = this.movies.length > 1
        ? ((this.cur / (this.movies.length - 1)) * 100).toFixed(1) : "100";
      this.progEl.style.width = pct + "%";
      this.dotsEl.querySelectorAll(".tm-dot").forEach((d, i) =>
        d.classList.toggle("on", i === this.cur));

      const fill = () => {
        const year   = m.award_year || m.year || "";
        const title  = m.title || "";
        const atype  = m.award_type || "Award";
        const genre  = (m.genres || "").split(",").slice(0, 2).join(" · ");
        const rating = parseFloat(m.vote_average || 0).toFixed(1);
        const dir    = m.director ? "Dir. " + m.director : "";
        document.getElementById("tm-dyr").textContent  = year;
        document.getElementById("tm-dttl").textContent = title;
        document.getElementById("tm-dbdg").innerHTML   = `⭐ ${atype}`;
        document.getElementById("tm-dmeta").textContent =
          [dir, genre, rating > 0 ? "★ " + rating : ""].filter(Boolean).join("  ·  ");
      };

      if (anim) {
        this.diEl.classList.add("out");
        setTimeout(() => { fill(); this.diEl.classList.remove("out"); }, 230);
      } else { fill(); }
    }

    /* ── snap ── */
    _snap(i, anim) {
      const ni = Math.max(0, Math.min(this.movies.length - 1, Math.round(i)));
      const changed = ni !== this.cur;
      this.cur = ni; this.live = ni;
      this.dragging = false;
      this.vp.classList.remove("tm-drag");
      this._pose(this.cur);
      // Re-schedule so nearest cards load next
      this._schedulePosters(this.cur);
      if (changed || anim) this._refresh(true); else this._refresh();
    }

    /* ── events ── */
    _bindEvents() {
      const GAP = 220;

      // Mouse drag
      this.vp.addEventListener("mousedown", e => {
        this.dragging = true;
        this.dsx = e.clientX; this.dsi = this.cur; this.live = this.cur;
        this.vp.classList.add("tm-drag");
        e.preventDefault();
      });
      document.addEventListener("mousemove", e => {
        if (!this.dragging) return;
        this.live = Math.max(0, Math.min(this.movies.length - 1, this.dsi + (this.dsx - e.clientX) / GAP));
        this._pose(this.live);
      });
      document.addEventListener("mouseup", () => { if (this.dragging) this._snap(this.live); });

      // Touch
      this.vp.addEventListener("touchstart", e => {
        this.dsx = e.touches[0].clientX; this.dsi = this.cur; this.live = this.cur;
      }, { passive: true });
      this.vp.addEventListener("touchmove", e => {
        this.live = Math.max(0, Math.min(this.movies.length - 1, this.dsi + (this.dsx - e.touches[0].clientX) / GAP));
        this._pose(this.live);
      }, { passive: true });
      this.vp.addEventListener("touchend", () => this._snap(this.live));

      // Wheel
      let wt = 0;
      this.vp.addEventListener("wheel", e => {
        e.preventDefault();
        const now = Date.now(); if (now - wt < 280) return; wt = now;
        (e.deltaX || e.deltaY) > 0 ? this.go(1) : this.go(-1);
      }, { passive: false });

      // Buttons
      document.getElementById("tm-prev").addEventListener("click", () => this.go(-1));
      document.getElementById("tm-next").addEventListener("click", () => this.go(1));
    }
  }

})();
