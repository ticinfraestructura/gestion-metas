# Guía de Desarrollo

## Configuración del Entorno de Desarrollo

### Prerrequisitos

- Node.js 18+
- npm 8+
- MySQL 8.0+ o Docker
- Git

### Configuración Inicial

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd gestion-metas
```

2. **Crear `backend/.env`**
```env
DATABASE_URL="mysql://root:@localhost:3306/gestion_metas"
PORT=3001
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
```

3. **Configurar MySQL local**

MySQL 8.4 debe estar instalado y corriendo en el puerto 3306.

Verificar que MySQL esté activo:
```powershell
netstat -an | findstr ":3306"
```

Crear la base de datos si no existe:
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS gestion_metas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

4. **Aplicar esquema y cargar datos**
```bash
cd backend
npx prisma migrate dev --name init   # desarrollo (crea migración)
# o
npx prisma migrate deploy            # producción (aplica migraciones existentes)

node seed-mysql.js                   # datos iniciales (solo primera vez)
```

## Backend

### Instalación y Configuración

```bash
cd backend

# Instalar dependencias
npm install

# Generar cliente Prisma
npx prisma generate

# Aplicar migraciones
npx prisma migrate deploy

# Poblar datos iniciales (solo primera vez)
node seed-mysql.js

# Iniciar servidor
node src/server-mysql.js
```

### Scripts Disponibles

```bash
node src/server-mysql.js   # Iniciar servidor (Express + Prisma + MySQL)

npm run db:generate        # Regenerar cliente Prisma
npm run db:migrate         # Crear y aplicar migración (desarrollo)
npm run db:deploy          # Aplicar migraciones existentes (producción)
npm run db:studio          # Abrir Prisma Studio (UI visual de BD)
npm run db:seed:mysql      # Ejecutar seed-mysql.js

npm run lint               # Linting
npm run lint:fix           # Corregir linting
```

### Estructura del Backend

```
backend/
├── src/
│   └── server-mysql.js   # Servidor principal (Express + Prisma)
├── prisma/
│   ├── schema.prisma      # Esquema MySQL
│   └── migrations/        # Historial de migraciones
├── seed-mysql.js          # Datos iniciales
├── uploads/               # Archivos adjuntos (creado automáticamente)
└── .env                   # Variables de entorno (no versionado)
```

## Frontend

### Instalación y Configuración

```bash
cd frontend

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local

# Desarrollo
npm start
```

### Scripts Disponibles

```bash
# Desarrollo
npm start

# Construir para producción
npm run build

# Ejecutar tests
npm test

# Linting
npm run lint

# Formatear código
npm run format
```

### Estructura del Frontend

```
frontend/
├── public/              # Archivos estáticos
├── src/
│   ├── components/       # Componentes reutilizables
│   ├── pages/           # Páginas de la aplicación
│   ├── services/        # Servicios API
│   ├── store/           # Estado global (Zustand)
│   ├── types/           # Tipos TypeScript
│   ├── utils/           # Utilidades
│   ├── App.tsx          # Componente principal
│   └── index.tsx        # Punto de entrada
```

## Flujo de Trabajo

### 1. Crear una Nueva Rama

```bash
git checkout -b feature/nueva-funcionalidad
```

### 2. Desarrollo

- **Backend**: Crear endpoints, lógica de negocio, tests
- **Frontend**: Crear componentes, páginas, integración con API

### 3. Testing

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

### 4. Code Review

```bash
# Formatear código
npm run lint:fix

# Verificar cambios
git status
git add .
git commit -m "feat: agregar nueva funcionalidad"
git push origin feature/nueva-funcionalidad
```

### 5. Deploy

```bash
# Fusionar a main
git checkout main
git merge feature/nueva-funcionalidad

# Deploy con Docker
docker-compose up -d --build
```

## Buenas Prácticas

### Backend

1. **Validación de entrada**: Usar Joi para validar todos los inputs
2. **Manejo de errores**: Respuestas consistentes con `ResponseFactory`
3. **Seguridad**: Hashear contraseñas, validar JWT, rate limiting
4. **Testing**: Escribir tests unitarios para todos los servicios
5. **Logging**: Usar Winston para logging estructurado

### Frontend

1. **Componentes**: Crear componentes reutilizables y bien tipados
2. **Estado**: Usar Zustand para estado global
3. **Estilos**: Tailwind CSS para estilos consistentes
4. **Tipado**: TypeScript estricto para todo el código
5. **Performance**: Lazy loading, memoización, optimización

### Base de Datos

1. **Migraciones**: Versionar cambios con Prisma Migrate
2. **Seed**: Datos de prueba consistentes
3. **Índices**: Optimizar consultas con índices apropiados
4. **Relaciones**: Definir relaciones claras entre entidades

## Herramientas de Desarrollo

### VS Code Extensions Recomendadas

- Prisma
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Prettier - Code formatter
- ESLint
- GitLens
- Thunder Client (para pruebas de API)

### Navegadores

- Chrome DevTools
- React Developer Tools
- Redux DevTools (si aplica)

### Base de Datos

- Prisma Studio
- MySQL Workbench
- DBeaver

## Depuración

### Backend

```bash
# Ver logs en tiempo real
npm run dev

# Modo debug
node --inspect-brk dist/index.js
```

### Frontend

```bash
# Debug en Chrome
npm start

# Variables de entorno
console.log(process.env.REACT_APP_API_URL);
```

### Base de Datos

```bash
# Abrir Prisma Studio
npx prisma studio

# Ver consultas SQL
npx prisma migrate dev --debug
```

## Testing

### Backend (Jest)

```bash
# Ejecutar todos los tests
npm test

# Tests específicos
npm test -- auth.test.ts

# Coverage
npm run test:coverage
```

### Frontend (React Testing Library)

```bash
# Ejecutar tests
npm test

# Tests en modo watch
npm test --watch

# Coverage
npm test --coverage
```

## Problemas Comunes y Soluciones

### 1. Error de conexión a la base de datos

**Problema**: `ECONNREFUSED 127.0.0.1:3306`

**Solución**:
```bash
# Verificar que MySQL esté corriendo
docker ps | grep mysql

# Revisar variables de entorno
cat .env | grep DATABASE_URL
```

### 2. Error de CORS

**Problema**: `Access-Control-Allow-Origin`

**Solución**:
```javascript
// backend/src/index.ts
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
```

### 3. Error de módulos de Node

**Problema**: `MODULE_NOT_FOUND`

**Solución**:
```bash
# Limpiar caché de npm
npm cache clean --force

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### 4. Error en el frontend

**Problema**: Componente no renderiza

**Solución**:
```bash
# Verificar consola del navegador
# Revisar React DevTools
# Verificar rutas en App.tsx
```

## Recursos

- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de React](https://react.dev)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)
- [Documentación de Express](https://expressjs.com)
- [Guía de TypeScript](https://www.typescriptlang.org/docs)
