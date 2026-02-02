#!/bin/bash

# NexaEscala iOS - Helper Script (SPM)
# Este script facilita o desenvolvimento iOS com Swift Package Manager

echo "🚀 NexaEscala iOS - SPM Helper"
echo ""

# Função para compilar o web app
build_web() {
    echo "📦 Building web app..."
    npm run build
}

# Função para copiar assets para iOS
copy_ios() {
    echo "📱 Copying web assets to iOS..."
    npx cap copy ios
}

# Função para abrir o Xcode
open_xcode() {
    echo "🔨 Opening Xcode..."
    open ios/App/App.xcodeproj
}

# Processar argumentos
case "$1" in
    build)
        build_web
        ;;
    copy)
        copy_ios
        ;;
    open)
        open_xcode
        ;;
    sync)
        build_web
        copy_ios
        echo "✅ Sync complete! Use 'npm run ios:open' to open Xcode"
        ;;
    *)
        echo "Uso:"
        echo "  npm run ios:build  - Compila o web app"
        echo "  npm run ios:copy   - Copia assets para iOS"
        echo "  npm run ios:open   - Abre o Xcode"
        echo "  npm run ios:sync   - Build + Copy (substitui cap sync)"
        echo ""
        echo "Nota: Não use 'npx cap sync ios' - ele tenta usar CocoaPods!"
        echo "Use 'npm run ios:sync' em vez disso."
        ;;
esac
