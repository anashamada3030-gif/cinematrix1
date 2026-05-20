#!/usr/bin/env python3
"""
CinaMatrix — News Proxy Server
Runs on port 8888, forwards requests to SerpAPI (bypassing browser CORS).

Usage:
  1. python news_proxy.py          (runs proxy on :8888)
  2. python -m http.server 8080    (serve the HTML on :8080)
  3. Open http://localhost:8080
"""

import json
import urllib.request
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler

SERPAPI_KEY = "9e25d6e1210c75bba233d72a369ea35db7c6b620eb1cf86ca9f100520d47fea7"
PORT = 8888


class ProxyHandler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)

        # Health check
        if parsed.path == "/health":
            self._json({"status": "ok"})
            return

        if parsed.path != "/news":
            self._json({"error": "Use /news?q=...&num=12&hl=ar&gl=eg"}, 404)
            return

        # Parse query params from the browser request
        qs = urllib.parse.parse_qs(parsed.query)
        query   = qs.get("q",   ["أفلام سينما 2026"])[0]
        num     = qs.get("num", ["12"])[0]
        hl      = qs.get("hl",  ["ar"])[0]
        gl      = qs.get("gl",  ["eg"])[0]

        params = urllib.parse.urlencode({
            "api_key": SERPAPI_KEY,
            "engine":  "google",
            "q":       query,
            "tbm":     "nws",
            "num":     num,
            "hl":      hl,
            "gl":      gl,
        })

        url = f"https://serpapi.com/search?{params}"
        print(f"[proxy] Fetching: {url[:100]}...")

        try:
            with urllib.request.urlopen(url, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            news = []
            for item in data.get("news_results", []):
                news.append({
                    "title":     item.get("title", ""),
                    "link":      item.get("link", "#"),
                    "source":    item.get("source", ""),
                    "date":      item.get("date", ""),
                    "snippet":   item.get("snippet", ""),
                    "thumbnail": item.get("thumbnail", ""),
                })

            print(f"[proxy] Found {len(news)} articles")
            self._json({"news_results": news})

        except Exception as e:
            print(f"[proxy] Error: {e}")
            self._json({"error": str(e)}, 500)

    def _json(self, data, code=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self._cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin",  "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def log_message(self, fmt, *args):
        pass   # suppress default access log (we print our own)


if __name__ == "__main__":
    server = HTTPServer(("localhost", PORT), ProxyHandler)
    print(f"✅  CinaMatrix News Proxy running on http://localhost:{PORT}")
    print(f"    Test: http://localhost:{PORT}/health")
    print(f"    Press Ctrl+C to stop\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nProxy stopped.")
