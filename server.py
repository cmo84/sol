import http.server
import socket
import socketserver

PORT = 8000
HOST = "0.0.0.0"

# --- This block finds your local IP address ---
s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
try:
    # doesn't even have to be reachable
    s.connect(('10.255.255.255', 1))
    IP = s.getsockname()[0]
except Exception:
    IP = '127.0.0.1'
finally:
    s.close()
# ------------------------------------------

Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer((HOST, PORT), Handler) as httpd:
    print("Serving at:")
    print(f"http://{IP}:{PORT}")
    print(f"http://localhost:{PORT}")
    httpd.serve_forever()