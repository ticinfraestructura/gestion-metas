# API Documentation

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Authentication

La API utiliza JWT (JSON Web Tokens) para la autenticación. Incluye el token en el header de las solicitudes:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Autenticación

#### POST /auth/login
Inicia sesión de usuario.

**Body:**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "usuario": {
      "id": 1,
      "nombre": "Usuario Ejemplo",
      "email": "usuario@ejemplo.com",
      "rol": "USUARIO",
      "estado": "ACTIVO",
      "email_validado": true
    },
    "token": "jwt-token-here",
    "refreshToken": "refresh-token-here"
  }
}
```

#### POST /auth/register
Registra un nuevo usuario.

**Body:**
```json
{
  "nombre": "Nuevo Usuario",
  "email": "nuevo@ejemplo.com",
  "password": "password123"
}
```

#### POST /auth/validate-email
Valida el correo electrónico del usuario.

**Body:**
```json
{
  "token": "validation-token-here"
}
```

#### POST /auth/forgot-password
Envía un correo para restablecer contraseña.

**Body:**
```json
{
  "email": "usuario@ejemplo.com"
}
```

#### POST /auth/reset-password
Restablece la contraseña del usuario.

**Body:**
```json
{
  "token": "reset-token-here",
  "password": "newpassword123"
}
```

#### POST /auth/refresh
Refresca el token de acceso.

**Body:**
```json
{
  "refreshToken": "refresh-token-here"
}
```

### Metas

#### GET /metas
Obtiene todas las metas.

**Query Parameters:**
- `page`: Número de página (default: 1)
- `limit`: Límite de resultados por página (default: 10)
- `estado`: Filtrar por estado (PENDIENTE, EN_PROGRESO, COMPLETADA, CANCELADA)
- `creador_id`: Filtrar por ID del creador

**Response:**
```json
{
  "success": true,
  "data": {
    "metas": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

#### GET /metas/:id
Obtiene una meta específica.

#### POST /metas
Crea una nueva meta.

**Body:**
```json
{
  "nombre": "Nueva Meta",
  "descripcion": "Descripción de la meta",
  "fecha_limite": "2024-12-31"
}
```

#### PUT /metas/:id
Actualiza una meta existente.

#### DELETE /metas/:id
Elimina una meta.

### Contratistas

#### GET /contratistas
Obtiene todos los contratistas.

#### POST /contratistas
Crea un nuevo contratista.

**Body:**
```json
{
  "nombre": "Constructora ABC",
  "identificacion": "J-123456789",
  "contacto": "contacto@constructora.com"
}
```

#### PUT /contratistas/:id
Actualiza un contratista existente.

#### DELETE /contratistas/:id
Elimina un contratista.

### Avances

#### GET /avances
Obtiene todos los avances.

**Query Parameters:**
- `meta_id`: Filtrar por ID de meta
- `contratista_id`: Filtrar por ID de contratista
- `page`: Número de página
- `limit`: Límite de resultados

#### POST /avances
Crea un nuevo avance.

**Body:**
```json
{
  "descripcion": "Descripción del avance",
  "meta_id": 1,
  "contratista_id": 1,
  "numavance": 1,
  "reg_imagen": "url-de-imagen.jpg"
}
```

#### PUT /avances/:id
Actualiza un avance existente.

#### DELETE /avances/:id
Elimina un avance.

### Dashboard

#### GET /dashboard/stats
Obtiene estadísticas del dashboard.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMetas": 24,
    "metasCompletadas": 6,
    "metasEnProgreso": 12,
    "totalContratistas": 8,
    "totalAvances": 45,
    "avancesEsteMes": 15
  }
}
```

## Errores

La API utiliza códigos de estado HTTP estándar:

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error

**Formato de error:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Rate Limiting

- **General**: 100 solicitudes por 15 minutos por IP
- **Autenticación**: 5 intentos de login por 15 minutos por IP

## Seguridad

- Todos los endpoints están protegidos con CORS
- Las contraseñas se hashean con bcrypt
- Los tokens JWT expiran en 24 horas
- Validación de entrada en todos los endpoints
