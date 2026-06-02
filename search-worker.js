// search-worker.js — CineMatrix heavy-CSV worker
// Stream-and-stop: never loads full CSVs into RAM.
// Search stops as soon as enough results found.
// Categories stream-filter on the fly, no caching.

importScripts('https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js');

// ── Compact row ───────────────────────────────────────────────────────────────
function compact(row) {
  return {
    id:                   row.id || '',
    title:                row.title || row.name || '',
    original_title:       row.original_title || '',
    name:                 row.name || '',
    media_type:           row.media_type || 'movie',
    release_date:         row.release_date || row.year || '',
    year:                 row.year || '',
    vote_average:         parseFloat(row.vote_average) || 0,
    genres:               row.genres || '',
    overview:             (row.overview || '').slice(0, 400),
    poster_url:           row.poster_url || '',
    backdrop_url:         row.backdrop_url || '',
    cast:                 (row.cast || '').slice(0, 200),
    popularity:           parseFloat(row.popularity) || 0,
    production_countries: row.production_countries || '',
    runtime:              row.runtime || '',
    tagline:              row.tagline || '',
    trailer_url:          row.trailer_url || '',
    keywords:             (row.keywords || '').slice(0, 150),
    original_language:    row.original_language || '',
  };
}

// ── Category match ────────────────────────────────────────────────────────────
function matchCat(m, cat) {
  const lang   = (m.original_language || '').toLowerCase().trim();
  const genres = (m.genres || '').toLowerCase();
  switch (cat) {
    case 'korean':      return lang === 'ko';
    case 'anime':       return lang === 'ja' && genres.includes('animation');
    case 'egyptian':    return lang === 'ar';
    case 'middle_east': return ['fa','tr','he','ur'].includes(lang);
    case 'global':      return ['en','fr','es','de','it','pt','ru','zh','hi'].includes(lang);
    case 'musical':     return genres.includes('music');
    default:            return false;
  }
}

// ── Actor state (small CSV, fine to cache) ────────────────────────────────────
let actorRows    = [];
let actorsLoaded = false;

// ── Movies: stream-search, no storage ─────────────────────────────────────────
// Streams the CSV once per search request, collects matches, posts results.
// If the query is empty we still stream but stop after collecting `limit` rows
// sorted by vote_average — we keep a small top-N heap instead of all rows.
function streamSearch(url, query, mediaType, genre, minRating, limit, requestId) {
  const q    = (query || '').toLowerCase().trim();
  limit      = limit || 60;
  const SCAN = q ? 25000 : limit * 4; // for empty query scan a bit more for ranking

  const results   = [];
  let   scanned   = 0;
  let   aborted   = false;

  Papa.parse(url, {
    download:       true,
    header:         true,
    skipEmptyLines: true,
    step: function(result, parser) {
      if (aborted) return;
      const row = result.data;
      if (!row.title && !row.name) return;
      const m = compact(row);

      // Type filter
      if (mediaType === 'movie' && m.media_type !== 'movie') return;
      if (mediaType === 'tv'    && m.media_type !== 'tv')    return;
      // Genre filter
      if (genre && !m.genres.toLowerCase().includes(genre.toLowerCase())) return;
      // Rating filter
      if (minRating && m.vote_average < minRating) return;

      // Text match
      if (q) {
        const hit = m.title.toLowerCase().includes(q) ||
                    m.original_title.toLowerCase().includes(q) ||
                    m.cast.toLowerCase().includes(q) ||
                    m.overview.toLowerCase().includes(q) ||
                    m.keywords.toLowerCase().includes(q);
        if (!hit) return;
      }

      results.push(m);
      scanned++;

      // For keyword searches stop once we have plenty of matches
      if (q && results.length >= limit * 3) {
        aborted = true;
        parser.abort();
      }
      // For empty query (browse/filter) stop after scanning enough rows
      if (!q && scanned >= SCAN) {
        aborted = true;
        parser.abort();
      }
    },
    complete: function() {
      // Sort and trim
      if (q) {
        results.sort((a, b) => {
          const ta = a.title.toLowerCase(), tb = b.title.toLowerCase();
          if (ta === q  && tb !== q)  return -1;
          if (tb === q  && ta !== q)  return  1;
          if (ta.startsWith(q) && !tb.startsWith(q)) return -1;
          if (tb.startsWith(q) && !ta.startsWith(q)) return  1;
          return b.vote_average - a.vote_average;
        });
      } else {
        results.sort((a, b) => b.vote_average - a.vote_average);
      }
      self.postMessage({
        type: 'SEARCH_RESULTS',
        results: results.slice(0, limit),
        requestId
      });
    },
    error: function() {
      self.postMessage({ type: 'SEARCH_RESULTS', results: [], requestId });
    }
  });
}

