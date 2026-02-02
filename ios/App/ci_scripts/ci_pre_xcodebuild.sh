#!/bin/sh

# ci_pre_xcodebuild.sh
# Script executado pelo Xcode Cloud antes do xcodebuild
# Apenas valida que tudo está pronto - NÃO faz instalações

set -e

echo "🔧 NexaEscala - Xcode Cloud Pre-Xcodebuild Script"
echo "======================================"

# Navegar para a raiz do repositório
cd "$CI_PRIMARY_REPOSITORY_PATH"

echo "📍 Current directory: $(pwd)"

# Verificar que o build web foi feito
if [ -d "dist" ]; then
    echo "✅ Web build directory exists"
    echo "📊 Web build size: $(du -sh dist | cut -f1)"
else
    echo "⚠️ Web build directory not found - this may cause issues"
fi

# Verificar que os assets foram copiados
if [ -d "ios/App/App/public" ]; then
    echo "✅ iOS public assets directory exists"
    echo "📊 Assets size: $(du -sh ios/App/App/public | cut -f1)"
else
    echo "⚠️ iOS assets not found - this may cause issues"
fi

# Verificar capacitor config
if [ -f "ios/App/App/capacitor.config.json" ]; then
    echo "✅ Capacitor config found in iOS app"
else
    echo "⚠️ Capacitor config not found - this may cause issues"
fi

# Informações do ambiente
echo "======================================"
echo "📊 Environment Info:"
echo "Xcode version: $(xcodebuild -version | head -n 1)"
echo "Swift version: $(swift --version 2>/dev/null | head -n 1 || echo 'N/A')"
if command -v node &> /dev/null; then
    echo "Node version: $(node --version)"
fi
if command -v npm &> /dev/null; then
    echo "npm version: $(npm --version)"
fi
echo "======================================"

echo "✅ Pre-xcodebuild script completed successfully!"
echo "======================================"

# Sempre retornar sucesso - validações são apenas warnings
exit 0
