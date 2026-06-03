# CineMatrix - Supabase Migration Guide

## Quick Start

### 1. **Get Your Supabase Credentials**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Create a new project or select existing
   - Go to **Settings > API** 
   - Copy:
     - `Project URL` → `VITE_SUPABASE_URL`
     - `anon public key` → `VITE_SUPABASE_ANON_KEY`

### 2. **Update `.env` File**
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key-here
SERPAPI_KEY=your-serpapi-key
```

### 3. **Create Supabase Tables**

Run this SQL in your Supabase SQL Editor:

```sql
-- New Releases
CREATE TABLE IF NOT EXISTS new_releases (
  id BIGINT PRIMARY KEY,
  title TEXT,
  media_type TEXT,
  poster_url TEXT,
  popularity FLOAT,
  overview TEXT,
  release_date TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Top Rated
CREATE TABLE IF NOT EXISTS top_rated (
  id BIGINT PRIMARY KEY,
  title TEXT,
  media_type TEXT,
  poster_url TEXT,
  vote_average FLOAT,
  overview TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT PRIMARY KEY,
  media_id BIGINT,
  review_text TEXT,
  rating FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Movies & Series
CREATE TABLE IF NOT EXISTS movies_series (
  id BIGINT PRIMARY KEY,
  title TEXT,
  type TEXT,
  year INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Awards
CREATE TABLE IF NOT EXISTS awards (
  id BIGINT PRIMARY KEY,
  title TEXT,
  award_name TEXT,
  award_year INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Movies by Year
CREATE TABLE IF NOT EXISTS movies_by_year (
  id BIGINT PRIMARY KEY,
  title TEXT,
  year INT,
  media_type TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Actors
CREATE TABLE IF NOT EXISTS actors (
  id BIGINT PRIMARY KEY,
  name TEXT UNIQUE,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Mood Recommendations
CREATE TABLE IF NOT EXISTS mood_recommendations (
  id BIGINT PRIMARY KEY,
  mood TEXT,
  movie_id BIGINT,
  title TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Recommendation Pool
CREATE TABLE IF NOT EXISTS recommendation_pool (
  id BIGINT PRIMARY KEY,
  title TEXT,
  media_type TEXT,
  overview TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cinema Galaxy
CREATE TABLE IF NOT EXISTS cinema_galaxy (
  id BIGINT PRIMARY KEY,
  name TEXT,
  x FLOAT,
  y FLOAT,
  z FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cinema World
CREATE TABLE IF NOT EXISTS cinema_world (
  id BIGINT PRIMARY KEY,
  country_iso TEXT,
  movie_count INT,
  series_count INT,
  total_count INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Egypt Cinemas
CREATE TABLE IF NOT EXISTS egypt_cinemas (
  id BIGINT PRIMARY KEY,
  title TEXT,
  cinema_name TEXT,
  showtime TEXT,
  description TEXT,
  poster_url TEXT,
  day TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Genre Frequency
CREATE TABLE IF NOT EXISTS genre_frequency (
  id BIGINT PRIMARY KEY,
  genre TEXT UNIQUE,
  frequency INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Genre Cooccurrence
CREATE TABLE IF NOT EXISTS genre_cooccurrence (
  id BIGINT PRIMARY KEY,
  genre1 TEXT,
  genre2 TEXT,
  count INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Point Cloud
CREATE TABLE IF NOT EXISTS point_cloud (
  id BIGINT PRIMARY KEY,
  x FLOAT,
  y FLOAT,
  z FLOAT,
  color TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. **Migrate CSV Data to Supabase**

Install dependencies:
```bash
pip install supabase python-dotenv
```

Then run the migration:
```bash
python migrate_to_supabase.py
```

This will load all CSV files from `csv_output/` into Supabase tables.

### 5. **Update Configuration in index.html**

Replace the placeholder values in `index.html`:
```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_KEY = 'your-anon-key-here';
```

Or better yet, load from environment variables if using a build tool.

### 6. **Run the Application**

```bash
python -m http.server 8080
```

Visit `http://localhost:8080`

## Environment Variables Setup

### For Local Development
Create `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
SERPAPI_KEY=your-key
```

### For Vercel Deployment
1. Go to your Vercel project **Settings > Environment Variables**
2. Add the same variables above
3. Redeploy

## API Endpoints (Python/Vercel)

If you want to add data sync endpoints:

```python
# api/sync_data.py
from supabase import create_client
import os
import json

def handler(request):
    """Sync endpoint to trigger data updates"""
    supabase = create_client(
        os.environ['SUPABASE_URL'],
        os.environ['SUPABASE_KEY']
    )
    
    # Your sync logic here
    return {
        "statusCode": 200,
        "body": json.dumps({"status": "synced"})
    }
```

## Troubleshooting

### "Cannot load data from Supabase"
- Check Supabase URL and keys are correct
- Verify tables exist in Supabase
- Check browser console for specific errors

### Missing Data
- Run migration script again: `python migrate_to_supabase.py`
- Verify CSV files exist in `csv_output/`
- Check table schemas match CSV column names

### Row Level Security (RLS) Issues
If tables have RLS enabled, create policies:
```sql
-- Allow public read access
CREATE POLICY "Enable read access for all users" ON new_releases
  FOR SELECT
  USING (true);
```

## File Structure
```
cinematrix1/
├── index.html                    # Main app (updated for Supabase)
├── .env                          # Environment variables
├── migrate_to_supabase.py        # Migration script
├── supabase-loader.js            # Optional: Supabase utility module
├── csv_output/                   # CSV files (for initial migration)
│   ├── dynamic_new_releases.csv
│   ├── dynamic_top_rated.csv
│   ├── dynamic_reviews.csv
│   └── ...
└── api/
    ├── health.py                 # Health check
    ├── news.py                   # News API
    └── sync_data.py              # (Optional) Data sync endpoint
```

## Next Steps

1. ✅ Setup Supabase tables (SQL above)
2. ✅ Update .env with your credentials
3. ✅ Run migration script
4. ✅ Test locally
5. ✅ Deploy to Vercel with environment variables
6. (Optional) Create automated sync with GitHub Actions

---

**Need Help?** Check the Supabase docs: https://supabase.com/docs
