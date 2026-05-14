# Guía Completa de Deployment en Producción — Docker

> **Sistema:** Gestión de Metas  
> **Arquitectura:** 3 contenedores Docker (MySQL 8 · Backend Node.js 18 · Frontend React + Nginx)  
> **Sistema Operativo del Servidor:** Ubuntu 22.04 LTS  
> **Tiempo estimado total:** 60–90 minutos (primera vez)

---

## ✅ Lista de Verificación Pre-Deployment

Completa esta lista ANTES de empezar. Cada ítem debe estar listo:

- [ ] Tienes un servidor Ubuntu 22.04 LTS con IP pública
- [ ] Tienes acceso SSH al servidor (usuario + contraseña o archivo .pem)
- [ ] Tienes la IP pública del servidor anotada (ej: `45.67.89.100`)
- [ ] Tienes el código fuente del proyecto disponible (Git o carpeta)
- [ ] Tienes definidas contraseñas seguras para MySQL de producción
- [ ] El puerto 22 (SSH) y 80 (HTTP) están abiertos en el panel del proveedor cloud
- [ ] (Opcional) Tienes un dominio apuntando al servidor si vas a usar HTTPS

---

## Índice

1. [Especificaciones del Servidor](#1-especificaciones-del-servidor)
2. [Conectarse al Servidor por SSH](#2-conectarse-al-servidor-por-ssh)
3. [Preparar el Sistema Operativo](#3-preparar-el-sistema-operativo)
4. [Configurar el Firewall (UFW)](#4-configurar-el-firewall-ufw)
5. [Instalar Docker y Docker Compose](#5-instalar-docker-y-docker-compose)
6. [Subir el Proyecto al Servidor](#6-subir-el-proyecto-al-servidor)
7. [Crear el Archivo de Variables de Entorno (.env)](#7-crear-el-archivo-de-variables-de-entorno-env)
8. [Crear el docker-compose.prod.yml](#8-crear-el-docker-composeprodyml)
9. [Construir e Iniciar los Contenedores](#9-construir-e-iniciar-los-contenedores)
10. [Inicializar la Base de Datos](#10-inicializar-la-base-de-datos)
11. [Verificar que Todo Funciona](#11-verificar-que-todo-funciona)
12. [Configurar Dominio y HTTPS con SSL](#12-configurar-dominio-y-https-con-ssl)
13. [Configurar Backups Automáticos](#13-configurar-backups-automáticos)
14. [Configurar Auto-reinicio al Reiniciar el Servidor](#14-configurar-auto-reinicio-al-reiniciar-el-servidor)
15. [Proceso de Actualización del Sistema](#15-proceso-de-actualización-del-sistema)
16. [Comandos de Mantenimiento Diario](#16-comandos-de-mantenimiento-diario)
17. [Troubleshooting — Errores Comunes](#17-troubleshooting--errores-comunes)

---

## 1. Especificaciones del Servidor

### Hardware mínimo recomendado

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 2 GB | 4 GB |
| Disco | 20 GB SSD | 40 GB SSD |
| SO | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| Transferencia | 1 TB/mes | Sin límite |

### Proveedores cloud recomendados

| Proveedor | Producto sugerido | Costo aprox. |
|-----------|-------------------|--------------|
| DigitalOcean | Droplet Basic 2GB | USD $12/mes |
| AWS | EC2 t3.small | USD $15/mes |
| Hetzner | CX21 | EUR $4/mes |
| Linode | Nanode 2GB | USD $12/mes |
| Vultr | Cloud Compute 2GB | USD $12/mes |

### Puertos que deben estar abiertos

```
22   → SSH (administración)
80   → HTTP (aplicación web)
443  → HTTPS (si se configura SSL)
```

> ⚠️ **El puerto 3306 (MySQL) NO debe abrirse al público.** Solo se comunica internamente entre contenedores.

---

## 2. Conectarse al Servidor por SSH

### Desde Windows (PowerShell o CMD)

```powershell
# Con usuario y contraseña
ssh ubuntu@45.67.89.100
# Te pedirá la contraseña del servidor

# Con llave .pem (AWS u otros)
ssh -i "C:\Users\Administrador\Downloads\mi-llave.pem" ubuntu@45.67.89.100
```

### Desde Linux/Mac

```bash
# Con contraseña
ssh ubuntu@45.67.89.100

# Con llave .pem
chmod 400 ~/Downloads/mi-llave.pem
ssh -i ~/Downloads/mi-llave.pem ubuntu@45.67.89.100
```

### ✔ Checkpoint: debes ver algo similar a

```
Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-88-generic x86_64)
ubuntu@mi-servidor:~$
```

---

## 3. Preparar el Sistema Operativo

Una vez conectado al servidor, ejecutar los siguientes comandos **en orden**:

### 3.1 — Actualizar todos los paquetes del sistema

```bash
sudo apt update
sudo apt upgrade -y
```

> Esto puede tomar 2–5 minutos. Presiona ENTER si aparece algún diálogo interactivo.

### 3.2 — Instalar herramientas necesarias

```bash
sudo apt install -y \
  curl \
  wget \
  git \
  unzip \
  nano \
  ca-certificates \
  gnupg \
  lsb-release \
  software-properties-common
```

### 3.3 — Verificar que git está instalado

```bash
git --version
# Salida esperada: git version 2.34.x
```

---

## 4. Configurar el Firewall (UFW)

UFW es el firewall de Ubuntu. Configurarlo para permitir solo el tráfico necesario:

```bash
# Habilitar UFW con reglas básicas
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permitir SSH (IMPORTANTE: hacerlo ANTES de habilitar UFW o perderás acceso)
sudo ufw allow 22/tcp

# Permitir HTTP y HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Permitir el puerto del backend (solo si necesitas acceso directo a la API)
sudo ufw allow 3001/tcp

# Activar el firewall
sudo ufw enable
# Escribe: y  (cuando pregunte si deseas continuar)

# Verificar estado
sudo ufw status
```

### ✔ Checkpoint: salida esperada de `sudo ufw status`

```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
3001/tcp                   ALLOW       Anywhere
```

---

## 5. Instalar Docker y Docker Compose

Ejecutar cada bloque de comandos por separado y verificar que no hay errores:

### 5.1 — Agregar la clave GPG oficial de Docker

```bash
sudo install -m 0755 -d /etc/apt/keyrings

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

sudo chmod a+r /etc/apt/keyrings/docker.gpg
```

### 5.2 — Agregar el repositorio de Docker

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### 5.3 — Instalar Docker Engine y Docker Compose

```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

> Esto toma 2–4 minutos dependiendo de la velocidad del servidor.

### 5.4 — Permitir que tu usuario use Docker sin sudo

```bash
sudo usermod -aG docker $USER

# Aplicar el cambio sin cerrar sesión
newgrp docker
```

### 5.5 — Verificar instalación

```bash
docker --version
docker compose version
docker run hello-world
```

### ✔ Checkpoint: salida esperada

```
Docker version 24.x.x, build xxxxxxx
Docker Compose version v2.x.x
Hello from Docker!   ← confirma que Docker funciona correctamente
```

---

## 6. Subir el Proyecto al Servidor

Elige una de las dos opciones:

---

### Opción A — Clonar desde Git *(recomendado si tienes repositorio)*

```bash
# Crear directorio de trabajo
sudo mkdir -p /opt/gestion-metas
sudo chown $USER:$USER /opt/gestion-metas

# Clonar el repositorio
cd /opt/gestion-metas
git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git .

# Verificar que los archivos están
ls -la
```

### ✔ Checkpoint: debes ver los archivos del proyecto

```
drwxr-xr-x  backend/
drwxr-xr-x  frontend/
drwxr-xr-x  docs/
-rw-r--r--  docker-compose.yml
-rw-r--r--  package.json
```

---

### Opción B — Subir por SCP desde Windows *(si no tienes Git)*

**En tu máquina Windows (PowerShell):**

```powershell
# Paso 1: Crear un archivo .zip del proyecto
# (excluye node_modules que son pesados y se reinstalan en el servidor)
$source = "C:\Users\Administrador\CascadeProjects\gestion-metas"
$dest   = "$env:USERPROFILE\Desktop\gestion-metas-deploy.zip"

# Comprimir excluyendo node_modules
Get-ChildItem $source -Recurse |
  Where-Object { $_.FullName -notlike "*\node_modules\*" -and
                 $_.FullName -notlike "*\.git\*" } |
  Compress-Archive -DestinationPath $dest -Update

Write-Host "Archivo creado en: $dest"
```

```powershell
# Paso 2: Subir el zip al servidor
# Reemplaza IP_SERVIDOR con la IP real
scp "$env:USERPROFILE\Desktop\gestion-metas-deploy.zip" ubuntu@IP_SERVIDOR:/tmp/
```

**En el servidor (SSH):**

```bash
# Crear directorio y descomprimir
sudo mkdir -p /opt/gestion-metas
sudo chown $USER:$USER /opt/gestion-metas

cd /opt/gestion-metas
unzip /tmp/gestion-metas-deploy.zip

# Verificar contenido
ls -la
```

---

## 7. Crear el Archivo de Variables de Entorno (.env)

Este archivo contiene todas las contraseñas y configuraciones de producción.  
**Nunca debe subirse a Git.**

### 7.1 — Crear el archivo

```bash
cd /opt/gestion-metas
nano .env
```

### 7.2 — Pegar este contenido y modificar los valores marcados con ←

```env
# ═══════════════════════════════════════════════════
#   CONFIGURACIÓN DE PRODUCCIÓN — GESTIÓN DE METAS
# ═══════════════════════════════════════════════════

# ── Base de datos MySQL ──────────────────────────
MYSQL_ROOT_PASSWORD=RootPass_Seguro_2024!        # ← CAMBIAR
MYSQL_DATABASE=gestion_metas
MYSQL_USER=gestion_user
MYSQL_PASSWORD=UserPass_Seguro_2024!             # ← CAMBIAR

# ── Backend Node.js ──────────────────────────────
JWT_SECRET=mi-clave-jwt-muy-larga-y-secreta-produccion-2024  # ← CAMBIAR (mín. 32 caracteres)
NODE_ENV=production
PORT=3001

# ── URL pública del servidor ─────────────────────
# Poner la IP pública del servidor O el dominio si tienes uno
SERVER_IP=45.67.89.100                           # ← CAMBIAR (tu IP real)
# Si tienes dominio con HTTPS, usar:
# SERVER_IP=tudominio.com
```

### 7.3 — Guardar el archivo

En nano: presiona `Ctrl+O` → `ENTER` para guardar → `Ctrl+X` para salir.

### 7.4 — Proteger el archivo (solo el dueño puede leerlo)

```bash
chmod 600 .env

# Verificar permisos
ls -la .env
# Salida esperada: -rw------- 1 ubuntu ubuntu ... .env
```

### 7.5 — Generar un JWT_SECRET seguro (recomendado)

```bash
# Genera una cadena aleatoria de 64 caracteres
openssl rand -base64 48

# Copia el resultado y úsalo como JWT_SECRET en el .env
```

---

## 8. Crear el docker-compose.prod.yml

Este archivo **sobreescribe** valores del `docker-compose.yml` base para producción.  
El cambio más crítico es `REACT_APP_API_URL`: debe apuntar a tu servidor real, no a `localhost`.

### 8.1 — Crear el archivo

```bash
cd /opt/gestion-metas
nano docker-compose.prod.yml
```

### 8.2 — Pegar exactamente este contenido

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
    # En producción: solo migrar esquema, NO cargar seed en cada arranque
    command: >
      sh -c "npx prisma db push &&
             node src/server-mysql.js"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        # CRÍTICO: Esta URL queda embebida en el build de React.
        # El navegador del usuario la usará para conectar con la API.
        # Debe ser la IP pública o dominio del servidor.
        REACT_APP_API_URL: http://${SERVER_IP}:3001/api
    ports:
      - "80:80"
```

### 8.3 — Guardar: `Ctrl+O` → `ENTER` → `Ctrl+X`

> **¿Por qué este archivo es crítico?**  
> React compila el código fuente en archivos `.js` estáticos. En ese momento, la variable  
> `REACT_APP_API_URL` queda **grabada dentro del código JavaScript**. Si queda como `localhost`,  
> el navegador de cada usuario intentará conectar al API en su propia máquina, lo que fallará.

---

## 9. Construir e Iniciar los Contenedores

### 9.1 — Construir las imágenes y arrancar

```bash
cd /opt/gestion-metas

docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  up -d --build
```

> **Este proceso toma entre 5 y 15 minutos** la primera vez porque:
> - Descarga las imágenes base de Node.js, MySQL y Nginx
> - Instala las dependencias npm del backend y frontend
> - Compila el React para producción (build optimizado)

### 9.2 — Seguir el progreso en tiempo real

```bash
docker compose logs -f
```

Presiona `Ctrl+C` para dejar de ver logs sin detener los contenedores.

### 9.3 — Secuencia de inicio automática

Los contenedores arrancan en orden controlado por `depends_on` + `healthcheck`:

```
┌─────────────────────────────────────────────────────────┐
│ PASO 1 → MySQL inicia y espera hasta estar "healthy"    │
│          (puede tomar hasta 30-40 segundos)             │
│                          ↓                              │
│ PASO 2 → Backend espera a MySQL → ejecuta prisma db     │
│          push (crea tablas) → inicia servidor Node.js   │
│                          ↓                              │
│ PASO 3 → Frontend arranca Nginx y sirve los archivos    │
│          del build React                                │
└─────────────────────────────────────────────────────────┘
```

### ✔ Checkpoint: verificar que los 3 contenedores están corriendo

```bash
docker compose ps
```

Salida esperada:

```
NAME                       STATUS              PORTS
gestion-metas-mysql        Up (healthy)        0.0.0.0:3306->3306/tcp
gestion-metas-backend      Up (healthy)        0.0.0.0:3001->3001/tcp
gestion-metas-frontend     Up                  0.0.0.0:80->80/tcp
```

> Si algún contenedor muestra `Exit` o `Restarting`, ver la sección [Troubleshooting](#17-troubleshooting--errores-comunes).

---

## 10. Inicializar la Base de Datos

**Solo se hace una vez** en el primer deployment.

### 10.1 — Cargar datos iniciales (seed)

```bash
docker exec gestion-metas-backend node seed-mysql.js
```

### ✔ Checkpoint: salida esperada

```
✅ 5 usuarios creados
✅ Datos de prueba cargados
Seed completado exitosamente
```

### 10.2 — Verificar que la base de datos tiene datos

```bash
docker exec gestion-metas-mysql mysql \
  -u gestion_user \
  -p"TuPasswordUserSeguro2024!" \
  gestion_metas \
  -e "SELECT COUNT(*) as total_usuarios FROM Usuario;"
```

Salida esperada:
```
+----------------+
| total_usuarios |
+----------------+
|              5 |
+----------------+
```

---

## 11. Verificar que Todo Funciona

### 11.1 — Verificar el backend API

```bash
# Health check del backend
curl http://localhost:3001/health

# Salida esperada:
# {"status":"ok","database":"connected"}
```

### 11.2 — Verificar el frontend (Nginx)

```bash
# Verificar que Nginx está respondiendo
curl -I http://localhost:80

# Salida esperada:
# HTTP/1.1 200 OK
# Server: nginx/1.x.x
```

### 11.3 — Probar desde el navegador

Abrir en el navegador de tu computadora:

```
http://IP_DEL_SERVIDOR
```

Debes ver la pantalla de login de la aplicación.

### 11.4 — Probar login con credenciales de administrador

```
Email:    admin@gestionmetas.com
Password: admin123
```

> ⚠️ **IMPORTANTE:** Cambia la contraseña del admin después del primer acceso.

### 11.5 — Lista de verificación funcional

- [ ] La página de login carga correctamente
- [ ] Puedes iniciar sesión como ADMIN
- [ ] El Dashboard muestra datos
- [ ] La sección de Metas carga
- [ ] La sección de Contratistas carga
- [ ] La sección de Avances carga
- [ ] Puedes cerrar sesión y volver a entrar

---

## 12. Configurar Dominio y HTTPS con SSL

> Esta sección es opcional pero **muy recomendada** para producción.  
> Requiere tener un dominio propio apuntando al servidor.

### 12.1 — Configurar el DNS del dominio

En el panel de tu proveedor de dominios (GoDaddy, Namecheap, Cloudflare, etc.):

```
Tipo de registro: A
Nombre/Host:      @   (para el dominio raíz)  o  app  (para subdominio)
Valor/Destino:    45.67.89.100   ← tu IP del servidor
TTL:              3600 (1 hora)
```

Esperar entre 5 minutos y 24 horas para propagación DNS.

**Verificar propagación:**
```bash
# En el servidor
nslookup tudominio.com
# Debe devolver la IP de tu servidor
```

### 12.2 — Detener los contenedores temporalmente

```bash
docker compose down
```

### 12.3 — Instalar Certbot (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 12.4 — Obtener el certificado SSL gratuito

```bash
# Certbot instala y configura el certificado automáticamente
sudo certbot --nginx -d tudominio.com

# Si también tienes www:
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

Certbot preguntará:
1. Tu email → ingresa uno válido para notificaciones de renovación
2. Acepta los términos → `A`
3. Si deseas compartir email con EFF → `N`
4. Si redirigir HTTP a HTTPS → elige `2` (Redirect)

### 12.5 — Actualizar nginx.conf del frontend para HTTPS

```bash
nano /opt/gestion-metas/frontend/nginx.conf
```

Reemplazar el contenido completo con:

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tudominio.com www.tudominio.com;

    ssl_certificate     /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    root  /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

### 12.6 — Actualizar el .env con el dominio y reconstruir

```bash
cd /opt/gestion-metas
nano .env
# Cambiar SERVER_IP=tudominio.com
# Si usas HTTPS, cambiar REACT_APP_API_URL a https://tudominio.com/api
```

Actualizar también `docker-compose.prod.yml`:
```yaml
        REACT_APP_API_URL: https://${SERVER_IP}/api
```

Reconstruir con SSL:
```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  up -d --build
```

### 12.7 — Verificar renovación automática del certificado

```bash
# Probar que la renovación automática funciona
sudo certbot renew --dry-run

# Verificar cuándo vence el certificado actual
sudo certbot certificates
```

> Los certificados de Let's Encrypt duran 90 días. Certbot instala automáticamente un cron para renovarlos.

---

## 13. Configurar Backups Automáticos

### 13.1 — Crear el directorio de backups

```bash
sudo mkdir -p /opt/backups/gestion-metas
sudo chown $USER:$USER /opt/backups/gestion-metas
```

### 13.2 — Crear el script de backup

```bash
nano /opt/backups/backup-gestion-metas.sh
```

Pegar este contenido (reemplaza la contraseña con la real):

```bash
#!/bin/bash
# ─────────────────────────────────────────────
#  Script de Backup — Gestión de Metas
#  Se ejecuta diariamente via cron
# ─────────────────────────────────────────────

BACKUP_DIR="/opt/backups/gestion-metas"
DATE=$(date +%Y%m%d_%H%M%S)
DB_USER="gestion_user"
DB_PASS="TuPasswordUserSeguro2024!"   # ← Cambia esto
DB_NAME="gestion_metas"
RETENTION_DAYS=30
LOG_FILE="/var/log/backup-gestion-metas.log"

mkdir -p "$BACKUP_DIR"

echo "[$DATE] Iniciando backup..." >> "$LOG_FILE"

# Ejecutar mysqldump dentro del contenedor
docker exec gestion-metas-mysql mysqldump \
  -u "$DB_USER" \
  -p"$DB_PASS" \
  "$DB_NAME" > "$BACKUP_DIR/backup_$DATE.sql"

# Verificar que el backup se creó correctamente
if [ $? -eq 0 ] && [ -s "$BACKUP_DIR/backup_$DATE.sql" ]; then
    # Comprimir el archivo
    gzip "$BACKUP_DIR/backup_$DATE.sql"
    SIZE=$(du -sh "$BACKUP_DIR/backup_$DATE.sql.gz" | cut -f1)
    echo "[$DATE] ✅ Backup exitoso: backup_$DATE.sql.gz ($SIZE)" >> "$LOG_FILE"
else
    echo "[$DATE] ❌ ERROR: Backup falló o archivo vacío" >> "$LOG_FILE"
    exit 1
fi

# Eliminar backups más antiguos de RETENTION_DAYS días
DELETED=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
    echo "[$DATE] 🗑️  Eliminados $DELETED backups antiguos (>$RETENTION_DAYS días)" >> "$LOG_FILE"
fi

echo "[$DATE] Proceso completado." >> "$LOG_FILE"
```

### 13.3 — Dar permisos de ejecución al script

```bash
chmod +x /opt/backups/backup-gestion-metas.sh

# Probar que funciona manualmente
/opt/backups/backup-gestion-metas.sh

# Verificar que se creó el archivo
ls -lh /opt/backups/gestion-metas/
# Debe aparecer: backup_YYYYMMDD_HHMMSS.sql.gz
```

### 13.4 — Programar el backup automático con cron

```bash
crontab -e
# Si pregunta qué editor usar, elige nano (opción 1)
```

Agregar esta línea al final del archivo:

```
# Backup de Gestión de Metas — todos los días a las 2:00 AM
0 2 * * * /opt/backups/backup-gestion-metas.sh
```

Guardar: `Ctrl+O` → `ENTER` → `Ctrl+X`

```bash
# Verificar que el cron quedó configurado
crontab -l
```

### 13.5 — Restaurar un backup (cuando sea necesario)

```bash
# Listar backups disponibles
ls -lht /opt/backups/gestion-metas/

# Descomprimir el backup que necesitas
gunzip /opt/backups/gestion-metas/backup_YYYYMMDD_HHMMSS.sql.gz

# Restaurar en la base de datos
docker exec -i gestion-metas-mysql mysql \
  -u gestion_user \
  -p"TuPasswordUserSeguro2024!" \
  gestion_metas < /opt/backups/gestion-metas/backup_YYYYMMDD_HHMMSS.sql

echo "Restauración completada"
```

---

## 14. Configurar Auto-reinicio al Reiniciar el Servidor

Los contenedores ya tienen `restart: unless-stopped` en el `docker-compose.yml`, lo que significa que:
- Se reinician automáticamente si crashean
- Se reinician automáticamente cuando el servidor se reinicia

### Verificar que Docker arranca con el sistema

```bash
sudo systemctl is-enabled docker
# Salida esperada: enabled

# Si no está habilitado, habilitarlo
sudo systemctl enable docker
```

### Probar el auto-reinicio

```bash
# Reiniciar el servidor
sudo reboot

# Esperar 1-2 minutos y volver a conectarse por SSH
# Luego verificar que los contenedores arrancaron solos
docker compose ps
```

---

## 15. Proceso de Actualización del Sistema

Cuando hay cambios en el código fuente, seguir estos pasos:

### Si el proyecto está en Git

```bash
cd /opt/gestion-metas

# 1. Hacer backup de la BD antes de actualizar
/opt/backups/backup-gestion-metas.sh

# 2. Obtener los últimos cambios
git pull origin main

# 3. Reconstruir e reiniciar los contenedores afectados
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  up -d --build

# 4. Si hubo cambios en el esquema de la BD (Prisma)
docker exec gestion-metas-backend npx prisma db push

# 5. Verificar que todo está corriendo
docker compose ps
curl http://localhost:3001/health
```

### Si el proyecto se actualiza por SCP

```bash
# 1. Backup previo
/opt/backups/backup-gestion-metas.sh

# 2. Detener solo el contenedor que cambió
docker compose stop backend frontend

# 3. Subir los nuevos archivos y reemplazar

# 4. Reconstruir
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  up -d --build backend frontend

# 5. Verificar
docker compose ps
```

> ⚠️ **Nota sobre tiempo de inactividad:** El rebuild tarda 3–10 minutos.  
> Durante ese tiempo el servicio puede no estar disponible.  
> Para actualizaciones sin interrupción se requiere un balanceador de carga (fuera del alcance de esta guía).

---

## 16. Comandos de Mantenimiento Diario

```bash
# ── Ver estado de los contenedores ─────────────────────────
docker compose ps

# ── Ver logs en tiempo real ─────────────────────────────────
docker compose logs -f

# ── Ver logs de un contenedor específico ───────────────────
docker logs gestion-metas-backend -f --tail 100
docker logs gestion-metas-mysql   -f --tail 50
docker logs gestion-metas-frontend --tail 50

# ── Reiniciar un contenedor específico ─────────────────────
docker compose restart backend
docker compose restart frontend
docker compose restart mysql

# ── Detener todo el sistema ────────────────────────────────
docker compose down

# ── Iniciar el sistema (sin reconstruir) ───────────────────
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# ── Entrar al contenedor del backend (debug) ───────────────
docker exec -it gestion-metas-backend sh

# ── Abrir cliente MySQL ─────────────────────────────────────
docker exec -it gestion-metas-mysql mysql \
  -u gestion_user -p gestion_metas

# ── Ver uso de recursos de los contenedores ────────────────
docker stats --no-stream

# ── Ver espacio en disco ────────────────────────────────────
df -h
docker system df

# ── Limpiar imágenes y caché no usados ─────────────────────
docker system prune -f
```

---

## 17. Troubleshooting — Errores Comunes

### ❌ Problema: Un contenedor muestra `Restarting` o `Exit`

```bash
# Ver el log del contenedor que falla
docker logs gestion-metas-backend --tail 50
docker logs gestion-metas-mysql --tail 50
```

**Causas frecuentes:**
- Variables de entorno incorrectas en `.env`
- MySQL aún no está listo cuando el backend intenta conectar (esperar 60 seg y verificar de nuevo)
- Puerto 80 ya en uso por otro proceso

---

### ❌ Problema: El frontend abre pero no carga datos / error de conexión

**Causa:** `REACT_APP_API_URL` tiene `localhost` en vez de la IP del servidor.

```bash
# Verificar la URL que quedó en el build
docker exec gestion-metas-frontend \
  grep -r "localhost:3001" /usr/share/nginx/html/static/js/ 2>/dev/null | head -3
```

Si aparece `localhost:3001`, debes reconstruir con la IP correcta:

```bash
# Corregir en .env
nano .env
# Cambiar SERVER_IP=IP_CORRECTA

# Reconstruir solo el frontend
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  up -d --build frontend
```

---

### ❌ Problema: Puerto 80 ya en uso

```bash
# Identificar qué proceso usa el puerto 80
sudo lsof -i :80
sudo netstat -tlnp | grep :80

# Si es Apache2 o Nginx instalado en el host
sudo systemctl stop apache2 && sudo systemctl disable apache2
sudo systemctl stop nginx   && sudo systemctl disable nginx

# Reiniciar el contenedor frontend
docker compose restart frontend
```

---

### ❌ Problema: MySQL no responde — backend en loop

```bash
# Ver estado del healthcheck de MySQL
docker inspect gestion-metas-mysql | grep -A 10 '"Health"'

# Ver logs de MySQL
docker logs gestion-metas-mysql --tail 30

# Verificar que el volumen tiene espacio
df -h /var/lib/docker
```

---

### ❌ Problema: Error "permission denied" con Docker

```bash
# Agregar el usuario al grupo docker
sudo usermod -aG docker $USER
newgrp docker

# Verificar
docker ps
```

---

### ❌ Problema: La aplicación funciona pero muy lento

```bash
# Ver consumo de recursos
docker stats

# Si MySQL usa mucha RAM, ajustar en docker-compose.prod.yml:
# Agregar bajo el servicio mysql:
#   deploy:
#     resources:
#       limits:
#         memory: 512M
```

---

### ❌ Problema: Necesito resetear toda la base de datos

```bash
# ⚠️ DESTRUCTIVO — Elimina todos los datos

# 1. Hacer backup primero (si hay datos que rescatar)
/opt/backups/backup-gestion-metas.sh

# 2. Detener y eliminar contenedores + volúmenes
docker compose down -v

# 3. Reconstruir desde cero
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  up -d --build

# 4. Esperar 60 segundos a que MySQL esté ready
sleep 60

# 5. Cargar datos iniciales
docker exec gestion-metas-backend node seed-mysql.js
```

---

## 📋 Resumen del Proceso Completo

```
SERVIDOR                          TIEMPO ESTIMADO
─────────────────────────────────────────────────
1. Aprovisionar servidor Ubuntu     5 min
2. Conectar por SSH                 2 min
3. Preparar SO (apt update)         5 min
4. Configurar UFW (firewall)        3 min
5. Instalar Docker                 10 min
6. Subir proyecto                   5 min
7. Crear .env con credenciales      5 min
8. Crear docker-compose.prod.yml    5 min
9. docker compose up --build       15 min
10. Inicializar BD (seed)           2 min
11. Verificar funcionamiento        5 min
─────────────────────────────────────────────────
TOTAL PRIMERA VEZ:              ~60 min

POST-INSTALACIÓN (opcional)
─────────────────────────────────────────────────
12. Configurar dominio + HTTPS     20 min
13. Configurar backups automáticos  5 min
14. Verificar auto-reinicio         5 min
─────────────────────────────────────────────────
```

---

## 🔐 Credenciales por Defecto (Cambiar en producción)

| Recurso | Usuario | Contraseña |
|---------|---------|------------|
| Admin App | admin@gestionmetas.com | admin123 |
| MySQL root | root | (valor de MYSQL_ROOT_PASSWORD en .env) |
| MySQL app | gestion_user | (valor de MYSQL_PASSWORD en .env) |

> **⚠️ Cambiar la contraseña del admin de la aplicación** en el primer acceso desde  
> el menú Usuarios → Editar → Nueva contraseña.

---

*Última actualización: Mayo 2026*  
*Stack: Node.js 18 · MySQL 8.0 · React 18 · Nginx Alpine · Docker Compose v2 · Ubuntu 22.04 LTS*
