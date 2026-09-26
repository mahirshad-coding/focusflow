"""
FocusFlow — Zero-Dependency Local Launcher
Runs a lightweight local web server and opens FocusFlow automatically in your browser.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable caching headers and service worker support
        self.send_header('Cache-Control', 'no-cache, must-revalidate')
        super().end_headers()

def main():
    os.chdir(DIRECTORY)
    
    # Try port 8000, or fallback to 8080 or next available
    port = PORT
    for attempt in range(5):
        try:
            with socketserver.TCPServer(("", port), Handler) as httpd:
                url = f"http://localhost:{port}/index.html"
                print("=" * 60)
                print(" [OK] FocusFlow is running!")
                print(f" [*] URL: {url}")
                print(" Press Ctrl+C in this terminal to stop the server.")
                print("=" * 60)
                
                # Open default browser
                try:
                    webbrowser.open(url)
                except Exception as e:
                    print(f"Could not open browser automatically: {e}")
                
                httpd.serve_forever()
                break
        except OSError:
            print(f"Port {port} in use, trying {port + 1}...")
            port += 1

if __name__ == '__main__':
    main()
