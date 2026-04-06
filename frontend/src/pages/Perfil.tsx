import React from 'react';
import { User, Mail, Shield, Calendar, Edit2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Perfil: React.FC = () => {
  const { usuario } = useAuthStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600">Información de tu cuenta</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card p-6">
            <div className="text-center">
              <div className="mx-auto h-20 w-20 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-primary-600" />
              </div>
              <h2 className="mt-4 text-xl font-medium text-gray-900">
                {usuario?.nombre}
              </h2>
              <p className="text-sm text-gray-600">{usuario?.email}</p>
              <div className="mt-4">
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  usuario?.rol === 'ADMIN' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {usuario?.rol === 'ADMIN' ? 'Administrador' : 'Usuario'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Información Personal</h3>
              <button className="btn-outline text-sm">
                <Edit2 className="h-4 w-4 mr-2" />
                Editar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo
                </label>
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-2" />
                  <input
                    type="text"
                    value={usuario?.nombre || ''}
                    readOnly
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  <input
                    type="email"
                    value={usuario?.email || ''}
                    readOnly
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol
                </label>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-gray-400 mr-2" />
                  <input
                    type="text"
                    value={usuario?.rol === 'ADMIN' ? 'Administrador' : 'Usuario' || ''}
                    readOnly
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <div className="flex items-center">
                  <div className={`h-4 w-4 rounded-full mr-2 ${
                    usuario?.estado === 'ACTIVO' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <input
                    type="text"
                    value={usuario?.estado || ''}
                    readOnly
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Registro
                </label>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <input
                    type="text"
                    value={usuario?.fecha_creacion ? new Date(usuario.fecha_creacion).toLocaleDateString('es-ES') : ''}
                    readOnly
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Último Acceso
                </label>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <input
                    type="text"
                    value={usuario?.ultimo_login ? new Date(usuario.ultimo_login).toLocaleDateString('es-ES') : 'Nunca'}
                    readOnly
                    className="input"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex">
                <Shield className="h-5 w-5 text-blue-400" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">
                    Validación de Email
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    {usuario?.email_validado 
                      ? 'Tu correo electrónico ha sido validado correctamente.' 
                      : 'Tu correo electrónico aún no ha sido validado. Revisa tu bandeja de entrada.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;
