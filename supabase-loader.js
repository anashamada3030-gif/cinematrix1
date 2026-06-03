/**
 * Supabase Data Loader
 * Replaces CSV loading with direct Supabase queries
 */

// Initialize Supabase client
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase;

async function initSupabase() {
  // Dynamically import Supabase client
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  return supabase;
}

async function loadFromSupabase(tableName, options = {}) {
  if (!supabase) await initSupabase();
  
  try {
    let query = supabase.from(tableName).select(options.select || '*');
    
    if (options.limit) query = query.limit(options.limit);
    if (options.eq) {
      for (const [col, val] of Object.entries(options.eq)) {
        query = query.eq(col, val);
      }
    }
    if (options.order) {
      for (const [col, asc] of Object.entries(options.order)) {
        query = query.order(col, { ascending: asc !== false });
      }
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error(`Error loading ${tableName}:`, err);
    return [];
  }
}

async function loadAllData() {
  if (!supabase) await initSupabase();
  
  const [
    newReleases, topRated, reviews, moviesSeries, awards, moviesByYear,
    actors, moodData, recPool, cinemaGalaxy, cinemaWorld, egyptRaw,
    genreFreq, coocRaw, pointCloud
  ] = await Promise.all([
    loadFromSupabase('new_releases'),
    loadFromSupabase('top_rated'),
    loadFromSupabase('reviews'),
    loadFromSupabase('movies_series'),
    loadFromSupabase('awards'),
    loadFromSupabase('movies_by_year'),
    loadFromSupabase('actors'),
    loadFromSupabase('mood_recommendations'),
    loadFromSupabase('recommendation_pool'),
    loadFromSupabase('cinema_galaxy'),
    loadFromSupabase('cinema_world'),
    loadFromSupabase('egypt_cinemas'),
    loadFromSupabase('genre_frequency'),
    loadFromSupabase('genre_cooccurrence'),
    loadFromSupabase('point_cloud')
  ]);
  
  return {
    newReleases, topRated, reviews, moviesSeries, awards, moviesByYear,
    actors, moodData, recPool, cinemaGalaxy, cinemaWorld,
    genreFreq: genreFreq, pointCloud, egyptRaw
  };
}

export { initSupabase, loadFromSupabase, loadAllData };
