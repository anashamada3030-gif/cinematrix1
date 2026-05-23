from http.server import BaseHTTPRequestHandler
import json
import urllib.request
import urllib.parse
import os

SERPAPI_KEY = os.environ.get("SERPAPI_KEY", "")

class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params_raw = urllib.parse.parse_qs(parsed.query)
        query = params_raw.get('q', ['أفلام سينما 2026'])[0]
        num   = params_raw.get('num', ['12'])[0]
        hl    = params_raw.get('hl', ['ar'])[0]
        gl    = params_raw.get('gl', ['eg'])[0]

        api_params = urllib.parse.urlencode({
            'api_key': SERPAPI_KEY,
            'engine': 'google',
            'q': query,
            'tbm': 'nws',
            'num': num,
            'hl': hl,
            'gl': gl,
        })

        url = f'https://serpapi.com/search?{api_params}'

        try:
            with urllib.request.urlopen(url, timeout=15) as resp:
                data = json.loads(resp.read().decode('utf-8'))

            news = [
                {
                    'title':     item.get('title', ''),
                    'link':      item.get('link', '#'),
                    'source':    item.get('source', ''),
                    'date':      item.get('date', ''),
                    'snippet':   item.get('snippet', ''),
                    'thumbnail': item.get('thumbnail', ''),
                }
                for item in data.get('news_results', [])
            ]

            body = json.dumps({'news_results': news}, ensure_ascii=False).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(body)

        except Exception as e:
            body = json.dumps({'error': str(e)}).encode('utf-8')
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(body)
