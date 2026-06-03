#!/usr/bin/env python3
"""
CSV to Supabase Migration Script
Loads all CSV data into Supabase tables
"""

import os
import csv
import json
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env file
load_dotenv()

# Initialize Supabase
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

CSV_DIR = Path("csv_output")

def load_csv_file(filename):
    """Load CSV file and return list of dicts"""
    filepath = CSV_DIR / filename
    if not filepath.exists():
        print(f"⚠ {filename} not found")
        return []
    
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        return list(reader)

def insert_data(table_name, data, batch_size=100):
    """Insert data into Supabase table in batches"""
    if not data:
        print(f"✓ {table_name}: No data to insert")
        return
    
    # Convert data types where needed
    cleaned_data = []
    for row in data:
        cleaned_row = {}
        for k, v in row.items():
            if v == '' or v is None:
                cleaned_row[k] = None
            elif k in ['id', 'media_id', 'frequency', 'count', 'year']:
                try:
                    cleaned_row[k] = int(v)
                except:
                    cleaned_row[k] = v
            elif k in ['popularity', 'rating', 'x', 'y', 'z']:
                try:
                    cleaned_row[k] = float(v)
                except:
                    cleaned_row[k] = v
            else:
                cleaned_row[k] = v
        cleaned_data.append(cleaned_row)
    
    # Insert in batches
    for i in range(0, len(cleaned_data), batch_size):
        batch = cleaned_data[i:i+batch_size]
        try:
            supabase.table(table_name).insert(batch).execute()
            print(f"✓ {table_name}: Inserted {len(batch)} rows")
        except Exception as e:
            print(f"✗ {table_name}: Error - {str(e)[:100]}")

def main():
    print("🚀 Starting CSV to Supabase migration...\n")
    
    # Clear tables first (optional - comment out if you want to keep data)
    tables = [
        "new_releases", "top_rated", "reviews", "movies_series", "awards",
        "movies_by_year", "actors", "mood_recommendations", "recommendation_pool",
        "cinema_galaxy", "cinema_world", "egypt_cinemas", "genre_frequency",
        "genre_cooccurrence", "point_cloud"
    ]
    
    # Map CSV files to tables and load
    migration_map = {
        "dynamic_new_releases.csv": "new_releases",
        "dynamic_top_rated.csv": "top_rated",
        "dynamic_reviews.csv": "reviews",
        "static_movies_series.csv": "movies_series",
        "static_awards.csv": "awards",
        "static_movies_by_year.csv": "movies_by_year",
        "static_actors.csv": "actors",
        "recommendation_mood.csv": "mood_recommendations",
        "recommendation_pool.csv": "recommendation_pool",
        "static_cinema_galaxy.csv": "cinema_galaxy",
        "static_cinema_world.csv": "cinema_world",
        "egypt_cinema_20260508_1117.csv": "egypt_cinemas",
        "analytics_genre_frequency.csv": "genre_frequency",
        "analytics_genre_cooccurrence.csv": "genre_cooccurrence",
        "analytics_point_cloud.csv": "point_cloud"
    }
    
    for csv_file, table_name in migration_map.items():
        data = load_csv_file(csv_file)
        insert_data(table_name, data)
    
    print("\n✓ Migration complete!")

if __name__ == "__main__":
    main()
