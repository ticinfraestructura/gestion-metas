# Documentación Técnica de Instalación
## Sistema de Gestión de Metas y Contratistas

**Versión:** 1.0.0  
**Fecha:** Abril 2026  
**Estado:** Producción (Servidor Minimal)

---

## Tabla de Contenidos

1. [Descripción del Sistema](#1-descripción-del-sistema)
2. [Prerrequisitos](#2-prerrequisitos)
3. [Estructura del Proyecto](#3-estructura-del-proyecto)
4. [Instalación Paso a Paso](#4-instalación-paso-a-paso)
5. [Variables de Entorno](#5-variables-de-entorno)
6. [Inicio del Sistema](#6-inicio-del-sistema)
7. [Credenciales por Defecto](#7-credenciales-por-defecto)
8. [API Endpoints](#8-api-endpoints)
9. [Comportamiento de Sesión y Roles](#9-comportamiento-de-sesión-y-roles)
10. [Notas sobre Persistencia de Datos](#10-notas-sobre-persistencia-de-datos)
11. [Troubleshooting](#11-troubleshooting)
12. [Inicio Rápido (Windows)](#12-inicio-rápido-windows)

---

## 1. Descripción del Sistema

Aplicación web para la **gestión integral de metas, contratistas, alcances y avances** de obra o proyectos. Permite registrar el progreso de cada meta mediante avances periódicos reportados por los contratistas asignados, con cálculo automático de porcentaje de completación y visualización en dashboard.

### Módulos disponibles

| Módulo | Descripción |
|--------|-------------|
| **Dashboard** | KPIs consolidados: totales, promedios de completación, avances recientes y gráfico de barras por meta |
| **Metas** | CRUD de metas con código, estado, fecha límite y % de completación calculado dinámicamente |
| **Contratistas** | CRUD de empresas contratistas con panel de alcances asignados por meta |
| **Avances** | Registro de avances con porcentaje de avance (slider 0–100%), adjunto de archivo, vinculación a meta y alcance |
| **Alcances** | Asignación de contratistas a metas con periodicidad, fechas y porcentaje de responsabilidad |
| **Usuarios** | CRUD de usuarios del sistema (visible solo para rol ADMIN) |
| **Login** | Autenticación con email y contraseña, opción "Recordar mi correo" |

### Arquitectura real del sistema

```
┌─────────────────────┐         HTTP/REST          ┌──────────────────────────┐
│   Frontend          │ ──────────────────────────▶ │   Backend                │
│   React 18 + TS     │       localhost:3001        │   Node.js + Express      │
│   Tailwind CSS      │ ◀────────────────────────── │   server-minimal.js      │
│   Zustand (estado)  │         JSON API            │   Datos en memoria RAM   │
│   Puerto: 3000      │                             │   Puerto: 3001           │
└─────────────────────┘                             └──────────────────────────┘
```

> ⚠️ **Importante:** El sistema **no utiliza base de datos**. Todos los datos se almacenan en memoria RAM del proceso Node.js. Los datos se reinician al reiniciar el backend. Los archivos subidos en Avances sí persisten en disco (`backend/uploads/`).

---

## 2. Prerrequisitos

### Software requerido

| Software | Versión mínima | Verificar con |
|----------|---------------|---------------|
| **Node.js** | 18.0.0 | `node --version` |
| **npm** | 9.0.0 | `npm --version` |
| **Navegador** | Chrome 90+, Firefox 88+, Edge 90+ | — |

### Puertos requeridos

| Puerto | Servicio | Protocolo |
|--------|----------|-----------|
| **3000** | Frontend React | HTTP |
| **3001** | Backend API | HTTP |

Verificar que los puertos estén libres antes de iniciar:

```powershell
# Windows PowerShell
netstat -ano | findstr ":3000 :3001"
```

```bash
# Linux / macOS
lsof -i :3000 -i :3001
```

### Instalación de Node.js

Si no tiene Node.js instalado, descargarlo desde https://nodejs.org (versión LTS recomendada).

Verificar instalación:
```bash
node --version   # debe mostrar v18.x.x o superior
npm --version    # debe mostrar 9.x.x o superior
```

---

## 3. Estructura del Proyecto

```
gestion-metas/
│
├── backend/
│   ├── src/
│   │   └── server-minimal.js     ← Servidor Express (único archivo activo del backend)
│   ├── uploads/                  ← Archivos subidos por usuarios (se crea automáticamente)
│   ├── package.json
│   └── node_modules/             ← Dependencias (se genera con npm install)
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx         ← Pantalla de inicio de sesión
│   │   │   ├── Dashboard.tsx     ← Estadísticas y KPIs
│   │   │   ├── Metas.tsx         ← Gestión de metas
│   │   │   ├── Contratistas.tsx  ← Gestión de contratistas y alcances
│   │   │   ├── Avances.tsx       ← Registro de avances
│   │   │   ├── Usuarios.tsx      ← Gestión de usuarios (solo ADMIN)
│   │   │   ├── Reportes.tsx      ← Reportes
│   │   │   └── Perfil.tsx        ← Perfil de usuario
│   │   ├── components/
│   │   │   └── Layout.tsx        ← Navegación lateral y estructura principal
│   │   ├── store/
│   │   │   └── authStore.ts      ← Estado global de autenticación (Zustand)
│   │   ├── services/
│   │   │   └── api.ts            ← Cliente HTTP hacia el backend (Axios)
│   │   └── types/
│   │       └── index.ts          ← Tipos TypeScript compartidos
│   ├── public/
│   ├── package.json
│   └── node_modules/             ← Dependencias (se genera con npm install)
│
├── INICIO-RAPIDO.bat             ← Script de inicio automático (Windows)
├── INSTALACION.md                ← Este documento
└── README.md                     ← Descripción general del proyecto
```

---

## 4. Instalación Paso a Paso

### Paso 1 — Obtener el código fuente

Si tiene acceso al repositorio Git:
```bash
git clone <url-del-repositorio> gestion-metas
cd gestion-metas
```

Si recibió el código como archivo comprimido, descomprímalo en la carpeta deseada.

### Paso 2 — Instalar dependencias del Backend

Abrir una terminal y ejecutar:

```bash
cd backend
npm install
```

Dependencias clave que se instalarán:

| Paquete | Versión | Función |
|---------|---------|---------|
| `express` | ^4.18.2 | Servidor HTTP y enrutamiento |
| `cors` | ^2.8.5 | Habilitar peticiones desde el frontend |
| `multer` | ^2.1.1 | Subida de archivos (imágenes, PDF, documentos) |

### Paso 3 — Instalar dependencias del Frontend

En una **nueva terminal** (mantener la del backend separada):

```bash
cd frontend
npm install
```

Dependencias clave que se instalarán:

| Paquete | Versión | Función |
|---------|---------|---------|
| `react` | ^18.2.0 | Framework de UI |
| `react-router-dom` | ^6.18.0 | Enrutamiento entre páginas |
| `zustand` | ^4.4.6 | Manejo de estado global (autenticación) |
| `axios` | ^1.6.0 | Cliente HTTP para llamadas a la API |
| `tailwindcss` | ^3.3.5 | Estilos CSS utilitarios |
| `lucide-react` | ^0.292.0 | Iconografía |

> ⚠️ La instalación puede tardar 2–5 minutos dependiendo de la velocidad de internet. Es normal ver advertencias (`npm warn`) durante el proceso.

---

## 5. Variables de Entorno

### Backend

El backend no requiere archivo `.env`. Los valores se configuran como variables de entorno del sistema operativo o al ejecutar el comando.

| Variable | Valor por defecto | Descripción |
|----------|------------------|-------------|
| `PORT` | `3001` | Puerto del servidor Express |

Ejemplo para cambiar el puerto:
```powershell
# Windows
set PORT=3001 && node src/server-minimal.js
```
```bash
# Linux / macOS
PORT=3001 node src/server-minimal.js
```

### Frontend

Crear el archivo `frontend/.env` basándose en `frontend/.env.example`:

```bash
# Copiar el archivo de ejemplo
copy frontend\.env.example frontend\.env   # Windows
cp frontend/.env.example frontend/.env    # Linux/macOS
```

Contenido del archivo `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_ENV=development
```

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `REACT_APP_API_URL` | `http://localhost:3001/api` | URL base de la API del backend |
| `REACT_APP_ENV` | `development` | Entorno de ejecución |

> ℹ️ Si el frontend se sirve desde un dominio diferente al backend, actualizar `REACT_APP_API_URL` con la URL correcta.

---

## 6. Inicio del Sistema

### Método A — Manual (dos terminales)

**Terminal 1 — Iniciar el Backend:**
```bash
cd backend
node src/server-minimal.js
```

Salida esperada:
```
🚀 Servidor backend corriendo en puerto 3001
📊 API disponible en: http://localhost:3001/api
🏥 Health check: http://localhost:3001/health
```

**Terminal 2 — Iniciar el Frontend:**

```powershell
# Windows
cd frontend
set PORT=3000 && npm start
```
```bash
# Linux / macOS
cd frontend
PORT=3000 npm start
```

Salida esperada (puede tardar 30–60 segundos la primera vez):
```
webpack compiled successfully
No issues found.
```

El navegador se abrirá automáticamente en `http://localhost:3000`. Si no abre, navegue manualmente a esa URL.

### Método B — Script automático (solo Windows)

Ejecutar el archivo `INICIO-RAPIDO.bat` en la raíz del proyecto haciendo doble clic o desde consola:

```cmd
INICIO-RAPIDO.bat
```

Este script inicia automáticamente el backend (puerto 3001) y el frontend. Presionar cualquier tecla detiene ambos servicios.

### Verificación del sistema

Una vez iniciados ambos servicios, verificar su estado:

| URL | Respuesta esperada |
|-----|-------------------|
| `http://localhost:3001/health` | `{"status":"ok","timestamp":"..."}` |
| `http://localhost:3001/api/metas` | `{"success":true,"data":[...]}` |
| `http://localhost:3000` | Pantalla de inicio de sesión |

---

## 7. Credenciales por Defecto

El sistema incluye **5 usuarios precargados** en memoria al iniciar:

| # | Nombre | Email | Contraseña | Rol | Estado |
|---|--------|-------|-----------|-----|--------|
| 1 | Administrador | `admin@gestionmetas.com` | `admin123` | **ADMIN** | Activo |
| 2 | Usuario Prueba | `usuario@gestionmetas.com` | `user123` | USUARIO | Activo |
| 3 | Ana Rodríguez | `ana@gestionmetas.com` | `ana123` | USUARIO | Activo |
| 4 | Carlos Méndez | `carlos@gestionmetas.com` | `carlos123` | USUARIO | Activo |
| 5 | Laura Gómez | `laura@gestionmetas.com` | `laura123` | ADMIN | **Inactivo** |

> ⚠️ **Seguridad:** Estas credenciales son para entorno de desarrollo/pruebas. Cambiarlas antes de desplegar en producción usando el módulo de Gestión de Usuarios.

> ⚠️ El **usuario Administrador (ID 1)** no puede ser eliminado por el sistema como medida de protección.

---

## 8. API Endpoints

URL base: `http://localhost:3001/api`

### Autenticación

| Método | Ruta | Descripción | Body requerido |
|--------|------|-------------|----------------|
| `POST` | `/auth/login` | Iniciar sesión | `{ email, password }` |

**Respuesta exitosa de login:**
```json
{
  "success": true,
  "data": {
    "usuario": { "id": 1, "nombre": "Administrador", "email": "...", "rol": "ADMIN", "estado": "ACTIVO" },
    "token": "mock-jwt-token-...",
    "refreshToken": "mock-refresh-token-..."
  }
}
```

### Usuarios

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/users` | Listar todos los usuarios (sin contraseñas) |
| `GET` | `/users/:id` | Obtener usuario por ID |
| `POST` | `/users` | Crear nuevo usuario |
| `PUT` | `/users/:id` | Actualizar usuario (contraseña opcional) |
| `DELETE` | `/users/:id` | Eliminar usuario (ID 1 protegido) |

### Metas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/metas` | Listar metas (incluye `porcentaje_completacion` calculado) |
| `GET` | `/metas/:id` | Obtener meta por ID |
| `POST` | `/metas` | Crear meta (`nombre`, `descripcion`, `estado`, `fecha_limite`, `codigo` opcional) |
| `PUT` | `/metas/:id` | Actualizar meta |
| `DELETE` | `/metas/:id` | Eliminar meta |

**Estados de meta válidos:** `PENDIENTE`, `EN_PROGRESO`, `COMPLETADA`

### Contratistas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/contratistas` | Listar contratistas |
| `GET` | `/contratistas/:id` | Obtener contratista por ID |
| `POST` | `/contratistas` | Crear contratista (`nombre`, `identificacion`, `contacto` requeridos) |
| `PUT` | `/contratistas/:id` | Actualizar contratista |
| `DELETE` | `/contratistas/:id` | Eliminar contratista |

### Alcances

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/alcances` | Listar todos los alcances (con datos de meta y contratista) |
| `GET` | `/alcances/contratista/:id` | Alcances filtrados por contratista |
| `POST` | `/alcances` | Crear alcance (`contratistaId`, `metaId`, `descripcion`, `fecha_inicio`, `fecha_fin`, `periodicidad` requeridos) |
| `PUT` | `/alcances/:id` | Actualizar alcance |
| `DELETE` | `/alcances/:id` | Eliminar alcance |

**Periodicidades válidas:** `DIARIO`, `SEMANAL`, `QUINCENAL`, `MENSUAL`

### Avances

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/avances` | Listar avances |
| `GET` | `/avances?meta_id=:id` | Avances filtrados por meta |
| `POST` | `/avances` | Crear avance (con soporte de archivo adjunto vía `multipart/form-data`) |
| `PUT` | `/avances/:id` | Actualizar avance |
| `DELETE` | `/avances/:id` | Eliminar avance |

**Campo `porcentaje_avance`:** Número entero 0–100. El porcentaje de completación de una meta se calcula como el valor máximo de `porcentaje_avance` entre todos sus avances.

### Dashboard

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/dashboard/stats` | Estadísticas consolidadas |
| `GET` | `/health` | Health check del servidor |

**Respuesta de `/dashboard/stats`:**
```json
{
  "success": true,
  "data": {
    "totalMetas": 5,
    "metasCompletadas": 1,
    "metasEnProgreso": 3,
    "totalContratistas": 12,
    "totalAvances": 50,
    "totalAlcances": 13,
    "promedioCompletacion": 74
  }
}
```

### Archivos adjuntos

Los archivos se suben usando `multipart/form-data` al crear avances. El servidor los almacena en `backend/uploads/` y los sirve estáticamente en:

```
http://localhost:3001/uploads/<nombre-del-archivo>
```

**Tipos de archivo permitidos:** JPEG, JPG, PNG, GIF, PDF, DOC, DOCX, XLS, XLSX  
**Tamaño máximo:** 10 MB por archivo

---

## 9. Comportamiento de Sesión y Roles

### Ciclo de vida de la sesión

```
Abrir navegador → Pantalla de Login → Ingresar credenciales
      ↓
  Autenticación exitosa → Sesión guardada en sessionStorage
      ↓
  Navegar por la aplicación (sin re-autenticación)
      ↓
  Cerrar navegador / pestaña → Sesión eliminada automáticamente
      ↓
  Próxima apertura → Pantalla de Login nuevamente
```

| Evento | Resultado |
|--------|-----------|
| Refrescar página (`F5`) | ✅ Sesión persiste (mismo navegador) |
| Cerrar pestaña | ❌ Sesión eliminada |
| Cerrar navegador | ❌ Sesión eliminada |
| Abrir nueva pestaña | ❌ Debe iniciar sesión nuevamente |
| Click en "Cerrar sesión" | ❌ Sesión eliminada |

### Función "Recordar mi correo"

El checkbox **"Recordar mi correo"** en la pantalla de login guarda el email del usuario en `localStorage` para pre-rellenarlo en el próximo acceso. **No guarda la contraseña** ni extiende la duración de la sesión.

### Roles de usuario

| Rol | Módulos accesibles |
|-----|--------------------|
| **ADMIN** | Dashboard, Metas, Contratistas, Avances, Reportes, **Usuarios**, Perfil |
| **USUARIO** | Dashboard, Metas, Contratistas, Avances, Reportes, Perfil |

El módulo **Usuarios** solo aparece en el menú de navegación cuando el usuario autenticado tiene rol `ADMIN`.

---

## 10. Notas sobre Persistencia de Datos

### Datos en memoria (temporales)

Los siguientes datos se **pierden al reiniciar el backend**:

- Metas, contratistas, avances, alcances creados durante la sesión
- Usuarios nuevos o modificados
- Cambios de contraseñas

Al reiniciar el backend, el sistema carga automáticamente los datos de ejemplo precargados:
- 5 usuarios
- 5 metas (META-001 a META-005)
- 12 contratistas (CONT-001 a CONT-012)
- 13 alcances
- ~50 avances de ejemplo

### Archivos en disco (persistentes)

Los archivos subidos como adjuntos en Avances **sí persisten** en disco:

```
backend/uploads/
├── 1713456789123-456789.pdf
├── 1713456790456-789012.jpg
└── ...
```

Esta carpeta se crea automáticamente si no existe al iniciar el backend.

---

## 11. Troubleshooting

### El puerto 3001 ya está en uso

```powershell
# Windows — identificar el proceso
netstat -ano | findstr :3001

# Terminar el proceso (reemplazar <PID> con el número de proceso)
taskkill /PID <PID> /F
```

```bash
# Linux / macOS
lsof -ti:3001 | xargs kill -9
```

### El puerto 3000 ya está en uso

```powershell
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Si el puerto 3000 está permanentemente ocupado, usar un puerto alternativo:

```powershell
# Windows
set PORT=3002 && npm start
```

En ese caso, abrir el navegador en `http://localhost:3002`.

### El navegador muestra pantalla en blanco

1. Abrir las herramientas de desarrollador del navegador (`F12`)
2. Revisar la pestaña **Console** para ver errores
3. Limpiar el `sessionStorage` desde la pestaña **Application** → **Session Storage**
4. Recargar la página (`Ctrl + Shift + R`)

### Error "Cannot connect to server" o CORS

Verificar que el backend esté corriendo:
```bash
curl http://localhost:3001/health
# Debe responder: {"status":"ok","timestamp":"..."}
```

Si el backend no responde, reiniciarlo:
```bash
cd backend
node src/server-minimal.js
```

### `npm install` falla con errores de versión

Verificar que Node.js sea versión 18 o superior:
```bash
node --version
```

Si la versión es inferior a 18, actualizar Node.js desde https://nodejs.org.

### El frontend no compila (errores TypeScript)

```bash
cd frontend
npm install   # reinstalar dependencias
npm start     # volver a intentar
```

Si persisten errores, eliminar la carpeta `node_modules` y reinstalar:

```powershell
# Windows
rmdir /s /q frontend\node_modules
cd frontend
npm install
```

```bash
# Linux / macOS
rm -rf frontend/node_modules
cd frontend
npm install
```

### La sesión no cierra al recargar la página

Esto ocurre dentro de la misma sesión del navegador (comportamiento esperado). Para forzar un nuevo login:

1. Hacer clic en **"Cerrar sesión"** en el menú lateral
2. O abrir el navegador en modo incógnito
3. O cerrar completamente el navegador y volver a abrirlo

---

## 12. Inicio Rápido (Windows)

Para usuarios de Windows existe un script de inicio automático en la raíz del proyecto:

```
INICIO-RAPIDO.bat
```

**Cómo usarlo:**
1. Navegar a la carpeta raíz del proyecto en el Explorador de Windows
2. Hacer doble clic en `INICIO-RAPIDO.bat`
3. Se abrirán ventanas de terminal para el backend y frontend
4. Esperar a que ambos servicios estén listos (~15 segundos)
5. Abrir el navegador en `http://localhost:3000`
6. Presionar cualquier tecla en la ventana del script para detener todos los servicios

> ⚠️ **Requisito:** Las dependencias deben estar instaladas previamente con `npm install` en ambas carpetas (`backend/` y `frontend/`) antes de usar este script.

---

## Resumen de Comandos

```bash
# ── INSTALACIÓN (una sola vez) ──────────────────────────────────────
cd backend  &&  npm install
cd frontend &&  npm install

# ── INICIO DEL SISTEMA ──────────────────────────────────────────────
# Terminal 1 — Backend
cd backend
node src/server-minimal.js

# Terminal 2 — Frontend (Windows)
cd frontend
set PORT=3000 && npm start

# Terminal 2 — Frontend (Linux/macOS)
cd frontend
PORT=3000 npm start

# ── VERIFICACIÓN ────────────────────────────────────────────────────
# Health check del backend
curl http://localhost:3001/health

# ── ACCESO ──────────────────────────────────────────────────────────
# Abrir en el navegador:
http://localhost:3000

# Credenciales de administrador:
# Email:    admin@gestionmetas.com
# Password: admin123
```

---

*Documento generado para el Sistema de Gestión de Metas v1.0.0 — Arquitectura: Node.js + React (servidor minimal sin base de datos)*
