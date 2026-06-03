#!/usr/bin/env python3
"""
Supabase Connection Test
Verifies that Supabase credentials are correct and tables exist
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_supabase_connection():
    """Test Supabase connection and table schemas"""
    
    print("🔍 Testing Supabase Connection...\n")
    
    # Check environment variables
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    
    if not url or not key:
        print("❌ Missing environment variables!")
        print("   Set SUPABASE_URL and SUPABASE_KEY in .env file")
        return False
    
    print(f"✓ SUPABASE_URL: {url}")
    print(f"✓ SUPABASE_KEY: {key[:20]}...")
    
    # Try to import and connect
    try:
        from supabase import create_client
        supabase = create_client(url, key)
        print("✓ Supabase library imported successfully\n")
    except ImportError:
        print("❌ supabase library not found!")
        print("   Install it: pip install supabase")
        return False
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False
    
    # Test connection by fetching from a table
    tables_to_test = [
        "new_releases",
        "top_rated",
        "reviews",
        "movies_series",
        "awards",
        "movies_by_year",
        "actors",
        "mood_recommendations",
        "recommendation_pool",
        "cinema_galaxy",
        "cinema_world",
        "egypt_cinemas",
        "genre_frequency",
        "genre_cooccurrence",
        "point_cloud"
    ]
    
    print("📊 Checking Tables:\n")
    
    successful_tables = 0
    for table_name in tables_to_test:
        try:
            response = supabase.table(table_name).select("*").limit(1).execute()
            row_count = response.count or 0
            print(f"✓ {table_name:30} ({row_count} rows)")
            successful_tables += 1
        except Exception as e:
            print(f"✗ {table_name:30} - Error: {str(e)[:40]}")
    
    print(f"\n✓ Successfully connected to {successful_tables}/{len(tables_to_test)} tables")
    
    if successful_tables == 0:
        print("\n⚠️  No tables found! You need to:")
        print("   1. Create Supabase tables using SQL from SUPABASE_SETUP.md")
        print("   2. Run: python migrate_to_supabase.py")
        return False
    
    print("\n✅ Supabase connection is working!")
    print("\nNext steps:")
    print("  1. If tables are empty, run: python migrate_to_supabase.py")
    print("  2. Start server: python -m http.server 8080")
    print("  3. Visit: http://localhost:8080")
    
    return True

if __name__ == "__main__":
    success = test_supabase_connection()
    sys.exit(0 if success else 1)
