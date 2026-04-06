# Aplicación de Gestión de Metas y Contratistas

Aplicación web enterprise-ready para gestión de metas, contratistas y avances con autenticación segura, validación por email y dashboard de KPIs.

## 🚀 Características

- ✅ **Autenticación Segura**: JWT con validación por email y system de bloqueo
- ✅ **Gestión Completa**: CRUD para usuarios, metas, contratistas y avances
- ✅ **Dashboard Analytics**: KPIs y reportes en tiempo real
- ✅ **Seguridad Hardening**: CORS, prevención de SQL injection, rate limiting
- ✅ **Dockerización**: Despliegue on-premise con contenedores
- ✅ **Integración Nginx**: Reverse proxy con configuración de producción
- ✅ **Principios DRY**: Código limpio y documentación completa

## 🏗️ Arquitectura

- **Backend**: Node.js, TypeScript, Express.js, Prisma ORM, MySQL
- **Frontend**: React 18, TypeScript, Tailwind CSS, Zustand
- **DevOps**: Docker, Docker Compose, Nginx
- **Seguridad**: JWT, bcrypt, validación email, hardening
- **Testing**: Jest, TypeScript testing
- **Documentación**: JSDoc, Swagger/OpenAPI

## 📁 Estructura del Proyecto

```
gestion-metas/
├── backend/                 # API RESTful con Node.js
│   ├── src/
│   │   ├── controllers/    # Lógica de controladores
│   │   ├── middleware/      # Middleware personalizado
│   │   ├── repositories/    # Acceso a datos
│   │   ├── routes/         # Definición de rutas
│   │   ├── services/       # Lógica de negocio
│   │   ├── shared/         # Utilidades compartidas
│   │   ├── types/          # Tipos TypeScript
│   │   └── utils/          # Funciones utilitarias
│   ├── prisma/
│   │   ├── schema.prisma   # Esquema de base de datos
│   │   └── seed.ts        # Datos iniciales
│   └── dist/              # Código compilado
├── frontend/               # Aplicación React
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/         # Páginas de la aplicación
│   │   ├── services/      # Servicios API
│   │   ├── store/         # Estado global (Zustand)
│   │   ├── types/         # Tipos TypeScript
│   │   └── utils/         # Utilidades
│   └── public/            # Archivos estáticos
├── docker/                 # Configuración Docker
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
├── docs/                   # Documentación
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── DEVELOPMENT.md
├── scripts/                # Scripts de despliegue
│   ├── setup.sh
│   └── setup.ps1
├── docker-compose.yml       # Producción
├── docker-compose.dev.yml  # Desarrollo
├── .env.example           # Variables de entorno
└── README.md              # Este archivo
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- Docker y Docker Compose
- MySQL 8.0+ (para desarrollo local)
- Nginx (existente, para producción)

### 1. Configuración Automática (Recomendado)

**Windows (PowerShell):**
```powershell
.\scripts\setup.ps1
```

**Linux/macOS:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 2. Configuración Manual

#### Copiar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

#### Desarrollo con Docker
```bash
docker-compose -f docker-compose.dev.yml up -d
```

#### Desarrollo local
```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev

