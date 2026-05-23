/**
 * CinaMatrix — Time Machine (Oscar Timeline Edition)
 * DOM-based CSS 3D carousel, matching oscar-timeline-3d.html exactly.
 * Replaces the slow canvas renderer with native <img> elements for instant posters.
 */
(function () {
  "use strict";

  /* ─── 1. INJECT STYLES ─── */
  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Raleway:wght@300;400;500;600&display=swap');

    #tm-root {
      position:relative; width:100%; height:100%;
      display:flex; flex-direction:column; overflow:hidden;
      background:#03030A;
      background-image:
        radial-gradient(ellipse 70% 40% at 50% 0%, rgba(201,162,39,.07) 0%, transparent 70%),
        radial-gradient(ellipse 100% 60% at 50% 100%, rgba(10,10,40,.8) 0%, transparent 70%);
      font-family:'Raleway',sans-serif;
      border-radius: inherit;
    }
    #tm-root::before {
      content:''; position:absolute; inset:0; pointer-events:none; z-index:9;
      opacity:.12;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }

    /* VIEWPORT */
    #tm-vp {
      flex:1; position:relative; min-height:0;
      perspective:1300px; perspective-origin:50% 50%;
      cursor:grab; overflow:hidden;
    }
    #tm-vp.tm-drag { cursor:grabbing; }
    #tm-track {
      position:relative; width:100%; height:100%;
      transform-style:preserve-3d;
    }

    /* CARD */
    .tm-card {
      position:absolute;
      width:180px; height:270px;
      left:50%; top:50%;
      margin-left:-90px; margin-top:-135px;
      border-radius:10px; overflow:hidden;
      border:1px solid rgba(255,255,255,.05);
      transition: transform .5s cubic-bezier(.25,.46,.45,.94),
                  opacity .5s ease, box-shadow .5s ease;
      cursor:pointer;
    }
    .tm-card.tm-act {
      box-shadow: 0 0 50px rgba(201,162,39,.22), 0 25px 60px rgba(0,0,0,.7);
      border-color: rgba(201,162,39,.35);
    }
    .tm-card.tm-live { transition:none; }
    .tm-card-img {
      display:none; position:absolute; inset:0;
      width:100%; height:100%; object-fit:cover;
    }
    .tm-card-img.loaded { display:block; }
    .tm-card-fb {
      position:absolute; inset:0;
      display:flex; flex-direction:column; justify-content:flex-end;
      padding:1rem;
    }
    .tm-card-bot {
      position:absolute; bottom:0; left:0; right:0;
      padding:.7rem .9rem;
      background:linear-gradient(to top, rgba(0,0,0,.92) 0%, rgba(0,0,0,.55) 55%, transparent 100%);
    }
    .tm-card-yr {
      font-family:'Cinzel',serif; font-size:.55rem;
      letter-spacing:.25em; color:#C9A227; display:block; margin-bottom:.15rem;
    }
    .tm-card-ttl {
      font-family:'Cinzel',serif; font-size:.68rem;
      font-weight:600; color:#fff; line-height:1.3; display:block;
    }

    /* NAV */
    #tm-nav {
      display:flex; align-items:center; gap:1rem;
      justify-content:center; padding:.5rem 0;
      flex-shrink:0; position:relative; z-index:10;
    }
    .tm-nav-btn {
      width:34px; height:34px; border-radius:50%;
      border:1px solid rgba(201,162,39,.3); background:transparent;
      color:#C9A227; font-size:1rem; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
      transition:all .2s;
    }
    .tm-nav-btn:hover { background:rgba(201,162,39,.12); border-color:#C9A227; }
    #tm-cnt {
      font-family:'Cinzel',serif; font-size:.62rem;
      color:#8A8A9A; letter-spacing:.12em; min-width:44px; text-align:center;
    }

    /* DOTS */
    #tm-dots {
      display:flex; justify-content:center; gap:5px;
      padding:.3rem 1rem; flex-wrap:wrap;
      max-width:500px; margin:0 auto;
      flex-shrink:0; position:relative; z-index:10;
    }
    .tm-dot {
      width:5px; height:5px; border-radius:50%;
      background:rgba(255,255,255,.1); cursor:pointer;
      transition:all .3s; flex-shrink:0;
    }
    .tm-dot.on { background:#C9A227; transform:scale(1.6); }

    /* DETAIL */
    #tm-detail {
      padding:.6rem 2rem .8rem; text-align:center;
      flex-shrink:0; position:relative; z-index:10;
    }
    #tm-di { transition:opacity .28s ease, transform .28s ease; }
    #tm-di.out { opacity:0; transform:translateY(7px); }
    #tm-dyr {
      font-family:'Cinzel',serif; font-size:.58rem;
      letter-spacing:.4em; color:#C9A227; margin-bottom:.25rem;
    }
    #tm-dttl {
      font-family:'Cinzel',serif; font-size:1.3rem;
      font-weight:900; color:#F0EDE6; line-height:1.2; margin-bottom:.3rem;
    }
    #tm-dbdg {
      display:inline-flex; align-items:center; gap:.35rem;
      background:rgba(201,162,39,.1); border:1px solid rgba(201,162,39,.28);
      border-radius:20px; padding:.2rem .8rem;
      font-family:'Cinzel',serif; font-size:.6rem; letter-spacing:.08em;
      color:#C9A227; margin-bottom:.3rem;
    }
    #tm-dmeta { font-size:.72rem; color:#8A8A9A; letter-spacing:.04em; margin-bottom:.2rem; }
    #tm-dawd {
      font-size:.68rem; color:rgba(232,197,71,.65);
      font-style:italic; line-height:1.6;
      max-width:520px; margin:0 auto;
    }

    /* PROGRESS */
    #tm-prog-bar {
      height:2px; background:rgba(255,255,255,.04);
      flex-shrink:0; position:relative; z-index:10;
    }
    #tm-prog-fill { height:100%; background:#C9A227; transition:width .4s ease; width:0%; }
  `;
  const styleEl = document.createElement("style");
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  /* ─── 2. POLL FOR DATA ─── */
  let TM = null;
  const _poll = setInterval(() => {
    if (TM) { clearInterval(_poll); return; }
    if (typeof DATA === "undefined" || !DATA.awards || !DATA.awards.length) return;
    patchNav();
    patchSetTlMode();
    clearInterval(_poll);
  }, 200);

  /* ─── 3. PATCH window.nav ─── */
  function patchNav() {
    const _orig = window.nav;
    window.nav = function (page, el) {
      _orig(page, el);
      if (page === "timemachine") setTimeout(boot, 60);
    };
  }

  /* ─── 4. PATCH setTlMode ─── */
  function patchSetTlMode() {
    window.setTlMode = function (mode, el) {
      document.querySelectorAll(".tl-mode-btn").forEach(b => b.classList.remove("active"));
      el.classList.add("active");
      if (TM) TM.setMode(mode);
    };
    // If page already active on load
    if (document.getElementById("page-timemachine")?.classList.contains("active")) {
      setTimeout(boot, 60);
    }
  }

  /* ─── 5. BOOT ─── */
  function boot() {
    if (TM) { TM.resize(); return; }
    const wrap = document.getElementById("timeline-canvas-wrap");
    if (!wrap) return;

    // Build DOM
    wrap.style.cssText += ";overflow:visible;height:auto;min-height:280px;flex:1;";
    wrap.innerHTML = `
      <div id="tm-root">
        <div id="tm-vp"><div id="tm-track"></div></div>
        <div id="tm-nav">
          <button class="tm-nav-btn" id="tm-prev">&#8592;</button>
          <div id="tm-cnt">1 / 0</div>
          <button class="tm-nav-btn" id="tm-next">&#8594;</button>
        </div>
        <div style="display:flex;justify-content:center;z-index:10;position:relative;">
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
        <div id="tm-prog-bar"><div id="tm-prog-fill"></div></div>
      </div>`;

    // Override scroll hint
    const hint = document.querySelector(".tl-scroll-hint");
    if (hint) hint.textContent = "← → keys  •  click arrows  •  drag  •  click to open";

    TM = new OscarCarousel();
    TM.setMode("Oscar");

    document.addEventListener("keydown", e => {
      const pg = document.getElementById("page-timemachine");
      if (!pg?.classList.contains("active")) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); TM.go(1); }
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   { e.preventDefault(); TM.go(-1); }
    });
  }

  /* ─── 6. CAROUSEL CLASS ─── */
  class OscarCarousel {
    constructor() {
      this.movies = [];
      this.cur    = 0;
      this.live   = 0;
      this.dragging = false;
      this.dsx = 0; this.dsi = 0;

      this.vp     = document.getElementById("tm-vp");
      this.track  = document.getElementById("tm-track");
      this.dotsEl = document.getElementById("tm-dots");
      this.cntEl  = document.getElementById("tm-cnt");
      this.diEl   = document.getElementById("tm-di");
      this.progEl = document.getElementById("tm-prog-fill");

      this._bindEvents();
    }

    /* ── data ── */
    setMode(mode) {
      this.mode = mode;
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

    go(d) { this._snap(this.cur + d, true); }

    /* ── build DOM cards ── */
    _build() {
      this.track.innerHTML = "";
      this.dotsEl.innerHTML = "";

      // Palette per-card based on index (like oscar timeline)
      const PALETTES = [
        ["#1a1035","#06020f"],["#0e1f3d","#020b1a"],["#1d0e0e","#0a0202"],
        ["#0d1f18","#020a06"],["#1a160a","#080601"],["#0d0d28","#03030f"],
      ];

      this.movies.forEach((m, i) => {
        const pal = PALETTES[i % PALETTES.length];
        const card = document.createElement("div");
        card.className = "tm-card";
        card.dataset.i = i;

        const stars = "★".repeat(Math.min(Math.round(+(m.vote_average || 0) / 2), 5));
        const year  = m.award_year || m.year || "?";
        const title = m.title || "";
        const dir   = m.director || "";

        card.innerHTML = `
          <img class="tm-card-img" alt="${title.replace(/"/g,'&quot;')}" loading="lazy">
          <div class="tm-card-fb" style="background:linear-gradient(160deg,${pal[0]} 0%,${pal[1]} 100%);">
            <div style="font-family:'Cinzel',serif;font-size:.55rem;letter-spacing:.22em;color:#C9A227;margin-bottom:.2rem;">${year}</div>
            <div style="font-family:'Cinzel',serif;font-size:.75rem;font-weight:700;color:#fff;line-height:1.3;">${title}</div>
            <div style="font-size:.58rem;color:rgba(255,255,255,.4);margin-top:.2rem;">${dir}</div>
            <div style="margin-top:.4rem;color:#C9A227;font-size:.6rem;">${stars}</div>
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

        // Smart poster loading: eager for current±3, lazy for rest
        this._loadPoster(card, m, i, this.cur);

        // Dot
        const dot = document.createElement("div");
        dot.className = "tm-dot" + (i === this.cur ? " on" : "");
        dot.addEventListener("click", () => this._snap(i));
        this.dotsEl.appendChild(dot);
      });

      this._pose(this.cur);
      this._refresh();
    }

    /* ── smart poster loading ── */
    _loadPoster(card, m, idx, currentIdx) {
      const url = m.poster_url;
      if (!url) return;
      const img = card.querySelector(".tm-card-img");

      const doLoad = () => {
        img.onload  = () => {
          img.classList.add("loaded");
          card.querySelector(".tm-card-fb").style.display = "none";
        };
        img.onerror = () => {};
        img.src = url;
      };

      const dist = Math.abs(idx - currentIdx);
      if (dist <= 3) {
        // Eager: load immediately
        doLoad();
      } else {
        // Lazy: load when scrolled near
        const obs = new IntersectionObserver(entries => {
          if (entries[0].isIntersecting) { doLoad(); obs.disconnect(); }
        }, { root: this.vp, rootMargin: "0px", threshold: 0.01 });
        obs.observe(card);
      }
    }

    /* ── reload nearby posters after navigation ── */
    _loadNearbyPosters(cur) {
      const cards = Array.from(this.track.querySelectorAll(".tm-card"));
      cards.forEach((card, i) => {
        const img = card.querySelector(".tm-card-img");
        if (img.src) return; // already loading/loaded
        const dist = Math.abs(i - cur);
        if (dist <= 3) {
          const m = this.movies[i];
          if (m?.poster_url) {
            img.onload  = () => { img.classList.add("loaded"); card.querySelector(".tm-card-fb").style.display = "none"; };
            img.onerror = () => {};
            img.src = m.poster_url;
          }
        }
      });
    }

    /* ── CSS 3D positioning ── */
    _pose(idx) {
      const GAP = 230, TZ = 90, RY = 22, SC = 0.82, OP = 0.22, MAX = 4;
      const cards = this.track.querySelectorAll(".tm-card");
      cards.forEach((c, i) => {
        const off = i - idx, ab = Math.abs(off);
        if (ab > MAX) { c.style.opacity = "0"; c.style.pointerEvents = "none"; return; }
        const tx = off * GAP;
        const tz = -ab * TZ;
        const ry = -off * RY;
        const sc = Math.pow(SC, ab);
        const op = Math.max(.06, 1 - ab * OP);
        c.style.transform = `translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg) scale(${sc})`;
        c.style.opacity = op;
        c.style.zIndex  = 100 - Math.floor(ab * 12);
        c.style.pointerEvents = ab > 2 ? "none" : "auto";
        c.classList.toggle("tm-act",  Math.round(idx) === i);
        c.classList.toggle("tm-live", this.dragging);
      });
    }

    /* ── refresh UI text ── */
    _refresh(anim) {
      const m = this.movies[this.cur];
      if (!m) return;

      this.cntEl.textContent = `${this.cur + 1} / ${this.movies.length}`;
      const pct = this.movies.length > 1
        ? ((this.cur / (this.movies.length - 1)) * 100).toFixed(1)
        : "100";
      this.progEl.style.width = pct + "%";

      this.dotsEl.querySelectorAll(".tm-dot").forEach((d, i) =>
        d.classList.toggle("on", i === this.cur)
      );

      const fill = () => {
        const year   = m.award_year || m.year || "";
        const title  = m.title || "";
        const awards = +(m.vote_average || 0);
        const genre  = (m.genres || "").split(",").slice(0,2).join(" · ");
        const cat    = m.award_category || m.award_type || "";
        const dir    = m.director || "";
        const rating = parseFloat(awards).toFixed(1);

        document.getElementById("tm-dyr").textContent  = year;
        document.getElementById("tm-dttl").textContent = title;
        document.getElementById("tm-dbdg").innerHTML   = `⭐ ${cat || m.award_type || "Best Picture"}`;
        document.getElementById("tm-dmeta").textContent =
          [dir ? "Dir. " + dir : "", genre, rating > 0 ? "★ " + rating : ""].filter(Boolean).join("  ·  ");
        document.getElementById("tm-dawd").textContent = m.award_category || "";
      };

      if (anim) {
        this.diEl.classList.add("out");
        setTimeout(() => { fill(); this.diEl.classList.remove("out"); }, 240);
      } else {
        fill();
      }
    }

    /* ── snap to index ── */
    _snap(i, anim) {
      const ni = Math.max(0, Math.min(this.movies.length - 1, Math.round(i)));
      const changed = ni !== this.cur;
      this.cur = ni; this.live = ni;
      this.dragging = false;
      this.vp.classList.remove("tm-drag");
      this._pose(this.cur);
      this._loadNearbyPosters(this.cur);
      if (changed || anim) this._refresh(true); else this._refresh();
    }

    /* ── drag / touch / wheel ── */
    _bindEvents() {
      const GAP = () => 230;

      // Mouse drag
      this.vp.addEventListener("mousedown", e => {
        this.dragging = true;
        this.dsx = e.clientX; this.dsi = this.cur; this.live = this.cur;
        this.vp.classList.add("tm-drag");
      });
      document.addEventListener("mousemove", e => {
        if (!this.dragging) return;
        const d = (this.dsx - e.clientX) / GAP();
        this.live = Math.max(0, Math.min(this.movies.length - 1, this.dsi + d));
        this._pose(this.live);
      });
      document.addEventListener("mouseup", () => {
        if (!this.dragging) return;
        this._snap(this.live);
      });

      // Touch
      this.vp.addEventListener("touchstart", e => {
        this.dsx = e.touches[0].clientX; this.dsi = this.cur; this.live = this.cur;
      }, { passive: true });
      this.vp.addEventListener("touchmove", e => {
        const d = (this.dsx - e.touches[0].clientX) / GAP();
        this.live = Math.max(0, Math.min(this.movies.length - 1, this.dsi + d));
        this._pose(this.live);
      }, { passive: true });
      this.vp.addEventListener("touchend", () => this._snap(this.live));

      // Wheel
      let wdeb = 0;
      this.vp.addEventListener("wheel", e => {
        e.preventDefault();
        const now = Date.now();
        if (now - wdeb < 280) return; wdeb = now;
        const d = e.deltaX || e.deltaY;
        if (d > 10) this.go(1); else if (d < -10) this.go(-1);
      }, { passive: false });

      // Nav buttons
      document.getElementById("tm-prev").addEventListener("click", () => this.go(-1));
      document.getElementById("tm-next").addEventListener("click", () => this.go(1));
    }
  }

})();
