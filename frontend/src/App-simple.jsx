import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Componente simple de Login
function Login() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>Sistema de Gestión de Metas</h2>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h3>Iniciar Sesión</h3>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input 
            type="email" 
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            placeholder="admin@gestionmetas.com"
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Contraseña:</label>
          <input 
            type="password" 
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            placeholder="admin123"
          />
        </div>
        <button 
          onClick={() => alert('Login simulado - Backend debe estar en puerto 3001')}
          style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Iniciar Sesión
        </button>
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
          <p>Usuarios de prueba:</p>
          <p>Admin: admin@gestionmetas.com / admin123</p>
          <p>Usuario: usuario@gestionmetas.com / user123</p>
        </div>
      </div>
    </div>
  );
}

// Componente simple de Dashboard
function Dashboard() {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Total Metas</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>3</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Metas Activas</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>3</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Total Contratistas</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#17a2b8' }}>3</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>Total Avances</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>2</p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
