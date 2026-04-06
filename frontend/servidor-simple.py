#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys

PORT = 3002
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

if __name__ == "__main__":
    os.chdir(DIRECTORY)
    
    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print(f"🌐 Servidor web corriendo en http://localhost:{PORT}")
            print(f"📁 Sirviendo archivos de: {DIRECTORY}")
            print(f"🔥 Backend API en: http://localhost:3001/api")
            print(f"📱 Abre tu navegador en: http://localhost:{PORT}")
            print(f"📄 Login en: http://localhost:{PORT}/login-simple.html")
            print("Presiona Ctrl+C para detener el servidor")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Servidor detenido")
    except Exception as e:
        print(f"❌ Error al iniciar servidor: {e}")
        print(f"🔧 Posibles soluciones:")
        print(f"   1. Verifica que el puerto {PORT} esté libre")
        print(f"   2. Ejecuta como administrador")
        print(f"   3. Verifica que Python esté instalado")
