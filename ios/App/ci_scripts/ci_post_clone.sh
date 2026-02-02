#!/bin/sh

# ci_post_clone.sh
# Script executado pelo Xcode Cloud após clonar o repositório
# Este script prepara o ambiente para build com SPM

set -e

echo "🚀 NexaEscala - Xcode Cloud Post-Clone Script"
echo "======================================"

# CI_PRIMARY_REPOSITORY_PATH aponta para a raiz do repositório
# Vamos usar isso em vez de CI_WORKSPACE que pode estar errado
cd "$CI_PRIMARY_REPOSITORY_PATH"

echo "📍 Current directory: $(pwd)"
echo "📂 Contents:"
ls -la

# Verificar se package.json existe
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found at $(pwd)"
    echo "Trying to find it..."
    find . -name "package.json" -type f 2>/dev/null | head -5
    exit 1
fi

echo "✅ Found package.json"

# Verificar se node está disponível
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing via Homebrew..."
    brew install node
fi

echo "📍 Node version: $(node --version)"
echo "📍 npm version: $(npm --version)"

# Instalar dependências
echo "📦 Installing npm dependencies..."
npm ci || npm install

# Build do web app
echo "🏗️ Building web application..."
npm run build

# Verificar que dist/ foi criado
if [ -d "dist" ]; then
    echo "✅ Web build completed successfully"
    echo "📊 Build size: $(du -sh dist | cut -f1)"
else
    echo "❌ dist/ directory not created!"
    exit 1
fi

# Copiar assets para iOS
echo "📱 Copying web assets to iOS..."
npx cap copy ios

# Verificar que os assets foram copiados
if [ -d "ios/App/App/public" ]; then
    echo "✅ Assets copied to iOS successfully"
else
    echo "❌ iOS public directory not created!"
    exit 1
fi

if [ -f "ios/App/App/capacitor.config.json" ]; then
    echo "✅ Capacitor config created"
else
    echo "❌ capacitor.config.json not created!"
    exit 1
fi

echo "======================================"
echo "✅ Post-clone script completed successfully!"
echo "======================================"
