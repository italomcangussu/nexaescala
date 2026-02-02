#!/bin/sh

# ci_pre_xcodebuild.sh
# Script executado pelo Xcode Cloud antes do xcodebuild
# Garante que todas as configurações estejam corretas

set -e

echo "🔧 NexaEscala - Xcode Cloud Pre-Xcodebuild Script"
echo "======================================"

cd "$CI_WORKSPACE"

echo "📍 Current directory: $(pwd)"

# Verificar que o build web foi feito
if [ -d "dist" ]; then
    echo "✅ Web build directory exists"
    echo "📊 Web build size: $(du -sh dist | cut -f1)"
else
    echo "❌ Web build directory not found!"
    echo "🔄 Running build again..."
    npm run build
    npx cap copy ios
fi

# Verificar que os assets foram copiados
if [ -d "ios/App/App/public" ]; then
    echo "✅ iOS public assets directory exists"
    echo "📊 Assets size: $(du -sh ios/App/App/public | cut -f1)"
else
    echo "❌ iOS assets not found!"
    echo "🔄 Copying assets..."
    npx cap copy ios
fi

# Verificar capacitor config
if [ -f "ios/App/App/capacitor.config.json" ]; then
    echo "✅ Capacitor config found in iOS app"
else
    echo "⚠️ Capacitor config not found, will be generated during copy"
fi

# Informações do ambiente
echo "======================================"
echo "📊 Environment Info:"
echo "Xcode version: $(xcodebuild -version | head -n 1)"
echo "Swift version: $(swift --version | head -n 1)"
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"
echo "======================================"

echo "✅ Pre-xcodebuild script completed successfully!"
echo "======================================"
