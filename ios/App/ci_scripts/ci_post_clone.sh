#!/bin/sh

# ci_post_clone.sh
# Script executado pelo Xcode Cloud após clonar o repositório
# Este script prepara o ambiente para build com SPM

set -e

echo "🚀 NexaEscala - Xcode Cloud Post-Clone Script"
echo "======================================"

# Diretório do workspace
cd "$CI_WORKSPACE"

echo "📍 Current directory: $(pwd)"
echo "📦 Installing Node.js dependencies..."

# Verificar se node está disponível
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing via Homebrew..."
    brew install node
fi

# Instalar dependências do npm
if [ -f "package.json" ]; then
    echo "📦 Found package.json, installing dependencies..."
    npm ci --prefer-offline --no-audit
else
    echo "⚠️ package.json not found!"
fi

# Build do web app
echo "🏗️ Building web application..."
npm run build

# Copiar assets para iOS
echo "📱 Copying web assets to iOS..."
npx cap copy ios

# Verificar estrutura do projeto iOS
echo "📂 Checking iOS project structure..."
if [ -f "ios/App/App.xcodeproj/project.pbxproj" ]; then
    echo "✅ iOS project found"
else
    echo "❌ iOS project not found!"
    exit 1
fi

# Verificar se SPM está configurado
if [ -f "ios/App/.spm" ]; then
    echo "✅ SPM configuration found"
else
    echo "⚠️ SPM configuration not found"
fi

# Listar pacotes Swift
echo "📦 Swift Package Dependencies:"
if [ -d "ios/App/App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm" ]; then
    ls -la "ios/App/App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/" || true
else
    echo "⚠️ No Swift packages directory found yet (they will be resolved during build)"
fi

echo "======================================"
echo "✅ Post-clone script completed successfully!"
echo "======================================"
