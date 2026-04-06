# Script de configuración inicial del proyecto (PowerShell)

Write-Host "🚀 Configurando Sistema de Gestión de Metas..." -ForegroundColor Green

# Verificar prerrequisitos
Write-Host "📋 Verificando prerrequisitos..." -ForegroundColor Yellow

# Verificar Docker
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker detectado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker no está instalado. Por favor instala Docker primero." -ForegroundColor Red
    exit 1
}

# Verificar Docker Compose
try {
    $composeVersion = docker-compose --version
    Write-Host "✅ Docker Compose detectado: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose no está instalado. Por favor instala Docker Compose primero." -ForegroundColor Red
    exit 1
}

# Verificar Node.js (para desarrollo local)
try {
    $nodeVersion = node -v
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($majorVersion -lt 18) {
        Write-Host "⚠️  Se recomienda Node.js v18 o superior. Versión actual: $nodeVersion" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Node.js $nodeVersion detectado" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Node.js no está instalado. Requerido para desarrollo local." -ForegroundColor Yellow
}

# Crear archivos de entorno
Write-Host "🔧 Configurando variables de entorno..." -ForegroundColor Yellow

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Archivo .env creado desde .env.example" -ForegroundColor Green
    Write-Host "⚠️  Por favor edita .env con tus configuraciones específicas" -ForegroundColor Yellow
} else {
    Write-Host "✅ Archivo .env ya existe" -ForegroundColor Green
}

if (-not (Test-Path "frontend\.env.local")) {
    Copy-Item "frontend\.env.example" "frontend\.env.local"
    Write-Host "✅ Archivo frontend\.env.local creado" -ForegroundColor Green
} else {
    Write-Host "✅ Archivo frontend\.env.local ya existe" -ForegroundColor Green
}

# Opciones de despliegue
Write-Host ""
Write-Host "🎯 ¿Cómo quieres continuar?" -ForegroundColor Cyan
Write-Host "1) Desarrollo con Docker" -ForegroundColor White
Write-Host "2) Desarrollo local" -ForegroundColor White
Write-Host "3) Producción con Docker" -ForegroundColor White
Write-Host "4) Solo configurar (sin iniciar servicios)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Selecciona una opción [1-4]"

switch ($choice) {
    "1" {
        Write-Host "🐳 Iniciando entorno de desarrollo con Docker..." -ForegroundColor Blue
        docker-compose -f docker-compose.dev.yml up -d
        Write-Host "✅ Servicios de desarrollo iniciados" -ForegroundColor Green
        Write-Host "🌐 Frontend: http://localhost:3001" -ForegroundColor Cyan
        Write-Host "🔌 Backend API: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "🗄️  Base de datos: localhost:3306" -ForegroundColor Cyan
    }
    "2" {
        Write-Host "💻 Configurando para desarrollo local..." -ForegroundColor Blue
        
        # Backend
        Write-Host "📦 Instalando dependencias del backend..." -ForegroundColor Yellow
        Set-Location backend
        npm install
        
        Write-Host "🗄️  Generando cliente Prisma..." -ForegroundColor Yellow
        npx prisma generate
        
        Write-Host "🔄 Ejecutando migraciones..." -ForegroundColor Yellow
        npx prisma migrate dev
        
        Write-Host "🌱 Ejecutando seed de datos..." -ForegroundColor Yellow
        npx prisma db seed
        
        Set-Location ..
        
        # Frontend
        Write-Host "📦 Instalando dependencias del frontend..." -ForegroundColor Yellow
        Set-Location frontend
        npm install
        Set-Location ..
        
        Write-Host "✅ Configuración local completada" -ForegroundColor Green
        Write-Host "💡 Para iniciar:" -ForegroundColor Cyan
        Write-Host "   Backend: cd backend && npm run dev" -ForegroundColor White
        Write-Host "   Frontend: cd frontend && npm start" -ForegroundColor White
    }
    "3" {
        Write-Host "🚀 Iniciando entorno de producción con Docker..." -ForegroundColor Blue
        docker-compose up -d --build
        Write-Host "✅ Servicios de producción iniciados" -ForegroundColor Green
        Write-Host "🌐 Aplicación: http://localhost:80" -ForegroundColor Cyan
        Write-Host "🔌 Backend API: http://localhost:3000" -ForegroundColor Cyan
    }
    "4" {
        Write-Host "✅ Configuración completada" -ForegroundColor Green
        Write-Host "💡 Para iniciar manualmente:" -ForegroundColor Cyan
        Write-Host "   Desarrollo: docker-compose -f docker-compose.dev.yml up -d" -ForegroundColor White
        Write-Host "   Producción: docker-compose up -d --build" -ForegroundColor White
    }
    default {
        Write-Host "❌ Opción no válida" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🎉 Configuración completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Documentación disponible:" -ForegroundColor Cyan
Write-Host "   API: docs\API.md" -ForegroundColor White
Write-Host "   Despliegue: docs\DEPLOYMENT.md" -ForegroundColor White
Write-Host "   Desarrollo: docs\DEVELOPMENT.md" -ForegroundColor White
Write-Host ""
Write-Host "🛠️  Comandos útiles:" -ForegroundColor Cyan
Write-Host "   Ver logs: docker-compose logs -f" -ForegroundColor White
Write-Host "   Detener: docker-compose down" -ForegroundColor White
Write-Host "   Reconstruir: docker-compose up -d --build" -ForegroundColor White
