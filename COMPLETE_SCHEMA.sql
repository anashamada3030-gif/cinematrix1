-- COMPLETE SUPABASE SCHEMA FOR CINEMATRIX
-- Verified against EXACT CSV column names - NO EXTRAS, NO MISSING

-- 1. New Releases (19 cols from dynamic_new_releases.csv)
DROP TABLE IF EXISTS new_releases CASCADE;
CREATE TABLE new_releases (
  id BIGINT PRIMARY KEY,
  media_type TEXT,
  title TEXT,
  original_title TEXT,
  release_date TEXT,
  vote_average FLOAT,
  vote_count INT,
  popularity FLOAT,
  overview TEXT,
  original_language TEXT,
  genres TEXT,
  poster_url TEXT,
  "cast" TEXT,
  trailer_url TEXT,
  scraped_at TEXT,
  category TEXT,
  popularity_normalized FLOAT,
  rating_normalized FLOAT,
  page_batch INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Top Rated (19 cols from dynamic_top_rated.csv)
DROP TABLE IF EXISTS top_rated CASCADE;
CREATE TABLE top_rated (
  id BIGINT PRIMARY KEY,
  media_type TEXT,
  title TEXT,
  original_title TEXT,
  release_date TEXT,
  vote_average FLOAT,
  vote_count INT,
  popularity FLOAT,
  overview TEXT,
  original_language TEXT,
  genres TEXT,
  poster_url TEXT,
  "cast" TEXT,
  trailer_url TEXT,
  scraped_at TEXT,
  category TEXT,
  popularity_normalized FLOAT,
  rating_normalized FLOAT,
  page_batch INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Reviews (6 cols from dynamic_reviews.csv)
DROP TABLE IF EXISTS reviews CASCADE;
CREATE TABLE reviews (
  id BIGSERIAL PRIMARY KEY,
  media_id BIGINT,
  media_type TEXT,
  author TEXT,
  rating FLOAT,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Movies & Series (34 cols from static_movies_series.csv)
DROP TABLE IF EXISTS movies_series CASCADE;
CREATE TABLE movies_series (
  id BIGINT PRIMARY KEY,
  media_type TEXT,
  title TEXT,
  original_title TEXT,
  release_date TEXT,
  year INT,
  vote_average FLOAT,
  vote_count INT,
  popularity FLOAT,
  overview TEXT,
  original_language TEXT,
  genres TEXT,
  poster_url TEXT,
  backdrop_url TEXT,
  category TEXT,
  director TEXT,
  "cast" TEXT,
  trailer_url TEXT,
  production_countries TEXT,
  runtime INT,
  budget BIGINT,
  revenue BIGINT,
  tagline TEXT,
  keywords TEXT,
  streaming TEXT,
  first_review TEXT,
  scraped_at TEXT,
  popularity_norm FLOAT,
  vote_average_norm FLOAT,
  popularity_std FLOAT,
  vote_average_std FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Awards (24 cols from static_awards.csv)
DROP TABLE IF EXISTS awards CASCADE;
CREATE TABLE awards (
  id BIGINT PRIMARY KEY,
  media_type TEXT,
  title TEXT,
  original_title TEXT,
  release_date TEXT,
  year INT,
  vote_average FLOAT,
  vote_count INT,
  popularity FLOAT,
  overview TEXT,
  original_language TEXT,
  genres TEXT,
  poster_url TEXT,
  category TEXT,
  "cast" TEXT,
  trailer_url TEXT,
  production_countries TEXT,
  runtime INT,
  budget BIGINT,
  revenue BIGINT,
  tagline TEXT,
  first_review TEXT,
  scraped_at TEXT,
  award_type TEXT,
  award_year INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Movies by Year (23 cols from static_movies_by_year.csv)
DROP TABLE IF EXISTS movies_by_year CASCADE;
CREATE TABLE movies_by_year (
  id BIGINT PRIMARY KEY,
  media_type TEXT,
  title TEXT,
  original_title TEXT,
  release_date TEXT,
  year INT,
  vote_average FLOAT,
  vote_count INT,
  popularity FLOAT,
  overview TEXT,
  original_language TEXT,
  genres TEXT,
  poster_url TEXT,
  category TEXT,
  "cast" TEXT,
  trailer_url TEXT,
  production_countries TEXT,
  runtime INT,
  budget BIGINT,
  revenue BIGINT,
  tagline TEXT,
  first_review TEXT,
  scraped_at TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Actors (11 cols from static_actors.csv)
DROP TABLE IF EXISTS actors CASCADE;
CREATE TABLE actors (
  id BIGINT PRIMARY KEY,
  name TEXT,
  known_for_dept TEXT,
  popularity FLOAT,
  profile_url TEXT,
  biography TEXT,
  birthday TEXT,
  birthplace TEXT,
  known_for TEXT,
  top_movies TEXT,
  scraped_at TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Mood Recommendations (34 cols from recommendation_mood.csv)
DROP TABLE IF EXISTS mood_recommendations CASCADE;
CREATE TABLE mood_recommendations (
  id BIGINT PRIMARY KEY,
  media_type TEXT,
  title TEXT,
  original_title TEXT,
  release_date TEXT,
  year INT,
  vote_average FLOAT,
  vote_count INT,
  popularity FLOAT,
  overview TEXT,
  original_language TEXT,
  genres TEXT,
  poster_url TEXT,
  backdrop_url TEXT,
  category TEXT,
  director TEXT,
  "cast" TEXT,
  trailer_url TEXT,
  production_countries TEXT,
  runtime INT,
  budget BIGINT,
  revenue BIGINT,
  tagline TEXT,
  keywords TEXT,
  streaming TEXT,
  first_review TEXT,
  scraped_at TEXT,
  popularity_norm FLOAT,
  vote_average_norm FLOAT,
  popularity_std FLOAT,
  vote_average_std FLOAT,
  decade TEXT,
  mood TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Recommendation Pool (34 cols from recommendation_pool.csv)
DROP TABLE IF EXISTS recommendation_pool CASCADE;
CREATE TABLE recommendation_pool (
  id BIGINT PRIMARY KEY,
  media_type TEXT,
  title TEXT,
  original_title TEXT,
  release_date TEXT,
  year INT,
  vote_average FLOAT,
  vote_count INT,
  popularity FLOAT,
  overview TEXT,
  original_language TEXT,
  genres TEXT,
  poster_url TEXT,
  backdrop_url TEXT,
  category TEXT,
  director TEXT,
  "cast" TEXT,
  trailer_url TEXT,
  production_countries TEXT,
  runtime INT,
  budget BIGINT,
  revenue BIGINT,
  tagline TEXT,
  keywords TEXT,
  streaming TEXT,
  first_review TEXT,
  scraped_at TEXT,
  popularity_norm FLOAT,
  vote_average_norm FLOAT,
  popularity_std FLOAT,
  vote_average_std FLOAT,
  decade TEXT,
  score FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 10. Cinema Galaxy (37 cols from static_cinema_galaxy.csv)
DROP TABLE IF EXISTS cinema_galaxy CASCADE;
CREATE TABLE cinema_galaxy (
  id BIGINT PRIMARY KEY,
  media_type TEXT,
  title TEXT,
  original_title TEXT,
  release_date TEXT,
  year INT,
  vote_average FLOAT,
  vote_count INT,
  popularity FLOAT,
  overview TEXT,
  original_language TEXT,
  genres TEXT,
  poster_url TEXT,
  backdrop_url TEXT,
  category TEXT,
  director TEXT,
  "cast" TEXT,
  trailer_url TEXT,
  production_countries TEXT,
  runtime INT,
  budget BIGINT,
  revenue BIGINT,
  tagline TEXT,
  keywords TEXT,
  streaming TEXT,
  first_review TEXT,
  scraped_at TEXT,
  popularity_norm FLOAT,
  vote_average_norm FLOAT,
  popularity_std FLOAT,
  vote_average_std FLOAT,
  decade TEXT,
  planet_size FLOAT,
  planet_rating FLOAT,
  x3d FLOAT,
  y3d FLOAT,
  z3d FLOAT,
  dist_from_center FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 11. Cinema World (5 cols from static_cinema_world.csv - NO ID COLUMN)
DROP TABLE IF EXISTS cinema_world CASCADE;
CREATE TABLE cinema_world (
  country_iso TEXT PRIMARY KEY,
  movie_count INT,
  series_count INT,
  total_count INT,
  total_norm FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 12. Egypt Cinemas (6 cols from egypt_cinema_20260508_1117.csv - preserve case-sensitive names)
DROP TABLE IF EXISTS egypt_cinemas CASCADE;
CREATE TABLE egypt_cinemas (
  id BIGSERIAL PRIMARY KEY,
  "Title" TEXT,
  "Description" TEXT,
  "Poster URL" TEXT,
  "Day" TEXT,
  "Cinema Name" TEXT,
  "Showtime" TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 13. Genre Frequency (3 cols from analytics_genre_frequency.csv)
DROP TABLE IF EXISTS genre_frequency CASCADE;
CREATE TABLE genre_frequency (
  id BIGSERIAL PRIMARY KEY,
  genre TEXT,
  count INT,
  normalized FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 14. Genre Cooccurrence (27 cols: genre + 26 genre columns from analytics_genre_cooccurrence.csv)
DROP TABLE IF EXISTS genre_cooccurrence CASCADE;
CREATE TABLE genre_cooccurrence (
  id BIGSERIAL PRIMARY KEY,
  genre TEXT,
  "Drama" INT,
  "Comedy" INT,
  "Crime" INT,
  "Action" INT,
  "Thriller" INT,
  "Romance" INT,
  "Animation" INT,
  "Family" INT,
  "Mystery" INT,
  "Adventure" INT,
  "Horror" INT,
  "Fantasy" INT,
  "Action & Adventure" INT,
  "Sci-Fi & Fantasy" INT,
  "Documentary" INT,
  "History" INT,
  "Science Fiction" INT,
  "War" INT,
  "Music" INT,
  "Soap" INT,
  "Reality" INT,
  "Kids" INT,
  "War & Politics" INT,
  "Western" INT,
  "TV Movie" INT,
  "Talk" INT,
  "News" INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 15. Point Cloud (16 cols from analytics_point_cloud.csv)
DROP TABLE IF EXISTS point_cloud CASCADE;
CREATE TABLE point_cloud (
  id BIGINT PRIMARY KEY,
  title TEXT,
  media_type TEXT,
  genres TEXT,
  popularity FLOAT,
  vote_average FLOAT,
  vote_count INT,
  year INT,
  category TEXT,
  x FLOAT,
  y FLOAT,
  z FLOAT,
  centroid_x FLOAT,
  centroid_y FLOAT,
  centroid_z FLOAT,
  dist_from_centroid FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_new_releases_media_type ON new_releases(media_type);
CREATE INDEX idx_top_rated_media_type ON top_rated(media_type);
CREATE INDEX idx_reviews_media_id ON reviews(media_id);
CREATE INDEX idx_actors_name ON actors(name);
CREATE INDEX idx_cinema_world_country ON cinema_world(country_iso);
CREATE INDEX idx_egypt_cinemas_title ON egypt_cinemas("Title");
CREATE INDEX idx_mood_recommendations_mood ON mood_recommendations(mood);
CREATE INDEX idx_genre_frequency_genre ON genre_frequency(genre);
CREATE INDEX idx_point_cloud_title ON point_cloud(title);
