#!/bin/bash

# Script de configuración inicial del proyecto

echo "🚀 Configurando Sistema de Gestión de Metas..."

# Verificar prerrequisitos
echo "📋 Verificando prerrequisitos..."

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

# Verificar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado. Por favor instala Docker Compose primero."
    exit 1
fi

# Verificar Node.js (para desarrollo local)
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    REQUIRED_NODE_VERSION="18"
    if [ "$(printf '%s\n' "$REQUIRED_NODE_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_NODE_VERSION" ]; then
        echo "⚠️  Se recomienda Node.js v$REQUIRED_NODE_VERSION o superior. Versión actual: v$NODE_VERSION"
    else
        echo "✅ Node.js v$NODE_VERSION detectado"
    fi
else
    echo "⚠️  Node.js no está instalado. Requerido para desarrollo local."
fi

# Crear archivos de entorno
echo "🔧 Configurando variables de entorno..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Archivo .env creado desde .env.example"
    echo "⚠️  Por favor edita .env con tus configuraciones específicas"
else
    echo "✅ Archivo .env ya existe"
fi

if [ ! -f frontend/.env.local ]; then
    cp frontend/.env.example frontend/.env.local
    echo "✅ Archivo frontend/.env.local creado"
else
    echo "✅ Archivo frontend/.env.local ya existe"
fi

# Opciones de despliegue
echo ""
echo "🎯 ¿Cómo quieres continuar?"
echo "1) Desarrollo con Docker"
echo "2) Desarrollo local"
echo "3) Producción con Docker"
echo "4) Solo configurar (sin iniciar servicios)"
echo ""
read -p "Selecciona una opción [1-4]: " choice

case $choice in
    1)
        echo "🐳 Iniciando entorno de desarrollo con Docker..."
        docker-compose -f docker-compose.dev.yml up -d
        echo "✅ Servicios de desarrollo iniciados"
        echo "🌐 Frontend: http://localhost:3001"
        echo "🔌 Backend API: http://localhost:3000"
        echo "🗄️  Base de datos: localhost:3306"
        ;;
    2)
        echo "💻 Configurando para desarrollo local..."
        
        # Backend
        echo "📦 Instalando dependencias del backend..."
        cd backend
        npm install
        
        echo "🗄️  Generando cliente Prisma..."
        npx prisma generate
        
        echo "🔄 Ejecutando migraciones..."
        npx prisma migrate dev
        
        echo "🌱 Ejecutando seed de datos..."
        npx prisma db seed
        
        cd ..
        
        # Frontend
        echo "📦 Instalando dependencias del frontend..."
        cd frontend
        npm install
        cd ..
        
        echo "✅ Configuración local completada"
        echo "💡 Para iniciar:"
        echo "   Backend: cd backend && npm run dev"
        echo "   Frontend: cd frontend && npm start"
        ;;
    3)
        echo "🚀 Iniciando entorno de producción con Docker..."
        docker-compose up -d --build
        echo "✅ Servicios de producción iniciados"
        echo "🌐 Aplicación: http://localhost:80"
        echo "🔌 Backend API: http://localhost:3000"
        ;;
    4)
        echo "✅ Configuración completada"
        echo "💡 Para iniciar manualmente:"
        echo "   Desarrollo: docker-compose -f docker-compose.dev.yml up -d"
        echo "   Producción: docker-compose up -d --build"
        ;;
    *)
        echo "❌ Opción no válida"
        exit 1
        ;;
esac

echo ""
echo "🎉 Configuración completada!"
echo ""
echo "📚 Documentación disponible:"
echo "   API: docs/API.md"
echo "   Despliegue: docs/DEPLOYMENT.md"
echo "   Desarrollo: docs/DEVELOPMENT.md"
echo ""
echo "🛠️  Comandos útiles:"
echo "   Ver logs: docker-compose logs -f"
echo "   Detener: docker-compose down"
echo "   Reconstruir: docker-compose up -d --build"
