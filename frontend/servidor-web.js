const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3002;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Manejar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Determinar el archivo a servir
  let filePath = path.join(__dirname, req.url === '/' ? 'login-simple.html' : req.url);
  
  // Si no tiene extensión, intentar agregar .html
  if (!path.extname(filePath)) {
    filePath += '.html';
  }
  
  // Verificar si el archivo existe
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // Si no existe, servir login-simple.html
      filePath = path.join(__dirname, 'login-simple.html');
    }
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    // Leer y servir el archivo
    fs.readFile(filePath, (error, content) => {
      if (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error del servidor');
        return;
      }
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`🌐 Servidor web corriendo en http://localhost:${PORT}`);
  console.log(`📁 Sirviendo archivos de: ${__dirname}`);
  console.log(`🔥 Backend API en: http://localhost:3001/api`);
  console.log(`📱 Abre tu navegador en: http://localhost:${PORT}`);
  console.log(`📄 Página principal: http://localhost:${PORT}/login-simple.html`);
});

server.on('error', (err) => {
  console.error('Error al iniciar el servidor:', err);
});
