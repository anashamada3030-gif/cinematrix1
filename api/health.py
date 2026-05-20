#!/usr/bin/env python3
"""
CinaMatrix — Health Check API
"""

import json

def handler(request):
    """Vercel serverless health check endpoint"""
    
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
    }
    
    return {
        "statusCode": 200,
        "headers": headers,
        "body": json.dumps({"status": "ok"})
    }
