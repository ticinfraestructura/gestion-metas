const express = require('express');
const path = require('path');
const app = express();
const PORT = 3002;

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'build')));

// Ruta para el frontend (servirá la app React)
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'frontend', 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 Frontend simple corriendo en http://localhost:${PORT}`);
  console.log(`🔥 Backend API en http://localhost:3001/api`);
  console.log(`📱 Abre tu navegador en: http://localhost:${PORT}`);
});