# Frontend (en otra terminal)
cd frontend
npm install
npm start
```

#### Producción
```bash
docker-compose up -d --build
```

## 🌐 Acceso a la Aplicación

- **Frontend (Desarrollo)**: http://localhost:3001
- **Frontend (Producción)**: http://localhost:80
- **Backend API**: http://localhost:3000/api
- **Base de Datos**: localhost:3306

### Usuarios por Defecto

Después de ejecutar el seed:

- **Administrador**: admin@gestionmetas.com / admin123
- **Usuario**: usuario@gestionmetas.com / user123

## 📚 Documentación

- **[API Documentation](docs/API.md)**: Endpoints y ejemplos
- **[Deployment Guide](docs/DEPLOYMENT.md)**: Guía de despliegue completo
- **[Development Guide](docs/DEVELOPMENT.md)**: Guía para desarrolladores

## 🛠️ Scripts Disponibles

### Backend
```bash
npm run dev              # Desarrollo con hot reload
npm run build            # Construir para producción
npm start                # Iniciar en producción
npm test                 # Ejecutar tests
npm run test:watch       # Tests en modo watch
npm run test:coverage    # Coverage de tests
npm run lint             # Linting
npm run lint:fix         # Corregir linting
npm run db:generate      # Generar cliente Prisma
npm run db:migrate        # Ejecutar migraciones
npm run db:studio        # Abrir Prisma Studio
npm run db:seed          # Ejecutar seed
```

### Frontend
```bash
npm start                # Desarrollo
npm run build            # Construir para producción
npm test                 # Ejecutar tests
npm run lint             # Linting
npm run format           # Formatear código
```

## 🔧 Variables de Entorno

### Base de Datos
```env
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=gestion_metas
MYSQL_USER=gestion_user
MYSQL_PASSWORD=gestion_password
```

### Backend
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://gestion_user:gestion_password@localhost:3306/gestion_metas
JWT_SECRET=your-super-secret-jwt-key-change-in-production
CORS_ORIGIN=http://localhost:3001
CORS_CREDENTIALS=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend
```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_ENV=production
```

### Email (Opcional)
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 🐳 Docker

### Servicios

- **mysql**: Base de datos MySQL 8.0
- **backend**: API Node.js con Express
- **frontend**: Aplicación React servida por Nginx
- **nginx**: Reverse proxy (solo producción)

### Volúmenes

- `mysql_data`: Datos persistentes de MySQL
- `nginx_logs`: Logs de Nginx

### Health Checks

Todos los servicios incluyen health checks para monitoreo:

```bash
# Ver estado de los servicios
docker-compose ps

# Ver logs
docker-compose logs -f
```

## 🔒 Seguridad

### Implementaciones

- **Autenticación JWT** con tokens de refresco
- **Hashing de contraseñas** con bcrypt
- **Rate limiting** por IP y endpoint
- **Validación de entrada** con Joi
- **CORS configurado** para dominios específicos
- **Headers de seguridad** en Nginx
- **SQL injection prevention** con Prisma ORM
- **Auditoría de accesos** y logs de autenticación

### Best Practices

- Rotación regular de secrets
- Monitoreo de logs de acceso
- Actualizaciones de seguridad regulares
- Backup automatizado de base de datos

## 🧪 Testing

### Backend (Jest)
```bash
cd backend
npm test                 # Todos los tests
npm run test:coverage    # Con coverage
npm run test:watch       # Modo watch
```

### Frontend (React Testing Library)
```bash
cd frontend
npm test                 # Todos los tests
npm test --coverage       # Con coverage
```

## 📊 Monitoreo

### Health Endpoints

- **Backend**: `GET /health`
- **Frontend**: `GET /health`

### Logs

- **Backend**: Winston con niveles estructurados
- **Frontend**: Accesos a través de Nginx
- **Database**: Logs de MySQL

## 🚀 Despliegue

### Producción

1. **Configurar variables de entorno**
2. **Ejecutar con Docker Compose**:
   ```bash
   docker-compose up -d --build
   ```

### Escalado

La aplicación está preparada para escalado horizontal:

```yaml
# docker-compose.yml
backend:
  deploy:
    replicas: 3
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'feat: agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Pull Request

## 📝 Licencia

MIT License - ver [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Para soporte técnico:

1. Revisar la [documentación](docs/)
2. Buscar en [issues](../../issues)
3. Crear nuevo issue con detalles del problema

## 🔄 Actualización

```bash
# Actualizar código
git pull main

# Reconstruir y reiniciar
docker-compose up -d --build
```

---

**Desarrollado con ❤️ para gestión eficiente de proyectos**
