# Guía de Despliegue

## Entorno Actual (Windows Local)

El sistema corre directamente en Windows sin Docker:

| Componente | Puerto | Inicio |
|-----------|--------|--------|
| MySQL 8.4 | 3306 | Automático (Task Scheduler) |
| Backend (Node.js + Prisma) | 3001 | Manual: `node src/server-mysql.js` |
| Frontend (React) | 3000 | Manual: `npm start` |

## Requisitos Previos

- Node.js 18+
- MySQL 8.4+ instalado y configurado
- npm 9+

## Variables de Entorno

Crear `backend/.env`:

```env
DATABASE_URL="mysql://root:@localhost:3306/gestion_metas"
PORT=3001
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
NODE_ENV="development"
```

> ⚠️ Este archivo **no se versiona en git**. Debe crearse manualmente en cada nueva instalación.

## Primera Instalación

### 1. Instalar dependencias

```powershell
cd backend  && npm install
cd frontend && npm install
```

### 2. Verificar MySQL

```powershell
netstat -an | findstr ":3306"
# Si no aparece, iniciar MySQL manualmente:
Start-Process -FilePath "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" -ArgumentList "--defaults-file=`"C:\ProgramData\MySQL\MySQL Server 8.4\my.ini`"" -WindowStyle Hidden
Start-Sleep -Seconds 4
```

### 3. Crear base de datos

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS gestion_metas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 4. Aplicar migraciones y seed

```powershell
cd backend
npx prisma migrate deploy
node seed-mysql.js
```

### 5. Iniciar servicios

```powershell
# Terminal 1 — Backend
cd backend
node src/server-mysql.js

# Terminal 2 — Frontend
cd frontend
npm start
```

## Inicio Diario

MySQL arranca con el equipo (Task Scheduler). Solo ejecutar:

```powershell
# Terminal 1
cd backend && node src/server-mysql.js

# Terminal 2
cd frontend && npm start
```

## Acceso

| Recurso | URL local | URL red local |
|---------|-----------|---------------|
| Frontend | http://localhost:3000 | http://192.168.1.34:3000 |
| Backend API | http://localhost:3001/api | http://192.168.1.34:3001/api |
| Health check | http://localhost:3001/health | — |

## Backup de Base de Datos

```powershell
# Exportar
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe" -u root gestion_metas > backup_$(Get-Date -Format 'yyyyMMdd').sql

# Restaurar
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root gestion_metas < backup.sql
```

## Actualización de Código

```powershell
git pull origin main

# Si hay cambios de esquema de BD:
cd backend
npx prisma migrate deploy
```

## MySQL — Configuración Auto-arranque (Windows)

MySQL está configurado para iniciar automáticamente mediante **Task Scheduler**:

- **Tarea:** `MySQL84-AutoStart`
- **Disparador:** Al iniciar Windows
- **Ejecutable:** `C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe`
- **Config:** `C:\ProgramData\MySQL\MySQL Server 8.4\my.ini`
- **Directorio de datos:** `C:\ProgramData\MySQL\MySQL Server 8.4\Data\`

Para verificar o modificar la tarea:
```powershell
Get-ScheduledTask -TaskName "MySQL84-AutoStart"
```

## Configuración Nginx (Producción)

Si se desea exponer la aplicación vía Nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /path/to/frontend/build;
        try_files $uri $uri/ /index.html;
    }
}
```

Para producción, construir el frontend primero:
```powershell
cd frontend
npm run build
# Los archivos quedan en frontend/build/
```

## Troubleshooting

### MySQL no responde (ECONNREFUSED 3306)

```powershell
# Verificar si está corriendo
netstat -an | findstr ":3306"

# Ver proceso
Get-Process -Name "mysqld" -ErrorAction SilentlyContinue

# Iniciar manualmente
Start-Process -FilePath "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" -ArgumentList "--defaults-file=`"C:\ProgramData\MySQL\MySQL Server 8.4\my.ini`"" -WindowStyle Hidden
```

### Puerto 3001 en uso

```powershell
# Identificar proceso
netstat -ano | findstr ":3001"
# Terminar proceso (reemplazar <PID>)
taskkill /PID <PID> /F
```

### Error de migraciones Prisma

```powershell
cd backend
# Regenerar cliente
npx prisma generate
# Re-aplicar migraciones
npx prisma migrate deploy
```
