// search-worker.js — CineMatrix actor search worker
// All movie/category data now served from Supabase directly.
// This worker handles only actor search (in-memory, injected via LOAD_DATA).

// ── Actor state ───────────────────────────────────────────────────────────────
let actorRows    = [];
let actorsLoaded = false;

// ── Main message handler ──────────────────────────────────────────────────────
self.onmessage = function(e) {
  const { type, data } = e.data;

  switch (type) {

    // ── LOAD_MOVIES: no-op — movies searched via Supabase in main thread ──────
    case 'LOAD_MOVIES': {
      self.postMessage({ type: 'MOVIES_READY', count: 0 });
      break;
    }

    // ── LOAD_DATA: receive actors from Supabase (injected by main thread) ─────
    case 'LOAD_DATA': {
      if (data.actors && Array.isArray(data.actors)) {
        actorRows = data.actors.map(r => ({
          id:             r.id || '',
          name:           r.name || '',
          bio:            (r.bio || r.biography || '').slice(0, 300),
          poster_url:     r.poster_url || r.profile_url || '',
          known_for:      r.known_for || '',
          known_for_dept: r.known_for_dept || 'Acting',
          popularity:     parseFloat(r.popularity) || 0,
          top_movies:     r.top_movies || '',
          birthday:       r.birthday || '',
          birthplace:     r.birthplace || '',
        }));
        actorsLoaded = true;
        self.postMessage({ type: 'ACTORS_READY', count: actorRows.length });
      }
      self.postMessage({ type: 'MOVIES_READY', count: 0 });
      break;
    }

    // ── LOAD_ACTORS: no-op if already loaded from Supabase ───────────────────
    case 'LOAD_ACTORS': {
      if (actorsLoaded) {
        self.postMessage({ type: 'ACTORS_READY', count: actorRows.length });
      } else {
        // Actors not injected yet — send empty ready so UI doesn't hang
        self.postMessage({ type: 'ACTORS_READY', count: 0 });
      }
      break;
    }

    // ── SEARCH: no-op — handled by Supabase query in main thread ─────────────
    case 'SEARCH': {
      // Results come directly from Supabase; worker search not needed
      self.postMessage({ type: 'SEARCH_RESULTS', results: [], requestId: data.requestId });
      break;
    }

    // ── SEARCH_ACTORS ─────────────────────────────────────────────────────────
    case 'SEARCH_ACTORS': {
      const q   = (data.query || '').toLowerCase();
      const res = actorRows.filter(a => !q || a.name.toLowerCase().includes(q)).slice(0, 60);
      self.postMessage({ type: 'ACTOR_RESULTS', results: res, requestId: data.requestId });
      break;
    }

    // ── LOAD_CAT / CAT_MORE: no-op — categories served from Supabase ─────────
    case 'LOAD_CAT':
    case 'CAT_MORE': {
      self.postMessage({ type: 'CAT_RESULTS', rows: [], total: 0, offset: data.offset || 0, media: data.media, requestId: data.requestId });
      break;
    }
  }
};
