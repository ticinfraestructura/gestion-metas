# Guía de Deployment en Producción con Docker

> **Objetivo:** Desplegar Gestión de Metas en un servidor Linux usando Docker y Docker Compose.  
> **Arquitectura:** 3 contenedores (MySQL 8 · Backend Node.js 18 · Frontend React + Nginx)  
> **Tiempo estimado total:** 45–90 minutos (primera vez)

---

## ✅ Lista de Verificación Pre-Deployment

Antes de empezar, confirma que tienes:

- [ ] Acceso SSH al servidor (IP + usuario + contraseña o llave .pem)
- [ ] El código fuente del proyecto (repositorio Git o carpeta comprimida)
- [ ] IP pública o dominio del servidor anotado
- [ ] Contraseñas seguras definidas para MySQL (no usar las de desarrollo)
- [ ] Puerto 80 y 22 abiertos en el firewall del proveedor cloud

---

## Índice

1. [Aprovisionar el Servidor](#1-aprovisionar-el-servidor)
2. [Conectarse al Servidor por SSH](#2-conectarse-al-servidor-por-ssh)
3. [Configurar el Firewall del Servidor](#3-configurar-el-firewall-del-servidor)
4. [Instalar Docker y Docker Compose](#4-instalar-docker-y-docker-compose)
5. [Subir el Proyecto al Servidor](#5-subir-el-proyecto-al-servidor)
6. [Crear el Archivo de Variables de Entorno](#6-crear-el-archivo-de-variables-de-entorno)
7. [Crear docker-compose.prod.yml](#7-crear-docker-composeprodyml)
8. [Construir e Iniciar los Contenedores](#8-construir-e-iniciar-los-contenedores)
9. [Inicializar la Base de Datos](#9-inicializar-la-base-de-datos)
10. [Verificar que Todo Funciona](#10-verificar-que-todo-funciona)
11. [Configurar Dominio y HTTPS](#11-configurar-dominio-y-https)
12. [Configurar Backups Automáticos](#12-configurar-backups-automáticos)
13. [Proceso de Actualización](#13-proceso-de-actualización)
14. [Comandos de Mantenimiento Diario](#14-comandos-de-mantenimiento-diario)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Requisitos del Servidor

### Especificaciones mínimas recomendadas

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 2 GB | 4 GB |
| Disco | 20 GB | 40 GB SSD |
| SO | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

### Puertos requeridos en el firewall

```
22    → SSH
80    → HTTP (Frontend)
443   → HTTPS (si se usa SSL)
3001  → Backend API (solo si se expone directamente)
3306  → MySQL (NO exponer al público, solo interno)
```

---

## 2. Instalación de Docker en el Servidor

Conectarse al servidor vía SSH y ejecutar:

```bash
# Actualizar paquetes
sudo apt update && sudo apt upgrade -y

# Instalar dependencias
sudo apt install -y ca-certificates curl gnupg

# Agregar repositorio oficial de Docker
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker Engine y Docker Compose
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Permitir ejecutar Docker sin sudo (cerrar sesión SSH y volver a entrar después)
sudo usermod -aG docker $USER

# Verificar instalación
docker --version
docker compose version
```

---

## 3. Preparar el Proyecto

### Opción A — Clonar desde Git (recomendado)

```bash
# En el servidor, crear directorio de trabajo
mkdir -p /opt/gestion-metas
cd /opt/gestion-metas

# Clonar el repositorio
git clone <URL_DEL_REPOSITORIO> .
```

### Opción B — Subir archivos por SCP desde Windows

```powershell
# Desde PowerShell en tu máquina Windows
# Comprimir el proyecto (excluyendo node_modules)
Compress-Archive -Path "C:\Users\Administrador\CascadeProjects\gestion-metas\*" `
  -DestinationPath "gestion-metas.zip" `
  -CompressionLevel Optimal

# Subir al servidor
scp gestion-metas.zip usuario@IP_SERVIDOR:/opt/gestion-metas/
```

```bash
# En el servidor
cd /opt/gestion-metas
unzip gestion-metas.zip
```

---

## 4. Configurar Variables de Entorno

Crear el archivo `.env` en la raíz del proyecto en el servidor:

```bash
cd /opt/gestion-metas
nano .env
```

Contenido del archivo `.env`:

```env
# ── Base de datos ─────────────────────────────────────────
MYSQL_ROOT_PASSWORD=TuPasswordRootSeguro2024!
MYSQL_DATABASE=gestion_metas
MYSQL_USER=gestion_user
MYSQL_PASSWORD=TuPasswordUserSeguro2024!

# ── Backend ───────────────────────────────────────────────
JWT_SECRET=clave-jwt-super-secreta-cambiar-en-produccion-min32chars
NODE_ENV=production
PORT=3001

# ── URL pública del servidor ──────────────────────────────
# IMPORTANTE: Reemplazar con la IP real o dominio del servidor
SERVER_IP=192.168.X.X
# Si tienes dominio: SERVER_IP=tudominio.com
```

> ⚠️ **IMPORTANTE:** Este archivo `.env` **nunca debe subirse a Git**. Contiene contraseñas de producción.

---

## 5. Ajustar docker-compose para Producción

El `docker-compose.yml` existente tiene un valor hardcodeado para la URL del API que debe cambiarse.  
Crear un archivo `docker-compose.prod.yml` que sobreescriba ese valor:

```bash
cd /opt/gestion-metas
nano docker-compose.prod.yml
```

Contenido:

```yaml
version: '3.8'

services:

  mysql:
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}

  backend:
    environment:
      PORT: ${PORT:-3001}
      NODE_ENV: production
      DATABASE_URL: mysql://${MYSQL_USER}:${MYSQL_PASSWORD}@mysql:3306/${MYSQL_DATABASE}
      JWT_SECRET: ${JWT_SECRET}
    # En producción NO ejecutar seed en cada arranque
    command: >
      sh -c "npx prisma db push &&
             node src/server-mysql.js"

  frontend:
    build:
      args:
        # CRÍTICO: apunta a la IP/dominio real del servidor
        REACT_APP_API_URL: http://${SERVER_IP}:3001/api
    ports:
      - "80:80"
```

> ⚠️ **Por qué es crítico `REACT_APP_API_URL`:**  
> El frontend React se compila como archivos estáticos. La URL del API queda **embebida en el build**.  
> Si se deja `localhost`, el navegador del cliente intentará conectar a su propia máquina, no al servidor.

---

## 6. Construir e Iniciar los Contenedores

```bash
cd /opt/gestion-metas

# Construir imágenes y levantar en segundo plano
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Ver progreso del inicio (Ctrl+C para salir sin detener contenedores)
docker compose logs -f
```

### Secuencia automática de inicio

Los contenedores arrancan en orden gracias a `depends_on` + `healthcheck`:

```
1. mysql          → espera hasta estar healthy (~30 seg)
2. backend        → ejecuta prisma db push → inicia servidor
3. frontend       → sirve el build React via Nginx
```

### Primera inicialización (solo la primera vez)

Después del primer arranque, cargar los datos iniciales:

```bash
# Ejecutar seed de datos iniciales
docker exec gestion-metas-backend node seed-mysql.js
```

---

## 7. Verificar el Deployment

```bash
# Ver estado de los 3 contenedores
docker compose ps

# Salida esperada:
# NAME                      STATUS          PORTS
# gestion-metas-mysql       Up (healthy)    0.0.0.0:3306->3306/tcp
# gestion-metas-backend     Up (healthy)    0.0.0.0:3001->3001/tcp
# gestion-metas-frontend    Up              0.0.0.0:80->80/tcp

# Verificar API del backend
curl http://localhost:3001/health

# Ver logs de cada contenedor individualmente
docker logs gestion-metas-backend --tail 50
docker logs gestion-metas-mysql --tail 20
docker logs gestion-metas-frontend --tail 20
```

### Acceso desde el navegador

| Recurso | URL |
|---------|-----|
| Aplicación web | `http://IP_SERVIDOR` |
| API Backend | `http://IP_SERVIDOR:3001/api` |
| Health check | `http://IP_SERVIDOR:3001/health` |

---

## 8. Configurar Dominio y HTTPS

### 8.1 Apuntar el dominio al servidor

En tu proveedor DNS, crear un registro tipo A:
```
Tipo: A
Nombre: @ (o subdominio: app)
Valor: IP_DEL_SERVIDOR
TTL: 3600
```

### 8.2 Instalar Certbot para SSL gratuito (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado (el dominio debe apuntar al servidor)
sudo certbot --nginx -d tudominio.com

# Renovación automática (se configura sola, verificar)
sudo certbot renew --dry-run
```

### 8.3 Actualizar nginx.conf del frontend para HTTPS

Editar `frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name tudominio.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name tudominio.com;

    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

Luego reconstruir el frontend:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build frontend
```

---

## 9. Estrategia de Backup

### Backup manual de la base de datos

```bash
# Crear directorio de backups
mkdir -p /opt/backups/gestion-metas

# Ejecutar dump (con el contenedor corriendo)
docker exec gestion-metas-mysql mysqldump \
  -u gestion_user -p"TuPasswordUserSeguro2024!" \
  gestion_metas > /opt/backups/gestion-metas/backup_$(date +%Y%m%d_%H%M).sql

echo "Backup completado: backup_$(date +%Y%m%d_%H%M).sql"
```

### Backup automático diario con cron

```bash
# Crear script de backup
cat > /opt/backups/backup-gestion-metas.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/gestion-metas"
DATE=$(date +%Y%m%d_%H%M)
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

docker exec gestion-metas-mysql mysqldump \
  -u gestion_user -p"TuPasswordUserSeguro2024!" \
  gestion_metas > "$BACKUP_DIR/backup_$DATE.sql"

# Comprimir
gzip "$BACKUP_DIR/backup_$DATE.sql"

# Eliminar backups más antiguos de 30 días
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "[$DATE] Backup completado: backup_$DATE.sql.gz"
EOF

chmod +x /opt/backups/backup-gestion-metas.sh

# Programar en cron: todos los días a las 2:00 AM
crontab -e
# Agregar esta línea:
# 0 2 * * * /opt/backups/backup-gestion-metas.sh >> /var/log/backup-gestion-metas.log 2>&1
```

### Restaurar un backup

```bash
# Copiar el archivo .sql al contenedor y restaurar
docker exec -i gestion-metas-mysql mysql \
  -u gestion_user -p"TuPasswordUserSeguro2024!" \
  gestion_metas < /opt/backups/gestion-metas/backup_YYYYMMDD_HHMM.sql
```

---

## 10. Actualizar la Aplicación

```bash
cd /opt/gestion-metas

# 1. Obtener últimos cambios del repositorio
git pull origin main

# 2. Reconstruir imágenes con los cambios
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# 3. Si hubo cambios de esquema en la base de datos
docker exec gestion-metas-backend npx prisma db push

# 4. Verificar que todo sigue corriendo
docker compose ps
```

> El proceso de rebuild tarda unos 2-5 minutos. Durante ese tiempo el servicio puede estar caído brevemente.

---

## 11. Comandos de Mantenimiento

```bash
# Ver todos los contenedores y su estado
docker compose ps

# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un contenedor específico
docker logs gestion-metas-backend -f --tail 100

# Reiniciar un contenedor específico
docker compose restart backend
docker compose restart frontend
docker compose restart mysql

# Detener todo el sistema
docker compose down

# Detener y eliminar volúmenes (⚠️ BORRA LA BASE DE DATOS)
docker compose down -v

# Entrar al contenedor del backend (para debugging)
docker exec -it gestion-metas-backend sh

# Entrar al cliente MySQL
docker exec -it gestion-metas-mysql mysql -u gestion_user -p gestion_metas

# Ver uso de disco de los volúmenes
docker system df

# Limpiar imágenes y contenedores no usados
docker system prune -f
```

---

## 12. Troubleshooting

### El backend no conecta con MySQL

```bash
# Verificar que MySQL está healthy
docker inspect gestion-metas-mysql | grep -A5 Health

# Ver logs de MySQL
docker logs gestion-metas-mysql --tail 30

# Verificar conectividad interna
docker exec gestion-metas-backend ping mysql
```

### El frontend muestra errores de conexión al API

```bash
# Verificar que REACT_APP_API_URL quedó correcta en el build
docker exec gestion-metas-frontend grep -r "REACT_APP_API_URL" /usr/share/nginx/html/ 2>/dev/null | head -3

# Si la URL es incorrecta, reconstruir con la IP correcta
SERVER_IP=<IP_CORRECTA>
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build frontend
```

### Puerto 80 ya en uso

```bash
# Ver qué proceso usa el puerto 80
sudo lsof -i :80
sudo systemctl stop apache2   # si hay Apache instalado
sudo systemctl disable apache2
```

### Espacio en disco lleno

```bash
# Ver uso actual
df -h
docker system df

# Limpiar imágenes antiguas
docker image prune -a -f

# Ver tamaño de los volúmenes
du -sh /var/lib/docker/volumes/gestion-metas_mysql_data
```

### Reiniciar todo el sistema desde cero (⚠️ DESTRUCTIVO)

```bash
# ADVERTENCIA: esto elimina todos los datos de la base de datos
docker compose down -v
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker exec gestion-metas-backend node seed-mysql.js
```

---

## Resumen del Proceso Completo

```
1. Aprovisionar servidor Ubuntu 22.04
2. Instalar Docker + Docker Compose
3. Clonar/subir el proyecto a /opt/gestion-metas
4. Crear archivo .env con credenciales de producción
5. Crear docker-compose.prod.yml con SERVER_IP correcto
6. docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
7. docker exec gestion-metas-backend node seed-mysql.js  (solo primera vez)
8. Verificar en http://IP_SERVIDOR
9. (Opcional) Configurar dominio + SSL con Certbot
10. Configurar cron para backups diarios
```

---

*Última actualización: Mayo 2026*  
*Versión del stack: Node.js 18 · MySQL 8.0 · React 18 · Nginx Alpine · Docker Compose v2*
