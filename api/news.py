#!/usr/bin/env python3
"""
CinaMatrix — News Proxy API for Vercel
"""

import json
import urllib.request
import urllib.parse
import os

# Get API key from environment or use default
SERPAPI_KEY = os.environ.get("SERPAPI_KEY", "9e25d6e1210c75bba233d72a369ea35db7c6b620eb1cf86ca9f100520d47fea7")

def handler(request):
    """Vercel serverless function handler"""
    
    # CORS headers
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json; charset=utf-8"
    }
    
    # Handle CORS preflight
    if request.method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": headers,
            "body": ""
        }
    
    if request.method != "GET":
        return {
            "statusCode": 405,
            "headers": headers,
            "body": json.dumps({"error": "Method not allowed"})
        }
    
    # Parse query parameters
    query_params = request.args
    query = query_params.get("q", "أفلام سينما 2026")
    num = query_params.get("num", "12")
    hl = query_params.get("hl", "ar")
    gl = query_params.get("gl", "eg")
    
    # Build SerpAPI request
    params = urllib.parse.urlencode({
        "api_key": SERPAPI_KEY,
        "engine": "google",
        "q": query,
        "tbm": "nws",
        "num": num,
        "hl": hl,
        "gl": gl,
    })
    
    url = f"https://serpapi.com/search?{params}"
    
    try:
        with urllib.request.urlopen(url, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        
        news = []
        for item in data.get("news_results", []):
            news.append({
                "title": item.get("title", ""),
                "link": item.get("link", "#"),
                "source": item.get("source", ""),
                "date": item.get("date", ""),
                "snippet": item.get("snippet", ""),
                "thumbnail": item.get("thumbnail", ""),
            })
        
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({"news_results": news}, ensure_ascii=False)
        }
    
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }
