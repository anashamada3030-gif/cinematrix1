/**
 * CinaMatrix — 3D Cinema Time Machine
 * Drop-in enhancement for timemachine3d.js
 *
 * HOW TO USE:
 *   1. Place this file next to index.html
 *   2. Add <script src="timemachine3d.js"></script> just before </body>
 *   3. The script waits for DATA to be ready, then hijacks the timemachine page.
 *
 * FEATURES:
 *   • True 3D tunnel effect rendered on Canvas (no Three.js needed)
 *   • Arrow keys ← → navigate movie by movie through time
 *   • Click on-screen arrows to navigate
 *   • Smooth animated transitions with depth / parallax
 *   • Golden Globe fix — reads ALL award_type values and falls back gracefully
 *   • Poster images rendered on 3D cards with fallback emoji
 *   • Keyboard shortcut hint shown on load
 *   • Particle / star-field layer
 */

(function () {
  "use strict";

  /* ─────────────────────────────────────────────
     1.  WAIT FOR DATA & PAGE HOOKS
  ───────────────────────────────────────────── */
  let TM = null; // singleton

  function maybeInit() {
    if (TM) return;
    if (typeof DATA === "undefined" || !DATA.awards || !DATA.awards.length) return;
    patchSetTlMode();
    hookNavigation();
  }

  // Poll until DATA is ready
  const _poll = setInterval(() => {
    maybeInit();
    if (TM) clearInterval(_poll);
  }, 200);

  /* ─────────────────────────────────────────────
     2.  PATCH setTlMode so our version runs
  ───────────────────────────────────────────── */
  function patchSetTlMode() {
    // Override the global
    window.setTlMode = function (mode, el) {
      document.querySelectorAll(".tl-mode-btn").forEach((b) =>
        b.classList.remove("active")
      );
      el.classList.add("active");
      if (TM) TM.setMode(mode);
    };

    // If the time machine page is already active, init now
    if (document.getElementById("page-timemachine")?.classList.contains("active")) {
      bootTM();
    }
  }

  /* ─────────────────────────────────────────────
     3.  HOOK NAVIGATION — run when user visits the page
  ───────────────────────────────────────────── */
  function hookNavigation() {
    const _origNav = window.nav;
    window.nav = function (page, el) {
      _origNav(page, el);
      if (page === "timemachine") {
        // Give DOM a tick to show the page
        setTimeout(bootTM, 60);
      }
    };
  }

  /* ─────────────────────────────────────────────
     4.  BOOT — replace the canvas with our 3D engine
  ───────────────────────────────────────────── */
  function bootTM() {
    if (TM) { TM.resize(); return; }

    const wrap = document.getElementById("timeline-canvas-wrap");
    if (!wrap) return;

    // Replace old canvas
    wrap.innerHTML = "";
    wrap.style.position = "relative";
    wrap.style.overflow = "hidden";
    wrap.style.height = "480px";
    wrap.style.background = "radial-gradient(ellipse at 50% 60%,#0b0e1a,#020306)";

    const canvas = document.createElement("canvas");
    canvas.id = "tm3d-canvas";
    canvas.style.cssText = "width:100%;height:100%;display:block;";
    wrap.appendChild(canvas);

    // Overlay UI
    const ui = buildUI();
    wrap.appendChild(ui.root);

    TM = new TimeMachine3D(canvas, ui);
    TM.setMode("Oscar");

    // Keyboard
    document.addEventListener("keydown", onKey);

    // Replace scroll hint
    const hint = document.querySelector(".tl-scroll-hint");
    if (hint) hint.textContent = "← → Arrow keys  •  Click arrows  •  Click a card to open";
  }

  /* ─────────────────────────────────────────────
     5.  BUILD OVERLAY UI (arrows + info panel)
  ───────────────────────────────────────────── */
  function buildUI() {
    const root = document.createElement("div");
    root.style.cssText =
      "position:absolute;inset:0;pointer-events:none;display:flex;flex-direction:column;justify-content:space-between;";

    // Top bar: year + title
    const top = document.createElement("div");
    top.style.cssText =
      "padding:22px 32px;display:flex;align-items:flex-end;gap:20px;background:linear-gradient(to bottom,rgba(8,11,18,0.8),transparent)";

    const yearEl = document.createElement("div");
    yearEl.id = "tm3d-year";
    yearEl.style.cssText =
      "font-family:'Cinzel',serif;font-size:52px;color:#C9A84C;line-height:1;text-shadow:0 0 40px rgba(201,168,76,0.5);";
    yearEl.textContent = "—";

    const titleWrap = document.createElement("div");
    titleWrap.style.cssText = "padding-bottom:6px";

    const titleEl = document.createElement("div");
    titleEl.id = "tm3d-title";
    titleEl.style.cssText =
      "font-family:'Cinzel',serif;font-size:18px;color:#fff;margin-bottom:4px;max-width:420px;line-height:1.2";
    titleEl.textContent = "";

    const metaEl = document.createElement("div");
    metaEl.id = "tm3d-meta";
    metaEl.style.cssText = "font-size:12px;color:#8892a8;letter-spacing:1px";
    metaEl.textContent = "";

    titleWrap.appendChild(titleEl);
    titleWrap.appendChild(metaEl);
    top.appendChild(yearEl);
    top.appendChild(titleWrap);
    root.appendChild(top);

    // Bottom bar: arrows + progress dots
    const bottom = document.createElement("div");
    bottom.style.cssText =
      "padding:18px 32px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(to top,rgba(8,11,18,0.85),transparent)";

    const leftBtn = document.createElement("button");
    leftBtn.id = "tm3d-prev";
    leftBtn.textContent = "←";
    leftBtn.style.cssText = arrowBtnStyle();
    leftBtn.style.pointerEvents = "all";

    const dotsEl = document.createElement("div");
    dotsEl.id = "tm3d-dots";
    dotsEl.style.cssText = "display:flex;gap:5px;align-items:center;flex-wrap:wrap;justify-content:center;max-width:60%";

    const rightBtn = document.createElement("button");
    rightBtn.id = "tm3d-next";
    rightBtn.textContent = "→";
    rightBtn.style.cssText = arrowBtnStyle();
    rightBtn.style.pointerEvents = "all";

    bottom.appendChild(leftBtn);
    bottom.appendChild(dotsEl);
    bottom.appendChild(rightBtn);
    root.appendChild(bottom);

    return { root, yearEl, titleEl, metaEl, dotsEl, leftBtn, rightBtn };
  }

  function arrowBtnStyle() {
    return [
      "background:rgba(201,168,76,0.1)",
      "border:1px solid rgba(201,168,76,0.4)",
      "color:#C9A84C",
      "font-size:22px",
      "width:52px",
      "height:52px",
      "border-radius:50%",
      "cursor:pointer",
      "font-family:Outfit,sans-serif",
      "transition:background 0.2s,transform 0.15s",
      "pointer-events:all",
      "display:flex",
      "align-items:center",
      "justify-content:center",
    ].join(";");
  }

  /* ─────────────────────────────────────────────
     6.  KEYBOARD HANDLER
  ───────────────────────────────────────────── */
  function onKey(e) {
    if (!TM) return;
    const page = document.getElementById("page-timemachine");
    if (!page || !page.classList.contains("active")) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); TM.next(); }
    if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   { e.preventDefault(); TM.prev(); }
  }

  /* ─────────────────────────────────────────────
     7.  THE 3D ENGINE
  ───────────────────────────────────────────── */

  /**
   * TimeMachine3D
   * Renders a perspective tunnel of movie cards.
   * Current card = front/centre, past = receding left, future = receding right.
   */
  class TimeMachine3D {
    constructor(canvas, ui) {
      this.canvas = canvas;
      this.ctx    = canvas.getContext("2d");
      this.ui     = ui;

      this.movies  = [];
      this.current = 0;        // index of focused movie
      this.anim    = 0;        // 0-1 transition progress
      this.animDir = 1;        // +1 = forward, -1 = backward
      this.animTarget = 0;
      this.animRAF = null;

      this.stars   = buildStars(220);
      this.imgCache = {};       // url → HTMLImageElement
      this.mode    = "Oscar";

      this._ro = new ResizeObserver(() => this.resize());
      this._ro.observe(canvas.parentElement);

      // Button clicks
      ui.leftBtn.addEventListener("click",  () => this.prev());
      ui.rightBtn.addEventListener("click", () => this.next());

      // Canvas click → open movie
      canvas.style.cursor = "pointer";
      canvas.addEventListener("click", (e) => this.handleClick(e));

      this.resize();
    }

    /* ── data ── */
    setMode(mode) {
      this.mode = mode;

      // FIX: Normalise award_type comparison — trim & lowercase
      const raw = (DATA.awards || []).filter((a) => {
        const t = (a.award_type || "").trim();
        if (mode === "Oscar")       return /oscar/i.test(t);
        if (mode === "GoldenGlobe") return /golden/i.test(t) || /globe/i.test(t);
        return true;
      });

      this.movies = raw
        .slice() // don't mutate original
        .sort((a, b) => {
          const ya = +(a.award_year || a.year || 0);
          const yb = +(b.award_year || b.year || 0);
          return ya - yb;
        });

      // Debug log so you can see what's loaded
      console.log(
        `[TM3D] mode=${mode} → ${this.movies.length} movies`,
        this.movies.map((m) => `${m.award_year||m.year} ${m.title}`)
      );

      this.current = Math.max(0, this.movies.length - 1); // start at latest
      this.anim = 0;
      this.updateUI();
      this.preloadImages();
      this.draw();
    }

    /* ── navigation ── */
    goto(idx) {
      if (!this.movies.length) return;
      const clamped = Math.max(0, Math.min(this.movies.length - 1, idx));
      if (clamped === this.current) return;
      this.animDir = clamped > this.current ? 1 : -1;
      this.animTarget = clamped;
      this.startAnim();
    }

    next() { this.goto(this.current + 1); }
    prev() { this.goto(this.current - 1); }

    startAnim() {
      if (this.animRAF) cancelAnimationFrame(this.animRAF);
      const start = performance.now();
      const FROM = this.current;
      const TO   = this.animTarget;
      const DURATION = 420;

      const tick = (now) => {
        const t = Math.min(1, (now - start) / DURATION);
        const eased = easeInOut(t);
        this.anim = eased;
        this.drawAnimated(FROM, TO, eased);

        if (t < 1) {
          this.animRAF = requestAnimationFrame(tick);
        } else {
          this.current = TO;
          this.anim = 0;
          this.animRAF = null;
          this.updateUI();
          this.draw();
        }
      };
      this.animRAF = requestAnimationFrame(tick);
    }

    /* ── canvas size ── */
    resize() {
      const w = this.canvas.parentElement.offsetWidth;
      const h = 480;
      this.canvas.width  = w * (window.devicePixelRatio || 1);
      this.canvas.height = h * (window.devicePixelRatio || 1);
      this.canvas.style.width  = w + "px";
      this.canvas.style.height = h + "px";
      this.ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
      this.W = w; this.H = h;
      this.draw();
    }

    /* ── image cache ── */
    preloadImages() {
      this.movies.forEach((m) => {
        const url = m.poster_url;
        if (!url || this.imgCache[url]) return;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload  = () => { this.imgCache[url] = img; this.draw(); };
        img.onerror = () => { this.imgCache[url] = null; };
        img.src = url;
      });
    }

    /* ── UI sync ── */
    updateUI() {
      const m = this.movies[this.current];
      if (!m) {
        this.ui.yearEl.textContent  = "—";
        this.ui.titleEl.textContent = this.movies.length
          ? "No data for this mode"
          : "Loading…";
        this.ui.metaEl.textContent = "";
        return;
      }

      this.ui.yearEl.textContent  = m.award_year || m.year || "";
      this.ui.titleEl.textContent = m.title || "";
      const rating = parseFloat(m.vote_average || 0).toFixed(1);
      const genres = (m.genres || "").split(",").slice(0, 2).join(" · ");
      this.ui.metaEl.textContent  = `★ ${rating}  ·  ${genres}  ·  ${m.award_type || ""}`;

      // Dots
      const dots = this.ui.dotsEl;
      dots.innerHTML = "";
      const show = Math.min(this.movies.length, 30);
      const step = Math.max(1, Math.floor(this.movies.length / show));
      for (let i = 0; i < this.movies.length; i += step) {
        const d = document.createElement("div");
        const active = i === this.current;
        d.style.cssText = `width:${active ? 20 : 6}px;height:6px;border-radius:3px;background:${active ? "#C9A84C" : "rgba(201,168,76,0.25)"};transition:all 0.3s;cursor:pointer;pointer-events:all;flex-shrink:0`;
        const idx = i;
        d.addEventListener("click", () => this.goto(idx));
        dots.appendChild(d);
      }

      // Arrow availability
      this.ui.leftBtn.style.opacity  = this.current > 0 ? "1" : "0.25";
      this.ui.rightBtn.style.opacity = this.current < this.movies.length - 1 ? "1" : "0.25";
    }

    /* ── click → open modal ── */
    handleClick(e) {
      const m = this.movies[this.current];
      if (m && typeof openMovieObj === "function") openMovieObj(m);
    }

    /* ─────────────────────────────────────
       DRAW — static frame
    ───────────────────────────────────── */
    draw() {
      if (!this.W) return;
      this.drawScene(this.current, this.current, 0);
    }

    /* ─────────────────────────────────────
       DRAW — animated between FROM and TO
    ───────────────────────────────────── */
    drawAnimated(from, to, t) {
      this.drawScene(from, to, t);
    }

    /* ─────────────────────────────────────
       SCENE RENDERER
    ───────────────────────────────────── */
    drawScene(from, to, t) {
      const ctx = this.ctx;
      const W = this.W, H = this.H;
      if (!W || !H) return;

      ctx.clearRect(0, 0, W, H);

      // ── Background gradient
      const bg = ctx.createRadialGradient(W/2, H*0.4, 0, W/2, H*0.4, W*0.7);
      bg.addColorStop(0, "#0d1120");
      bg.addColorStop(1, "#020306");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // ── Stars
      drawStars(ctx, this.stars, W, H);

      // ── Tunnel rings
      drawTunnelRings(ctx, W, H);

      // ── Timeline line
      drawTimelineLine(ctx, W, H);

      // ── Calculate which cards to render
      const movies = this.movies;
      if (!movies.length) {
        drawEmptyState(ctx, W, H, this.mode);
        return;
      }

      // Visible range: current ±4
      const VISIBLE = 4;
      const effectiveCurrent = from + (to - from) * t; // fractional position

      // Cards to draw (back to front)
      const indices = [];
      for (let d = -VISIBLE; d <= VISIBLE; d++) {
        const raw = Math.round(effectiveCurrent) + d;
        if (raw >= 0 && raw < movies.length) indices.push(raw);
      }
      // Sort: furthest first
      indices.sort((a, b) => Math.abs(a - effectiveCurrent) - Math.abs(b - effectiveCurrent));
      indices.reverse(); // draw far ones first

      indices.forEach((idx) => {
        const offset = idx - effectiveCurrent; // negative = past, positive = future
        this.drawCard(ctx, movies[idx], offset, W, H);
      });
    }

    /* ─────────────────────────────────────
       SINGLE CARD  — perspective transform
    ───────────────────────────────────── */
    drawCard(ctx, m, offset, W, H) {
      const CX = W / 2;
      const CY = H * 0.46;

      // Perspective depth: cards far from centre shrink & shift
      const absOff   = Math.abs(offset);
      const depth    = 1 / (1 + absOff * 0.55);   // 1 = front, <1 = receding
      const side     = Math.sign(offset);

      const CARD_W   = 160 * depth;
      const CARD_H   = CARD_W * 1.5;
      const SPREAD   = 240;                         // horizontal spread
      const cx       = CX + side * absOff * SPREAD * depth * 0.95;
      const cy       = CY - CARD_H / 2 + absOff * 4 * depth;

      const alpha    = depth * depth;               // fade distant cards
      const isActive = absOff < 0.05;

      ctx.save();
      ctx.globalAlpha = alpha;

      // Shadow / glow for active
      if (isActive) {
        ctx.shadowColor  = "rgba(201,168,76,0.6)";
        ctx.shadowBlur   = 40;
      } else {
        ctx.shadowColor  = "rgba(0,0,0,0.8)";
        ctx.shadowBlur   = 20;
      }

      // Card background
      ctx.fillStyle = isActive ? "#1a1f30" : "#111520";
      roundRectFill(ctx, cx - CARD_W/2, cy, CARD_W, CARD_H, 8 * depth);

      // Border
      ctx.shadowBlur = 0;
      ctx.strokeStyle = isActive
        ? `rgba(201,168,76,${0.8})`
        : `rgba(255,255,255,${0.06 * depth})`;
      ctx.lineWidth = isActive ? 1.5 : 1;
      roundRectStroke(ctx, cx - CARD_W/2, cy, CARD_W, CARD_H, 8 * depth);

      // Poster area (top 66%)
      const POSTER_H = CARD_H * 0.68;
      const url = m.poster_url || "";
      const img = this.imgCache[url];

      ctx.save();
      roundRectClip(ctx, cx - CARD_W/2, cy, CARD_W, POSTER_H, 8 * depth);
      if (img) {
        ctx.drawImage(img, cx - CARD_W/2, cy, CARD_W, POSTER_H);
      } else {
        // Placeholder gradient
        const grad = ctx.createLinearGradient(cx - CARD_W/2, cy, cx + CARD_W/2, cy + POSTER_H);
        grad.addColorStop(0, "#1a2035");
        grad.addColorStop(1, "#0d1018");
        ctx.fillStyle = grad;
        ctx.fillRect(cx - CARD_W/2, cy, CARD_W, POSTER_H);
        // Emoji
        ctx.font = `${CARD_W * 0.35}px serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillText("🎬", cx, cy + POSTER_H * 0.55);
      }
      ctx.restore();

      // Text area
      const textY  = cy + POSTER_H + 6;
      const lineH  = Math.max(10, CARD_H * 0.08);

      // Year badge
      if (isActive) {
        ctx.fillStyle = "rgba(201,168,76,0.2)";
        ctx.beginPath();
        ctx.roundRect(cx - CARD_W/2 + 6, textY, CARD_W*0.44, lineH*0.85, 3);
        ctx.fill();
      }
      ctx.font      = `bold ${Math.max(8, 10 * depth)}px Outfit,sans-serif`;
      ctx.fillStyle = isActive ? "#C9A84C" : "rgba(201,168,76,0.5)";
      ctx.textAlign = "left";
      ctx.fillText(
        (m.award_year || m.year || "?"),
        cx - CARD_W/2 + 10,
        textY + lineH * 0.65
      );

      // Title
      const title = (m.title || "").slice(0, 22) + ((m.title||"").length > 22 ? "…" : "");
      ctx.font      = `${Math.max(7, 9 * depth)}px Outfit,sans-serif`;
      ctx.fillStyle = isActive ? "#dde3f0" : "rgba(221,227,240,0.55)";
      ctx.fillText(title, cx - CARD_W/2 + 6, textY + lineH * 1.75);

      // Rating
      const rating = parseFloat(m.vote_average || 0).toFixed(1);
      ctx.font      = `bold ${Math.max(8, 11 * depth)}px Outfit,sans-serif`;
      ctx.fillStyle = isActive ? "#C9A84C" : "rgba(201,168,76,0.4)";
      ctx.textAlign = "right";
      ctx.fillText("★ " + rating, cx + CARD_W/2 - 6, textY + lineH * 1.75);

      // Active indicator ring
      if (isActive) {
        ctx.strokeStyle = "rgba(201,168,76,0.25)";
        ctx.lineWidth   = 1;
        ctx.setLineDash([4, 4]);
        roundRectStroke(ctx, cx - CARD_W/2 - 4, cy - 4, CARD_W + 8, CARD_H + 8, 11);
        ctx.setLineDash([]);
      }

      ctx.restore();
    }
  }

  /* ─────────────────────────────────────────────
     8. HELPERS — stars, tunnel, etc.
  ───────────────────────────────────────────── */

  function buildStars(n) {
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.2 + 0.2,
        a: Math.random() * 0.7 + 0.1,
      });
    }
    return arr;
  }

  function drawStars(ctx, stars, W, H) {
    stars.forEach((s) => {
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.a})`;
      ctx.fill();
    });
  }

  function drawTunnelRings(ctx, W, H) {
    const CX = W / 2, CY = H * 0.46;
    for (let i = 1; i <= 5; i++) {
      const rw = i * W * 0.14;
      const rh = i * H * 0.1;
      ctx.strokeStyle = `rgba(201,168,76,${0.04 * (6 - i)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(CX, CY, rw, rh, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawTimelineLine(ctx, W, H) {
    const y = H * 0.85;
    const grad = ctx.createLinearGradient(0, y, W, y);
    grad.addColorStop(0,   "transparent");
    grad.addColorStop(0.2, "rgba(201,168,76,0.4)");
    grad.addColorStop(0.8, "rgba(201,168,76,0.4)");
    grad.addColorStop(1,   "transparent");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y); ctx.lineTo(W, y);
    ctx.stroke();
  }

  function drawEmptyState(ctx, W, H, mode) {
    ctx.font      = "48px serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillText("🏆", W/2, H/2 - 20);
    ctx.font      = "14px Outfit,sans-serif";
    ctx.fillStyle = "#505878";
    ctx.fillText(`No ${mode} data found`, W/2, H/2 + 30);
    // Debug: show what award_type values exist
    const types = [...new Set((DATA.awards || []).map(a => (a.award_type || "").trim()))];
    ctx.font = "11px Outfit,sans-serif";
    ctx.fillStyle = "#C9A84C";
    ctx.fillText("Award types in data: " + types.join(", "), W/2, H/2 + 55);
  }

  /* ── canvas path helpers ── */
  function roundRectFill(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }

  function roundRectStroke(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.stroke();
  }

  function roundRectClip(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.clip();
  }

  /* ── easing ── */
  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

})();
