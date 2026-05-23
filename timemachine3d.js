/**
 * CinaMatrix — Time Machine (Full Oscar Timeline Design v3)
 * - Full oscar-timeline-3d.html visual design
 * - Staggered eager loading (no lazy/display:none conflict)
 * - Click on active card → openMovieObj() movie detail modal
 * - Mode toggle synced with pill buttons in page HTML
 */
(function () {
  "use strict";

  /* ─── STYLES ─── */
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Raleway:wght@300;400;500;600&display=swap');

    #tm-root {
      position: relative; width: 100%; height: 100%;
      display: flex; flex-direction: column; overflow: hidden;
      font-family: 'Raleway', sans-serif;
      color: #F0EDE6;
    }

    #tm-vp {
      flex: 1; position: relative; min-height: 0;
      perspective: 1300px; perspective-origin: 50% 50%;
      cursor: grab; overflow: hidden;
    }
    #tm-vp.tm-drag { cursor: grabbing; }
    #tm-track { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; }

    .tm-card {
      position: absolute;
      width: 200px; height: 300px;
      left: 50%; top: 50%;
      margin-left: -100px; margin-top: -150px;
      border-radius: 10px; overflow: hidden;
      border: 1px solid rgba(255,255,255,.05);
      transition: transform .5s cubic-bezier(.25,.46,.45,.94), opacity .5s ease, box-shadow .5s ease;
      cursor: pointer;
    }
    .tm-card.tm-act {
      box-shadow: 0 0 50px rgba(201,162,39,.22), 0 25px 60px rgba(0,0,0,.7);
      border-color: rgba(201,162,39,.35);
    }
    .tm-card.tm-live { transition: none; }

    .tm-card-img {
      position: absolute; inset: 0;
      width: 100%; height: 100%; object-fit: cover;
      opacity: 0; transition: opacity .4s ease;
      z-index: 2;
    }
    .tm-card-img.loaded { opacity: 1; }

    .tm-card-fb {
      position: absolute; inset: 0; z-index: 1;
      display: flex; flex-direction: column; justify-content: flex-end;
      padding: 1rem;
    }

    .tm-card-bot {
      position: absolute; bottom: 0; left: 0; right: 0; z-index: 3;
      padding: .7rem .9rem;
      background: linear-gradient(to top, rgba(0,0,0,.92) 0%, rgba(0,0,0,.55) 55%, transparent 100%);
    }
    .tm-card-yr {
      font-family: 'Cinzel', serif; font-size: .58rem;
      letter-spacing: .25em; color: #C9A227; display: block; margin-bottom: .15rem;
    }
    .tm-card-ttl {
      font-family: 'Cinzel', serif; font-size: .72rem;
      font-weight: 600; color: #fff; line-height: 1.3; display: block;
    }

    #tm-nav {
      display: flex; align-items: center; gap: 1.2rem;
      justify-content: center; padding: .5rem 0;
      flex-shrink: 0; position: relative; z-index: 10;
    }
    .tm-nav-btn {
      width: 36px; height: 36px; border-radius: 50%;
      border: 1px solid rgba(201,162,39,.3); background: transparent;
      color: #C9A227; font-size: 1rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all .2s;
    }
    .tm-nav-btn:hover { background: rgba(201,162,39,.12); border-color: #C9A227; }
    #tm-cnt {
      font-family: 'Cinzel', serif; font-size: .65rem;
      color: #8A8A9A; letter-spacing: .12em; min-width: 48px; text-align: center;
    }

    #tm-dots {
      display: flex; justify-content: center; gap: 5px;
      padding: .4rem 1rem; flex-wrap: wrap;
      max-width: 400px; margin: 0 auto;
      flex-shrink: 0; position: relative; z-index: 10;
    }
    .tm-dot {
      width: 5px; height: 5px; border-radius: 50%;
      background: rgba(255,255,255,.1); cursor: pointer;
      transition: all .3s; flex-shrink: 0;
    }
    .tm-dot.on { background: #C9A227; transform: scale(1.6); }

    #tm-detail {
      padding: .8rem 2rem 1rem; text-align: center;
      flex-shrink: 0; position: relative; z-index: 10;
    }
    #tm-di { transition: opacity .28s ease, transform .28s ease; }
    #tm-di.out { opacity: 0; transform: translateY(7px); }
    #tm-dyr {
      font-family: 'Cinzel', serif; font-size: .6rem;
      letter-spacing: .4em; color: #C9A227; margin-bottom: .3rem;
    }
    #tm-dttl {
      font-family: 'Cinzel', serif; font-size: 1.5rem;
      font-weight: 900; color: #F0EDE6; line-height: 1.2; margin-bottom: .35rem;
    }
    #tm-dbdg {
      display: inline-flex; align-items: center; gap: .35rem;
      background: rgba(201,162,39,.1); border: 1px solid rgba(201,162,39,.28);
      border-radius: 20px; padding: .22rem .9rem;
      font-family: 'Cinzel', serif; font-size: .62rem; letter-spacing: .08em;
      color: #C9A227; margin-bottom: .4rem;
    }
    #tm-dmeta { font-size: .75rem; color: #8A8A9A; margin-bottom: .35rem; letter-spacing: .04em; }
    #tm-dawd {
      font-size: .72rem; color: rgba(232,197,71,.65);
      font-style: italic; line-height: 1.7;
      max-width: 580px; margin: 0 auto;
    }

    /* Mode toggle active state */
    .tl-mode-btn.active, .tl-mode-btn:focus {
      background: #C9A227 !important; color: #000 !important;
    }
  `;
  document.head.appendChild(styleEl);

  /* ─── PALETTES ─── */
  const PALS = [
    ["#3A180A","#0E0603"],["#17366A","#06101E"],["#0A1E35","#03080F"],
    ["#28183A","#09060F"],["#163822","#050E09"],["#422C0E","#100A04"],
    ["#380A0A","#0E0303"],["#181838","#060614"],["#1C2C18","#080E06"],
    ["#2A1838","#08060F"],["#182830","#05090C"],["#2C1A08","#0A0703"],
    ["#183444","#060D10"],["#381838","#0E060E"],["#18183A","#060610"],
    ["#242424","#070707"],["#5C2F0E","#150A02"],
  ];

  /* ─── WAIT FOR DATA ─── */
  let TM = null;

  const _poll = setInterval(() => {
    if (typeof DATA === "undefined" || !DATA.awards?.length) return;
    clearInterval(_poll);
    patchNav();
    patchMode();
    if (document.getElementById("page-timemachine")?.classList.contains("active")) {
      setTimeout(boot, 60);
    }
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
      document.querySelectorAll(".tl-mode-btn").forEach(b => {
        b.style.background = "transparent";
        b.style.color = "#8A8A9A";
        b.classList.remove("active");
      });
      el.style.background = "#C9A227";
      el.style.color = "#000";
      el.classList.add("active");
      if (TM) TM.setMode(mode);
    };
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
            <div id="tm-dawd"></div>
          </div>
        </div>
      </div>`;

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

      this._bindEvents();
    }

    setMode(mode) {
      this.mode = mode;
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

      // Update header subtitle with year range
      const years = this.movies.map(m => +(m.award_year || m.year || 0)).filter(Boolean);
      const subEl = document.getElementById("tm-hdr-sub");
      if (subEl && years.length)
        subEl.textContent = Math.min(...years) + " \u2014 " + Math.max(...years);

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

      this.movies.forEach((m, i) => {
        const pal   = PALS[i % PALS.length];
        const year  = m.award_year || m.year || "?";
        const title = m.title || "";
        const dir   = m.director || "";
        const wins  = parseInt(m.award_count || m.wins || 1) || 1;
        const stars = "★".repeat(Math.min(wins, 7));

        const card = document.createElement("div");
        card.className = "tm-card";
        card.dataset.i = i;

        card.innerHTML = `
          <img class="tm-card-img" alt="${title.replace(/"/g,"&quot;")}">
          <div class="tm-card-fb" style="background:linear-gradient(160deg,${pal[0]} 0%,${pal[1]} 100%);">
            <div style="font-family:'Cinzel',serif;font-size:.58rem;letter-spacing:.22em;color:#C9A227;margin-bottom:.2rem;">${year}</div>
            <div style="font-family:'Cinzel',serif;font-size:.8rem;font-weight:700;color:#fff;line-height:1.3;">${title}</div>
            <div style="font-size:.6rem;color:rgba(255,255,255,.42);margin-top:.25rem;">${dir}</div>
            <div style="margin-top:.45rem;color:#C9A227;font-size:.62rem;">${stars}</div>
          </div>
          <div class="tm-card-bot">
            <span class="tm-card-yr">${year}</span>
            <span class="tm-card-ttl">${title}</span>
          </div>`;

        card.addEventListener("click", () => {
          const dist = Math.abs(i - this.cur);
          if (dist > 0.4) { this._snap(i); return; }
          // Open movie detail modal
          this._openMovie(m);
        });

        this.track.appendChild(card);

        // Dot
        const dot = document.createElement("div");
        dot.className = "tm-dot" + (i === this.cur ? " on" : "");
        dot.addEventListener("click", () => this._snap(i));
        this.dotsEl.appendChild(dot);
      });

      this._schedulePosters(this.cur);
      this._pose(this.cur);
      this._refresh();
    }

    /* ── open movie detail ── */
    _openMovie(m) {
      // Use the main app's openMovieObj if available
      if (typeof openMovieObj === "function") {
        // Try to find the full movie object from movieRegistry by id or title match
        if (typeof movieRegistry !== "undefined") {
          const full = movieRegistry.find(r =>
            (r && String(r.id) === String(m.id)) ||
            (r && r.title === m.title && (r.award_year || r.year || r.release_date || "").toString().slice(0,4) === String(m.award_year || m.year || ""))
          );
          if (full) { openMovieObj(full); return; }
        }
        openMovieObj(m);
      }
    }

    /* ── staggered poster loading from center outward ── */
    _schedulePosters(center) {
      this._loadTimers.forEach(clearTimeout);
      this._loadTimers = [];

      const cards = Array.from(this.track.querySelectorAll(".tm-card"));
      const n = cards.length;
      if (!n) return;

      const order = [center];
      for (let d = 1; d < n; d++) {
        if (center + d < n) order.push(center + d);
        if (center - d >= 0) order.push(center - d);
      }

      order.forEach((idx, rank) => {
        const card = cards[idx];
        const m    = this.movies[idx];
        if (!card || !m?.poster_url) return;

        const delay = rank < 8 ? 0 : (rank - 8) * 80;
        const t = setTimeout(() => {
          const img = card.querySelector(".tm-card-img");
          if (img.src) return;
          img.onload  = () => img.classList.add("loaded");
          img.onerror = () => {};
          img.src = m.poster_url;
        }, delay);
        this._loadTimers.push(t);
      });
    }

    /* ── CSS 3D pose ── */
    _pose(idx) {
      const GAP = 236, TZ = 92, RY = 22, SC = 0.82, OP = 0.22, MAX = 4;
      this.track.querySelectorAll(".tm-card").forEach((c, i) => {
        const off = i - idx, ab = Math.abs(off);
        if (ab > MAX) { c.style.opacity = "0"; c.style.pointerEvents = "none"; return; }
        const sc = Math.pow(SC, ab), op = Math.max(.08, 1 - ab * OP);
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

      // Outer progress bar
      const progFill = document.getElementById("tm-outer-prog-fill");
      if (progFill) {
        const pct = this.movies.length > 1
          ? ((this.cur / (this.movies.length - 1)) * 100).toFixed(1) : "100";
        progFill.style.width = pct + "%";
      }

      this.dotsEl.querySelectorAll(".tm-dot").forEach((d, i) =>
        d.classList.toggle("on", i === this.cur));

      const fill = () => {
        const year    = m.award_year || m.year || "";
        const title   = m.title || "";
        const atype   = m.award_type || "Award";
        const wins    = parseInt(m.award_count || m.wins || 1) || 1;
        const wlabel  = wins + " Academy Award" + (wins !== 1 ? "s" : "");
        const cats    = (m.award_category || m.categories || m.award_categories || "").trim();
        const genre   = (m.genres || "").split(",").slice(0, 2).join(" · ");
        const rating  = parseFloat(m.vote_average || 0).toFixed(1);
        const dir     = m.director ? "Dir. " + m.director : "";
        const castStr = (m.cast || "").split(",").slice(0, 3).map(s => s.trim()).join(" · ");

        document.getElementById("tm-dyr").textContent  = year;
        document.getElementById("tm-dttl").textContent = title;
        document.getElementById("tm-dbdg").innerHTML   = `⭐ ${/oscar/i.test(atype) ? wlabel : atype}`;
        document.getElementById("tm-dmeta").textContent =
          [dir, castStr || genre, rating > 0 ? "★ " + rating : ""].filter(Boolean).join("  ·  ");
        document.getElementById("tm-dawd").textContent = cats;
      };

      if (anim) {
        this.diEl.classList.add("out");
        setTimeout(() => { fill(); this.diEl.classList.remove("out"); }, 240);
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
      this._schedulePosters(this.cur);
      if (changed || anim) this._refresh(true); else this._refresh();
    }

    /* ── events ── */
    _bindEvents() {
      const GAP = 236;

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

      this.vp.addEventListener("touchstart", e => {
        this.dsx = e.touches[0].clientX; this.dsi = this.cur; this.live = this.cur;
      }, { passive: true });
      this.vp.addEventListener("touchmove", e => {
        this.live = Math.max(0, Math.min(this.movies.length - 1, this.dsi + (this.dsx - e.touches[0].clientX) / GAP));
        this._pose(this.live);
      }, { passive: true });
      this.vp.addEventListener("touchend", () => this._snap(this.live));

      let wt = 0;
      this.vp.addEventListener("wheel", e => {
        e.preventDefault();
        const now = Date.now(); if (now - wt < 280) return; wt = now;
        (e.deltaX || e.deltaY) > 0 ? this.go(1) : this.go(-1);
      }, { passive: false });

      document.getElementById("tm-prev").addEventListener("click", () => this.go(-1));
      document.getElementById("tm-next").addEventListener("click", () => this.go(1));
    }
  }

})();
