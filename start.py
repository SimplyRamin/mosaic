# =================================================================================================
#                                           Written by Ramin F.
#                                   for Tabiat Makan Industrial Group
# =================================================================================================

import subprocess
import sys
import ssl
import http.server
import socketserver
import threading
from pathlib import Path

ROOT = Path(__file__).parent
FRONTEND = ROOT / "frontend"
BACKEND = ROOT / "backend"
CERT = FRONTEND / "localhost+2.pem"
KEY = FRONTEND / "localhost+2-key.pem"

FRONTEND_PORT = 8443
BACKEND_PORT  = 8001

def check_certs():
    if not CERT.exists() or not KEY.exists():
        print("SSL certificates not found in frontend/")
        print("Run mkcert first - see docs/setup.md")
        sys.exit(1)

def start_frontend():
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(FRONTEND), **kwargs)

        def end_headers(self):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            super().end_headers()
        
        def log_mesage(self, format, *args):
            print(f"[Frontend] {self.address_string()} - {format % args}")
        
        def log_error(self, format, *args):
            pass
    
    class ThreadedServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
        allow_reuse_address = True
        daemon_threads = True
    
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(str(CERT), str(KEY))
    context.minimum_version = ssl.TLSVersion.TLSv1_2

    server = ThreadedServer(('0.0.0.0', FRONTEND_PORT), Handler)
    server.socket = context.wrap_socket(server.socket, server_side=True)

    thread = threading.Thread(target=server.serve_forever)
    thread.daemon = True
    thread.start()
    print(f"[Frontend] Running at https://localhost:{FRONTEND_PORT}")
    return server


def start_backend():
    process = subprocess.Popen(
        [
            "uv", "run", "uvicorn", "main:app",
            "--reload",
            "--port", str(BACKEND_PORT),
            "--ssl-keyfile", str(KEY),
            "--ssl-certfile", str(CERT)
        ],
        cwd=BACKEND
    )
    print(f"[Backend] Running at https://localhost:{BACKEND_PORT}/docs")
    return process


if __name__ == "__main__":
    check_certs()

    print("\n Makan+ Development server")
    print("-" * 40)

    start_frontend()
    backend = start_backend()

    print("-" * 40)
    print("Press Ctrl+C to stop\n")

    try:
        backend.wait()
    except KeyboardInterrupt:
        print("\nStopping servers...")
        backend.terminate()
        backend.wait()
        print("Done")