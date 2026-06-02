// search-worker.js — CineMatrix heavy-CSV worker
// Runs entirely off the main thread.
// Never sends 25 k rows to main thread — only search results (≤60 rows).

importScripts('https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js');

// ── State ─────────────────────────────────────────────────────────────────────
let movieRows   = [];
let actorRows   = [];
let catRows     = { movie: [], tv: [] };
let moviesLoaded = false;
let actorsLoaded = false;
let catLoaded    = { movie: false, tv: false };
let pendingSearch = null;

// ── Compact row: strip unused fields & truncate long strings ──────────────────
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

// ── Search ────────────────────────────────────────────────────────────────────
function searchMovies(query, mediaType, genre, minRating, limit) {
  const q = (query || '').toLowerCase().trim();
  limit = limit || 60;

  let results = movieRows.filter(m => {
    if (mediaType === 'movie' && m.media_type !== 'movie') return false;
    if (mediaType === 'tv'    && m.media_type !== 'tv')    return false;
    if (genre && !m.genres.toLowerCase().includes(genre.toLowerCase())) return false;
    if (minRating && m.vote_average < minRating) return false;
    if (!q) return true;
    return m.title.toLowerCase().includes(q) ||
           m.original_title.toLowerCase().includes(q) ||
           m.cast.toLowerCase().includes(q) ||
           m.overview.toLowerCase().includes(q) ||
           m.keywords.toLowerCase().includes(q);
  });

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

  return results.slice(0, limit);
}

// ── Category filter ───────────────────────────────────────────────────────────
function matchCat(m, cat) {
  const lang   = (m.original_language || '').toLowerCase().trim();
  const genres = m.genres.toLowerCase();
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

// ── CSV streaming helpers ─────────────────────────────────────────────────────
function streamCSV(url, onRow, onDone, onErr) {
  Papa.parse(url, {
    download:       true,
    header:         true,
    skipEmptyLines: true,
    step:  r => { if (r.data) onRow(r.data); },
    complete: onDone,
    error:    e => { if (onErr) onErr(e); },
  });
}

// ── Main message handler ──────────────────────────────────────────────────────
self.onmessage = function (e) {
  const { type, data } = e.data;

  switch (type) {

    // ── Pre-load movies (called at startup for background indexing) ────────────
    case 'LOAD_MOVIES': {
      if (moviesLoaded) {
        self.postMessage({ type: 'MOVIES_READY', count: movieRows.length });
        return;
      }
      streamCSV(
        data.url,
        row => { if (row.title || row.name) movieRows.push(compact(row)); },
        () => {
          moviesLoaded = true;
          self.postMessage({ type: 'MOVIES_READY', count: movieRows.length });
          if (pendingSearch) {
            const ps = pendingSearch; pendingSearch = null;
            const results = searchMovies(ps.query, ps.mediaType, ps.genre, ps.minRating, ps.limit);
            self.postMessage({ type: 'SEARCH_RESULTS', results, requestId: ps.requestId });
          }
        },
        () => self.postMessage({ type: 'ERROR', msg: 'movies load failed' })
      );
      break;
    }

    // ── Search (also auto-loads movies if needed) ──────────────────────────────
    case 'SEARCH': {
      if (moviesLoaded) {
        const results = searchMovies(data.query, data.mediaType, data.genre, data.minRating, data.limit);
        self.postMessage({ type: 'SEARCH_RESULTS', results, requestId: data.requestId });
      } else {
        pendingSearch = data;
        if (movieRows.length === 0) {
          // First search triggers load
          streamCSV(
            data.baseUrl + 'static_movies_series.csv',
            row => { if (row.title || row.name) movieRows.push(compact(row)); },
            () => {
              moviesLoaded = true;
              self.postMessage({ type: 'MOVIES_READY', count: movieRows.length });
              if (pendingSearch) {
                const ps = pendingSearch; pendingSearch = null;
                const results = searchMovies(ps.query, ps.mediaType, ps.genre, ps.minRating, ps.limit);
                self.postMessage({ type: 'SEARCH_RESULTS', results, requestId: ps.requestId });
              }
            }
          );
        }
      }
      break;
    }

    // ── Load actors ────────────────────────────────────────────────────────────
    case 'LOAD_ACTORS': {
      if (actorsLoaded) {
        self.postMessage({ type: 'ACTORS_READY', count: actorRows.length });
        return;
      }
      streamCSV(
        data.url,
        row => {
          if (!row.name) return;
          actorRows.push({
            id:              row.id || '',
            name:            row.name,
            known_for_dept:  row.known_for_dept || 'Acting',
            profile_url:     row.profile_url || '',
            popularity:      parseFloat(row.popularity) || 0,
            biography:       (row.biography || '').slice(0, 600),
            known_for:       row.known_for || '',
            top_movies:      row.top_movies || '',
            birthday:        row.birthday || '',
            birthplace:      row.birthplace || '',
          });
        },
        () => {
          actorsLoaded = true;
          self.postMessage({ type: 'ACTORS_READY', count: actorRows.length });
        },
        () => self.postMessage({ type: 'ERROR', msg: 'actors load failed' })
      );
      break;
    }

    // ── Search actors ──────────────────────────────────────────────────────────
    case 'SEARCH_ACTORS': {
      const q   = (data.query || '').toLowerCase();
      const res = actorRows.filter(a => !q || a.name.toLowerCase().includes(q)).slice(0, 60);
      self.postMessage({ type: 'ACTOR_RESULTS', results: res, requestId: data.requestId });
      break;
    }

    // ── Category: initial load ─────────────────────────────────────────────────
    case 'LOAD_CAT': {
      const { cat, media, offset, limit, url, requestId } = data;
      const send = () => {
        const all  = catRows[media].filter(m => matchCat(m, cat));
        const rows = all.slice(offset, offset + limit);
        self.postMessage({ type: 'CAT_RESULTS', rows, total: all.length, offset, media, requestId });
      };
      if (catLoaded[media]) { send(); return; }
      catRows[media] = [];
      streamCSV(
        url,
        row => { if (row.title || row.name) catRows[media].push(compact(row)); },
        () => { catLoaded[media] = true; send(); },
        () => self.postMessage({ type: 'CAT_ERROR', media, requestId })
      );
      break;
    }

    // ── Category: load more (cache already warm) ───────────────────────────────
    case 'CAT_MORE': {
      const { cat, media, offset, limit, requestId } = data;
      if (!catLoaded[media]) return; // shouldn't happen
      const all  = catRows[media].filter(m => matchCat(m, cat));
      const rows = all.slice(offset, offset + limit);
      self.postMessage({ type: 'CAT_RESULTS', rows, total: all.length, offset, media, requestId });
      break;
    }
  }
};
