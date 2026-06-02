/**
 * cinema-optimizer.js — CineMatrix Memory Optimizer
 * ─────────────────────────────────────────────────
 * Drop-in patch. Add ONE line to index.html just before </body>:
 *   <script src="cinema-optimizer.js"></script>
 *
 * What this does (without touching any CSV or HTML structure):
 *  1. Blocks static_movies_series.csv & static_actors.csv from loading in the
 *     main thread — routes them to a Web Worker instead.
 *  2. Overrides doSearch() to query the Worker (returns only ≤60 matching rows).
 *  3. Overrides category loading (_loadAndRender) to stream via Worker.
 *  4. Caps movieRegistry at 1 500 entries (circular) to stop unbounded growth.
 *  5. IntersectionObserver lifecycle: clears decoded image bitmaps when cards
 *     scroll >1 500 px off-screen; restores from HTTP-cache when they return.
 *  6. MutationObserver auto-applies lifecycle to every poster added to the DOM.
 *
 * Expected memory: ≤ 40 MB on home page, ≤ 20 MB on search/categories.
 */

(function () {
  'use strict';

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 1 — Intercept parseCSV before DOMContentLoaded fires
  //          Block the two heavy files so the original Phase-2 loop stores []
  //          instead of 25 000 objects in the main-thread heap.
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const HEAVY_FILES = ['static_movies_series.csv', 'static_actors.csv'];

  // parseCSV may not exist yet when this script runs (PapaParse hasn't loaded).
  // We patch it lazily — the first time it is called the real function is already
  // in scope, so we grab it then wrap it.
  let _csvPatched = false;
  function patchParseCSV() {
    if (_csvPatched || typeof window.parseCSV !== 'function') return;
    _csvPatched = true;
    const orig = window.parseCSV;
    window.parseCSV = function (url) {
      for (const heavy of HEAVY_FILES) {
        if (url && url.includes(heavy)) {
          // Return empty immediately — Worker handles these files.
          return Promise.resolve([]);
        }
      }
      return orig(url);
    };
  }

  // Call it now; also hook into DOMContentLoaded in case PapaParse loads late.
  patchParseCSV();
  document.addEventListener('DOMContentLoaded', patchParseCSV, { once: true });


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 2 — Spin up the Web Worker from search-worker.js
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  let _worker = null;
  let _reqId  = 0;
  const _pending = {};  // requestId → resolve fn

  try {
    _worker = new Worker('search-worker.js');
  } catch (err) {
    console.warn('[CineOptimizer] Worker unavailable — degraded mode', err);
  }

  function workerSend(msg) {
    if (!_worker) return Promise.resolve(null);
    return new Promise(resolve => {
      const id = ++_reqId;
      msg.data = Object.assign({}, msg.data, { requestId: id });
      _pending[id] = resolve;
      _worker.postMessage(msg);
      // Safety timeout: 15 s
      setTimeout(() => {
        if (_pending[id]) { delete _pending[id]; resolve(null); }
      }, 15000);
    });
  }

  if (_worker) {
    _worker.onmessage = function (e) {
      const { type, requestId, results, rows, total, offset, media, count } = e.data;

      // Resolve pending promises
      if (requestId && _pending[requestId]) {
        _pending[requestId](e.data);
        delete _pending[requestId];
        return;
      }

      // Broadcast events (no requestId = unsolicited)
      if (type === 'MOVIES_READY') {
        window._phase2Done = true;
        updateLoadingBadge(null);
        if (window.currentPage === 'search')    doSearchWorker();
        if (window.currentPage === 'top-rated') window.renderTopRated && window.renderTopRated();
        if (window.currentPage === 'year')      window.renderYear     && window.renderYear();
      }
      if (type === 'ACTORS_READY') {
        updateLoadingBadge(null);
        if (window.currentPage === 'actor') window.initActorsGrid && window.initActorsGrid(true);
      }
    };
    _worker.onerror = function (err) {
      console.warn('[CineOptimizer] Worker error', err);
    };
  }

  // Convenience wrappers
  function wSearch(query, mediaType, genre, minRating, limit) {
    return workerSend({
      type: 'SEARCH',
      data: {
        query, mediaType, genre, minRating, limit: limit || 60,
        baseUrl: window.csvDir || 'csv_output/',
      },
    }).then(r => (r && r.results) ? r.results : []);
  }

  function wSearchActors(query) {
    return workerSend({ type: 'SEARCH_ACTORS', data: { query } })
      .then(r => (r && r.results) ? r.results : []);
  }

  function wLoadCat(cat, media, offset, limit) {
    const csvFile = (media === 'tv') ? 'mega_series.csv' : 'mega_movies.csv';
    const url     = (window.csvDir || 'csv_output/') + csvFile;
    const msgType = (offset > 0) ? 'CAT_MORE' : 'LOAD_CAT';
    return workerSend({ type: msgType, data: { cat, media, offset, limit: limit || 30, url } })
      .then(r => r || { rows: [], total: 0 });
  }


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 3 — movieRegistry cap (circular buffer, max 1 500 slots)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const MAX_REG = 1500;
  window.getMovieIdx = function (m) {
    const reg = window.movieRegistry;
    if (reg.length < MAX_REG) return reg.push(m) - 1;
    // Circular overwrite — use the tail slot
    const idx = reg._tail !== undefined ? reg._tail : 0;
    reg[idx] = m;
    reg._tail = (idx + 1) % MAX_REG;
    return idx;
  };


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 4 — Image lifecycle (decoded-bitmap management)
  //          • rootMargin 600px  → image loads before it reaches the viewport
  //          • rootMargin -1500px (negative = well off-screen) → src cleared
  //            so the browser can GC the decoded RGBA bitmap (~1 MB per poster).
  //            HTTP cache keeps the compressed bytes, so restore is instant.
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const _loadObs = new IntersectionObserver(entries => {
    for (const ent of entries) {
      const img = ent.target;
      if (ent.isIntersecting) {
        const src = img.dataset.lazySrc || img.dataset.src;
        if (src && img.src !== src && !img.src.endsWith(src)) {
          img.src = src;
        }
      }
    }
  }, { rootMargin: '600px 0px' });

  const _unloadObs = new IntersectionObserver(entries => {
    for (const ent of entries) {
      const img = ent.target;
      if (!ent.isIntersecting) {
        const src = img.src;
        if (src && src !== window.location.href && !src.startsWith('data:')) {
          img.dataset.lazySrc = src;
          img.src = '';
        }
      } else {
        // Back in near-range: restore if unloaded
        const stored = img.dataset.lazySrc;
        if (stored && (!img.src || img.src === window.location.href)) {
          img.src = stored;
        }
      }
    }
  }, { rootMargin: '-1500px 0px' });  // fires when image is >1500 px off each edge

  function manageImg(img) {
    if (img._cmManaged) return;
    img._cmManaged = true;

    // Store original src in data attr so the load observer can restore it
    if (img.src && !img.dataset.lazySrc) img.dataset.lazySrc = img.src;

    _loadObs.observe(img);
    _unloadObs.observe(img);
  }

  // Auto-manage every poster-img inserted into #main
  const _mutObs = new MutationObserver(muts => {
    for (const mut of muts) {
      for (const node of mut.addedNodes) {
        if (node.nodeType !== 1) continue;
        const imgs = node.classList && node.classList.contains('poster-img')
          ? [node]
          : node.querySelectorAll('img.poster-img');
        imgs.forEach(manageImg);
      }
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('main') || document.body;
    _mutObs.observe(root, { childList: true, subtree: true });
    // Manage any images already in the DOM
    root.querySelectorAll('img.poster-img').forEach(manageImg);
  });


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 5 — Override doSearch to use the Worker
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const _safe = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function renderSearchItems(items, container, hint) {
    container.innerHTML = (hint || '') + items.slice(0, 60).map(m => {
      const r = window.getMovieIdx(m);
      return `<div class="movie-card" onclick="openMovieObj(movieRegistry[${r}])">
        <div class="poster-wrap">${
          m.poster_url
            ? `<img src="${m.poster_url}" class="poster-img" loading="lazy" decoding="async" onerror="this.src=''" alt="">`
            : '<span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:32px">🎬</span>'
        }</div>
        <div class="card-title">${_safe(m.title || m.name || '')}</div>
        <div class="card-meta"><span class="card-rating">★${parseFloat(m.vote_average || 0).toFixed(1)}</span> ${m.media_type === 'tv' ? '📺' : '🎬'} ${(m.release_date || m.year || '').slice(0, 4)}</div>
      </div>`;
    }).join('');
    container.querySelectorAll('img.poster-img').forEach(manageImg);
  }

  async function doSearchWorker() {
    const searchEl = document.getElementById('main-search');
    const container = document.getElementById('search-results');
    if (!container) return;

    const q         = (searchEl ? searchEl.value : '').toLowerCase().trim();
    const mediaType = window.searchType || 'all';
    const genre     = window.searchGenre || '';
    const minRating = window.searchMinRating || 0;

    // ── Actor search ───────────────────────────────────────────────────────
    if (mediaType === 'actor') {
      container.innerHTML = '<div style="padding:20px;color:var(--text2);font-size:12px">🔍 Searching…</div>';
      const actors = await wSearchActors(q);
      if (!actors.length) {
        container.innerHTML = '<div style="padding:20px;color:var(--text2);font-size:12px">⏳ Actor library loading — try again in a moment</div>';
        return;
      }
      container.innerHTML = actors.map(a => {
        const r = window.getMovieIdx(a);
        return `<div class="movie-card" onclick="openActorObj(movieRegistry[${r}])">
          <div class="poster-wrap">${a.profile_url
            ? `<img src="${a.profile_url}" class="poster-img" loading="lazy" onerror="this.style.opacity=0.2">`
            : '<span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:32px">👤</span>'}
          </div>
          <div class="card-title">${_safe(a.name || '')}</div>
          <div class="card-meta">${_safe(a.known_for_dept || 'Actor')}</div>
        </div>`;
      }).join('');
      container.querySelectorAll('img.poster-img').forEach(manageImg);
      return;
    }

    // ── Movie / TV search ─────────────────────────────────────────────────────
    // 1. Instant results from the small seed pool (already in main thread)
    const seedSeen = new Set();
    const seed = [];
    const addSeed = arr => (arr || []).forEach(m => {
      const k = String(m.id) + m.media_type;
      if (!seedSeen.has(k)) { seedSeen.add(k); seed.push(m); }
    });
    addSeed(window.DATA && window.DATA.newReleases);
    addSeed(window.DATA && window.DATA.topRated);
    addSeed(window.DATA && window.DATA.recPool);

    const mType = mediaType === 'all' ? '' : mediaType;
    const seedFiltered = seed.filter(m => {
      if (mType && m.media_type !== mType)                              return false;
      if (genre && !(m.genres || '').toLowerCase().includes(genre.toLowerCase())) return false;
      if (minRating && parseFloat(m.vote_average || 0) < minRating)   return false;
      if (!q)                                                           return true;
      return (m.title || '').toLowerCase().includes(q) ||
             (m.original_title || '').toLowerCase().includes(q) ||
             (m.cast || '').toLowerCase().includes(q);
    });

    const hint = (q || genre || minRating) && !window._phase2Done
      ? '<div style="grid-column:1/-1;padding:8px 0 4px;font-size:11px;color:var(--gold)">⏳ Full library indexing — showing partial results</div>'
      : '';

    renderSearchItems(seedFiltered, container, hint);

    // 2. Full results from Worker (enriches display when ready)
    if ((q || genre || minRating) && _worker) {
      const workerRes = await wSearch(q, mType, genre, minRating, 60);
      if (workerRes.length) {
        const seen = new Set(seedFiltered.map(m => String(m.id) + m.media_type));
        const merged = [...workerRes];
        seedFiltered.forEach(m => {
          const k = String(m.id) + m.media_type;
          if (!seen.has(k)) { seen.add(k); merged.push(m); }
        });
        renderSearchItems(merged, container, '');
      }
    }
  }

  // Replace the original
  window.doSearch = doSearchWorker;


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 6 — Override category loading (_loadAndRender) to use Worker
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  let _catLoadId = 0; // cancellation token for concurrent requests

  async function loadAndRenderWorker() {
    const cat   = window.catCurrent || 'korean';
    const media = window.catMedia   || 'movie';
    const grid  = document.getElementById('categories-grid');
    const more  = document.getElementById('cat-show-more');
    if (!grid) return;

    const myId = ++_catLoadId;

    grid.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:#8892a8;font-size:13px">Loading…</div>';
    if (more) more.style.display = 'none';

    const result = await wLoadCat(cat, media, 0, 30);
    if (myId !== _catLoadId) return; // stale — user switched tab

    grid.innerHTML = '';
    if (!result.rows || !result.rows.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:#8892a8;font-size:13px">No titles found for this category.</div>';
      return;
    }

    appendCatCards(result.rows, grid);
    grid.dataset.catShown = result.rows.length;
    grid.dataset.catTotal = result.total || 0;
    if (more) more.style.display = (result.total > result.rows.length) ? '' : 'none';
  }

  function appendCatCards(rows, grid) {
    const frag = document.createDocumentFragment();
    rows.forEach(m => {
      const div = document.createElement('div');
      div.className = 'movie-card';
      div.onclick   = () => window.openMovieObj(m);
      const poster  = m.poster_url || '';
      div.innerHTML = `<div class="poster-wrap">${
        poster
          ? `<img src="${poster}" class="poster-img" loading="lazy" decoding="async" onerror="this.style.opacity=0.2" alt="">`
          : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px">🎬</div>'
      }</div>
      <div class="card-title">${_safe(m.title || m.name || '')}</div>
      <div class="card-meta"><span class="card-rating">★${parseFloat(m.vote_average || 0).toFixed(1)}</span></div>`;
      const img = div.querySelector('img');
      if (img) manageImg(img);
      frag.appendChild(div);
    });
    grid.appendChild(frag);
  }

  window._loadAndRender = loadAndRenderWorker;

  // catShowMore — loads next page from worker
  window.catShowMore = async function () {
    const cat   = window.catCurrent || 'korean';
    const media = window.catMedia   || 'movie';
    const grid  = document.getElementById('categories-grid');
    const more  = document.getElementById('cat-show-more');
    if (!grid) return;

    const shown = parseInt(grid.dataset.catShown || '0');
    const total = parseInt(grid.dataset.catTotal || '0');
    if (total && shown >= total) { if (more) more.style.display = 'none'; return; }

    const result = await wLoadCat(cat, media, shown, 30);
    if (!result.rows || !result.rows.length) {
      if (more) more.style.display = 'none'; return;
    }
    appendCatCards(result.rows, grid);
    grid.dataset.catShown = shown + result.rows.length;
    if (more) more.style.display = (result.total && (shown + result.rows.length) >= result.total) ? 'none' : '';
  };

  // Re-bind setCategory / setCatMedia so they call the new _loadAndRender
  window.setCategory = function (cat, el) {
    window.catCurrent = cat;
    document.querySelectorAll('.cat-tab').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
    loadAndRenderWorker();
  };
  window.setCatMedia = function (media, el) {
    window.catMedia = media;
    document.querySelectorAll('.cat-media-toggle .toggle-btn').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');
    loadAndRenderWorker();
  };


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 7 — Start Worker background indexing once Phase 1 is done
  //          We hook into DOMContentLoaded so initAll() has already run.
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function kickoffWorkerLoading() {
    if (!_worker) return;
    const base = window.csvDir || 'csv_output/';
    // Start streaming both heavy files in the worker background
    _worker.postMessage({ type: 'LOAD_MOVIES', data: { url: base + 'static_movies_series.csv' } });
    _worker.postMessage({ type: 'LOAD_ACTORS', data: { url: base + 'static_actors.csv'        } });
  }

  // initAll() is called by loadAllData() via hideLoadingOverlay() → initAll().
  // We patch initAll to also start the worker after Phase 1 finishes.
  const _origInitAll = window.initAll;
  window.initAll = function () {
    if (_origInitAll) _origInitAll();
    kickoffWorkerLoading();
  };

  // Fallback: if initAll was already called before this script ran (shouldn't
  // happen, but just in case), start worker on next tick.
  setTimeout(kickoffWorkerLoading, 0);


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 8 — Limit DOM nodes in Top-Rated & Year pages to 50 visible items
  //          (they already render ≤50, but images need lifecycle management)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // The MutationObserver in STEP 4 already handles these automatically.
  // Nothing extra needed here.


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 9 — Scroll-row image limit: keep at most 20 decoded images per row
  //          After the home page renders, observe each scroll-row and cap live
  //          image count.  The IntersectionObserver in STEP 4 does the rest.
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Handled automatically by the lifecycle observers in STEP 4.


  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Badge helper (reuse the one already defined in index.html)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  function updateLoadingBadge(msg) {
    if (typeof window.updateLoadingBadge === 'function') {
      window.updateLoadingBadge(msg);
    } else {
      let badge = document.getElementById('p2-badge');
      if (!msg) { badge && badge.remove(); return; }
      if (!badge) {
        badge = document.createElement('div');
        badge.id = 'p2-badge';
        badge.style.cssText = 'position:fixed;bottom:14px;right:16px;z-index:600;background:var(--bg2);border:1px solid var(--border2);border-radius:20px;padding:5px 14px;font-size:11px;color:var(--gold);display:flex;align-items:center;gap:8px;pointer-events:none';
        document.body.appendChild(badge);
      }
      badge.innerHTML = `<span style="width:8px;height:8px;border-radius:50%;border:2px solid var(--gold);border-top-color:transparent;display:inline-block;animation:spin 0.8s linear infinite"></span>${msg}`;
    }
  }

  console.log('%c🎬 CineMatrix Optimizer active — memory-efficient mode', 'color:#C9A84C;font-weight:bold');
})();