// ── Category: stream-filter, two-pass for total count + page ─────────────────
// First pass counts total matches and collects the page slice.
// Stops collecting data rows once offset+limit is reached, keeps counting.
function streamCat(url, cat, media, offset, limit, requestId) {
  let total    = 0;
  let skipped  = 0;
  const rows   = [];

  Papa.parse(url, {
    download:       true,
    header:         true,
    skipEmptyLines: true,
    step: function(result) {
      const row = result.data;
      if (!row.title && !row.name) return;
      const m = compact(row);
      if (!matchCat(m, cat)) return;

      total++;

      // Skip rows before offset
      if (skipped < offset) { skipped++; return; }
      // Collect the page
      if (rows.length < limit) rows.push(m);
      // After page is full we keep going just to count the total
    },
    complete: function() {
      self.postMessage({ type: 'CAT_RESULTS', rows, total, offset, media, requestId });
    },
    error: function() {
      self.postMessage({ type: 'CAT_ERROR', media, requestId });
    }
  });
}

// ── Main message handler ──────────────────────────────────────────────────────
self.onmessage = function(e) {
  const { type, data } = e.data;

  switch (type) {

    // ── LOAD_MOVIES: fire MOVIES_READY immediately — no indexing needed.
    // Search streams on demand; nothing to pre-load.
    case 'LOAD_MOVIES': {
      self.postMessage({ type: 'MOVIES_READY', count: 0 });
      break;
    }

    // ── SEARCH: stream-search on demand, no preloaded index ──────────────────
    case 'SEARCH': {
      const url = data.baseUrl + 'static_movies_series.csv';
      streamSearch(url, data.query, data.mediaType, data.genre, data.minRating, data.limit, data.requestId);
      break;
    }

    // ── LOAD_ACTORS: small CSV, fine to cache ─────────────────────────────────
    case 'LOAD_ACTORS': {
      if (actorsLoaded) {
        self.postMessage({ type: 'ACTORS_READY', count: actorRows.length });
        return;
      }
      Papa.parse(data.url, {
        download:       true,
        header:         true,
        skipEmptyLines: true,
        step: r => {
          const row = r.data;
          if (!row.name) return;
          actorRows.push({
            id:             row.id || '',
            name:           row.name,
            known_for_dept: row.known_for_dept || 'Acting',
            profile_url:    row.profile_url || '',
            popularity:     parseFloat(row.popularity) || 0,
            biography:      (row.biography || '').slice(0, 600),
            known_for:      row.known_for || '',
            top_movies:     row.top_movies || '',
            birthday:       row.birthday || '',
            birthplace:     row.birthplace || '',
          });
        },
        complete: () => {
          actorsLoaded = true;
          self.postMessage({ type: 'ACTORS_READY', count: actorRows.length });
        },
        error: () => self.postMessage({ type: 'ERROR', msg: 'actors load failed' })
      });
      break;
    }

    // ── SEARCH_ACTORS ─────────────────────────────────────────────────────────
    case 'SEARCH_ACTORS': {
      const q   = (data.query || '').toLowerCase();
      const res = actorRows.filter(a => !q || a.name.toLowerCase().includes(q)).slice(0, 60);
      self.postMessage({ type: 'ACTOR_RESULTS', results: res, requestId: data.requestId });
      break;
    }

    // ── LOAD_CAT / CAT_MORE: stream-filter on demand ──────────────────────────
    case 'LOAD_CAT':
    case 'CAT_MORE': {
      const { cat, media, offset, limit, url, requestId } = data;
      streamCat(url, cat, media, offset || 0, limit || 30, requestId);
      break;
    }
  }
};
