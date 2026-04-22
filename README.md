# Aplicación de Gestión de Metas y Contratistas

Aplicación web para la gestión integral de metas, contratistas, alcances y avances de proyectos. Incluye autenticación JWT, dashboard de KPIs, reportes y persistencia real con MySQL.

## 🚀 Características

- ✅ **Persistencia Real**: MySQL 8.4 con Prisma ORM — los datos no se pierden al reiniciar
- ✅ **Autenticación JWT**: Login seguro con roles ADMIN y USUARIO
- ✅ **Gestión Completa**: CRUD para metas, contratistas, alcances, avances y usuarios
- ✅ **Dashboard Analytics**: KPIs consolidados, gráfico de barras y avances recientes
- ✅ **Reportes**: Tablas filtrables de metas, contratistas, avances y alcances
- ✅ **Archivos adjuntos**: Subida de imágenes y documentos en avances (hasta 10 MB)
- ✅ **Acceso en red local**: URL dinámica — funciona desde `localhost` y desde otros dispositivos en la misma red

## 🏗️ Arquitectura

```
┌─────────────────────┐         HTTP/REST          ┌──────────────────────────┐
│   Frontend          │ ──────────────────────────▶ │   Backend                │
│   React 18 + TS     │       localhost:3001        │   Node.js + Express      │
│   Tailwind CSS      │ ◀────────────────────────── │   server-mysql.js        │
│   Zustand (estado)  │         JSON API            │   Prisma ORM + MySQL 8.4 │
│   Puerto: 3000      │                             │   Puerto: 3001           │
└─────────────────────┘                             └──────────────────────────┘
                                                               │
                                                    ┌──────────────────────────┐
                                                    │   MySQL 8.4              │
                                                    │   Base de datos          │
                                                    │   Puerto: 3306           │
                                                    │   DB: gestion_metas      │
                                                    └──────────────────────────┘
```

- **Backend**: Node.js, Express.js, Prisma ORM, MySQL 8.4
- **Frontend**: React 18, TypeScript, Tailwind CSS, Zustand
- **Base de datos**: MySQL 8.4 local (auto-arranque vía Task Scheduler en Windows)

## 📁 Estructura del Proyecto

```
gestion-metas/
├── backend/
│   ├── src/
│   │   └── server-mysql.js      ← Servidor principal (Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma        ← Esquema MySQL (Prisma)
│   │   └── migrations/          ← Historial de migraciones
│   ├── seed-mysql.js            ← Datos iniciales de la BD
│   ├── uploads/                 ← Archivos adjuntos (persistentes)
│   ├── .env                     ← Variables de entorno (no versionado)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── config.ts            ← URL dinámica del API (red local / localhost)
│   │   ├── pages/               ← Dashboard, Metas, Contratistas, Avances, etc.
│   │   ├── components/          ← Layout y componentes reutilizables
│   │   ├── store/               ← Estado global de autenticación (Zustand)
│   │   └── services/api.ts      ← Cliente HTTP (Axios)
│   └── package.json
├── docs/
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── DEVELOPMENT.md
├── INSTALACION.md
└── README.md
```

## 🚀 Inicio Rápido

### Prerrequisitos

| Software | Versión mínima |
|----------|---------------|
| Node.js  | 18.0.0        |
| npm      | 9.0.0         |
| MySQL    | 8.0+          |

### Primera instalación

```powershell
# 1. Instalar dependencias
cd backend  && npm install
cd frontend && npm install

# 2. Configurar base de datos (backend/.env ya incluido)
# DATABASE_URL="mysql://root:@localhost:3306/gestion_metas"

# 3. Crear tablas y poblar datos iniciales
cd backend
npx prisma migrate deploy
node seed-mysql.js
```

### Inicio diario

```powershell
# Terminal 1 — Backend
cd backend
node src/server-mysql.js

# Terminal 2 — Frontend
cd frontend
npm start
```

> **Windows:** MySQL arranca automáticamente al encender el equipo (Task Scheduler). Solo necesitas iniciar el backend y el frontend.

## 🌐 Acceso a la Aplicación

| Recurso | URL local | URL red local |
|---------|-----------|---------------|
| **Frontend** | http://localhost:3000 | http://\<IP-del-servidor\>:3000 |
| **Backend API** | http://localhost:3001/api | http://\<IP-del-servidor\>:3001/api |
| **Health check** | http://localhost:3001/health | — |

> La IP del servidor en esta máquina es `192.168.1.34`.

### Usuarios por defecto

| Rol | Email | Contraseña |
|-----|-------|-----------|
| **ADMIN** | admin@gestionmetas.com | admin123 |
| **USUARIO** | usuario@gestionmetas.com | user123 |

## � Variables de Entorno (`backend/.env`)

```env
DATABASE_URL="mysql://root:@localhost:3306/gestion_metas"
PORT=3001
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
```

## 🛠️ Scripts del Backend

```bash
node src/server-mysql.js     # Iniciar servidor
npx prisma migrate dev       # Crear y aplicar migración
npx prisma migrate deploy    # Aplicar migraciones en producción
node seed-mysql.js           # Poblar BD con datos iniciales
npm run db:studio            # Abrir Prisma Studio (UI visual de BD)
npm run db:generate          # Regenerar cliente Prisma
```

## 🛠️ Scripts del Frontend

```bash
npm start        # Servidor de desarrollo (puerto 3000)
npm run build    # Build de producción
npm run lint     # Linting TypeScript
npm run format   # Formatear código
```

## �️ Datos Iniciales (seed)

Al ejecutar `node seed-mysql.js`:

| Entidad | Cantidad |
|---------|----------|
| Usuarios | 5 (2 ADMIN, 3 USUARIO) |
| Metas | 5 (META-001 a META-005) |
| Contratistas | 12 (CONT-001 a CONT-012) + NG |
| Alcances | 13 |
| Avances | 18 |

## 🔒 Seguridad

- Autenticación JWT (contraseñas en texto plano en modo dev — cambiar en producción)
- CORS habilitado para acceso desde red local
- Rate limiting en Express
- Prisma ORM previene SQL injection
- Archivos adjuntos: tipos permitidos JPEG/PNG/GIF/PDF/DOC/XLS, máximo 10 MB

## 💾 Persistencia de Datos

Todos los datos se almacenan en MySQL y **persisten entre reinicios**:

- Metas, contratistas, alcances, avances, usuarios → MySQL (`gestion_metas`)
- Archivos adjuntos → `backend/uploads/` (disco local)
- Configuración → `backend/.env` (no versionado en git)

## 🔄 Actualización

```powershell
git pull origin main

# Si hay cambios de esquema de BD:
cd backend
npx prisma migrate deploy
```

## � Documentación

- **[INSTALACION.md](INSTALACION.md)**: Guía completa de instalación paso a paso
- **[docs/API.md](docs/API.md)**: Endpoints y ejemplos de la API
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**: Guía de despliegue
- **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)**: Guía para desarrolladores

---

*Sistema de Gestión de Metas v1.1.0 — Node.js + React + MySQL 8.4 + Prisma ORM*
