import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Metas from './pages/Metas';
import Contratistas from './pages/Contratistas';
import Avances from './pages/Avances';
import Perfil from './pages/Perfil';
import Reportes from './pages/Reportes';
import Usuarios from './pages/Usuarios';
import Actividades from './pages/Actividades';

function App() {
  const { isAuthenticated, token } = useAuthStore();

  if (!isAuthenticated || !token) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/metas" element={<Metas />} />
          <Route path="/contratistas" element={<Contratistas />} />
          <Route path="/avances" element={<Avances />} />
          <Route path="/actividades" element={<Actividades />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/usuarios" element={<Usuarios />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
