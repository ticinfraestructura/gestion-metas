# Guía de Despliegue

## Requisitos Previos

- Docker y Docker Compose
- Node.js 18+ (para desarrollo local)
- MySQL 8.0+ (para desarrollo local)
- Nginx (opcional, para producción)

## Variables de Entorno

Copia el archivo `.env.example` a `.env` y configura las variables:

```bash
cp .env.example .env
```

### Variables Obligatorias

- `MYSQL_ROOT_PASSWORD`: Contraseña del root de MySQL
- `MYSQL_DATABASE`: Nombre de la base de datos
- `MYSQL_USER`: Usuario de la base de datos
- `MYSQL_PASSWORD`: Contraseña del usuario de la base de datos
- `JWT_SECRET`: Secreto para firmar tokens JWT

### Variables Opcionales

- `EMAIL_HOST`: Servidor SMTP para envío de correos
- `EMAIL_PORT`: Puerto SMTP
- `EMAIL_USER`: Usuario SMTP
- `EMAIL_PASS`: Contraseña SMTP

## Despliegue con Docker

### Desarrollo

```bash
# Iniciar servicios de desarrollo
docker-compose -f docker-compose.dev.yml up -d

# Ver logs
docker-compose -f docker-compose.dev.yml logs -f

# Detener servicios
docker-compose -f docker-compose.dev.yml down
```

### Producción

```bash
# Iniciar servicios de producción
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

## Despliegue Manual

### Backend

```bash
cd backend

# Instalar dependencias
npm install

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# Iniciar en producción
npm start
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Construir para producción
npm run build

# Servir archivos estáticos (opcional)
npx serve -s build -l 3000
```

## Configuración de Base de Datos

### Con Docker

La base de datos se crea automáticamente al iniciar los contenedores.

### Manual

1. Crea la base de datos MySQL:
```sql
CREATE DATABASE gestion_metas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Ejecuta las migraciones:
```bash
cd backend
npx prisma migrate deploy
```

3. (Opcional) Ejecuta el seed:
```bash
npx prisma db seed
```

## Configuración de Nginx

Para producción, configura Nginx como reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        root /path/to/frontend/build;
        try_files $uri $uri/ /index.html;
    }
}
```

## Monitoreo y Salud

### Health Checks

- **Backend**: `GET /health`
- **Frontend**: `GET /health`

### Logs

- **Backend**: Configurado con Winston
- **Frontend**: Accesos a través de Nginx
- **Base de datos**: Logs de MySQL

## Seguridad

### Certificados SSL

Para producción, configura certificados SSL:

1. Obtén certificados (Let's Encrypt recomendado)
2. Coloca los archivos en `docker/nginx/ssl/`
3. Actualiza la configuración de Nginx

### Firewall

Asegúrate de abrir los puertos necesarios:
- `80` (HTTP)
- `443` (HTTPS)
- `3306` (MySQL, solo si es acceso externo)

## Backup

### Base de Datos

```bash
# Backup
docker exec gestion-metas-mysql mysqldump -u root -p gestion_metas > backup.sql

# Restaurar
docker exec -i gestion-metas-mysql mysql -u root -p gestion_metas < backup.sql
```

### Archivos

```bash
# Backup de volúmenes
docker run --rm -v gestion-metas_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql-backup.tar.gz -C /data .
```

## Escalado

### Horizontal Scaling

Para múltiples instancias del backend:

```yaml
# docker-compose.yml
backend:
  deploy:
    replicas: 3
  # ... otras configuraciones
```

### Load Balancing

Nginx puede configurarse para balancear carga:

```nginx
upstream backend {
    server backend1:3000;
    server backend2:3000;
    server backend3:3000;
}

server {
    location /api/ {
        proxy_pass http://backend;
    }
}
```

## Troubleshooting

### Problemas Comunes

1. **Error de conexión a la base de datos**
   - Verifica que MySQL esté corriendo
   - Confirma las credenciales en `.env`

2. **Error de permisos**
   - Asegúrate que los volúmenes tengan los permisos correctos
   - Ejecuta `chown` si es necesario

3. **Frontend no carga**
   - Verifica que el backend esté accesible
   - Revisa la configuración de CORS

### Logs Útiles

```bash
# Logs de todos los servicios
docker-compose logs

# Logs de un servicio específico
docker-compose logs backend

# Logs en tiempo real
docker-compose logs -f
```

## Actualización

### Actualizar Aplicación

```bash
# Descargar cambios
git pull

# Reconstruir imágenes
docker-compose build

# Reiniciar servicios
docker-compose up -d
```

### Actualizar Base de Datos

```bash
# Generar nuevas migraciones
npx prisma migrate dev

# Aplicar en producción
npx prisma migrate deploy
```
