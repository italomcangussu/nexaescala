#!/bin/sh

# ci_post_clone.sh
# Script executado pelo Xcode Cloud após clonar o repositório
# Este script prepara o ambiente para build com SPM

set -e # Exit on error
set -x # Print commands for debugging

echo "🚀 NexaEscala - Xcode Cloud Post-Clone Script"
echo "======================================"

# Determine the project root
# Xcode Cloud runs this script from its location: ios/App/ci_scripts/
# We want to go to the root of the repository
if [ -n "$CI_PRIMARY_REPOSITORY_PATH" ]; then
    cd "$CI_PRIMARY_REPOSITORY_PATH"
else
    # Fallback if CI_PRIMARY_REPOSITORY_PATH is not set
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    cd "$SCRIPT_DIR/../../.."
fi

echo "📍 Current directory: $(pwd)"
echo "📂 Contents of directory:"
ls -F

# 1. Environment Check
echo "🔍 Checking Environment..."
# Force install Node to ensure we have a recent version (Vite 6 requires Node 18+)
echo "⬇️  Installing Node.js via Homebrew..."
brew install node
# Link it just in case
brew link --overwrite node

NODE_VERSION=$(node -v)
echo "📍 Node version: $NODE_VERSION"
echo "📍 npm version: $(npm -v)"

# 2. Dependency Installation
echo "📦 Installing npm dependencies..."
# Use --legacy-peer-deps to avoid common installation failures in CI
# We use npm install instead of ci to be more forgiving of lockfile mismatches in this environment
npm install --legacy-peer-deps || { echo "❌ npm install failed"; exit 1; }

# 3. Web App Build
echo "🏗️ Building web application..."
echo "📍 Environment variables check:"
echo "  VITE_SUPABASE_URL: ${VITE_SUPABASE_URL:-(not set)}"
echo "  VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY:+[set]}"
echo "  VITE_VAPID_PUBLIC_KEY: ${VITE_VAPID_PUBLIC_KEY:+[set]}"

# Use CI=false to prevent warnings from failing the build in some environments
# Capture build output for better error diagnosis
BUILD_OUTPUT=$(CI=false npm run build 2>&1) || {
    echo "❌ npm run build failed"
    echo "📋 Build output:"
    echo "$BUILD_OUTPUT"
    exit 1
}
echo "$BUILD_OUTPUT"

# Verify build output
if [ ! -d "dist" ]; then
    echo "❌ dist/ directory not created after build!"
    exit 1
fi
echo "✅ Web build completed successfully"

# 4. Capacitor Copy
echo "📱 Copying assets to iOS..."
# We use 'copy' instead of 'sync' to avoid triggering CocoaPods as per ios-helper.sh
./node_modules/.bin/cap copy ios || { echo "❌ capacitor copy failed"; exit 1; }



# Verify synchronization
if [ ! -d "ios/App/App/public" ]; then
    echo "❌ iOS public directory (ios/App/App/public) was not created!"
    # Let's try to create it manually if it's missing but we have dist
    mkdir -p ios/App/App/public
    cp -R dist/* ios/App/App/public/
fi

# Look for capacitor config in the native project
if [ ! -f "ios/App/App/capacitor.config.json" ]; then
    echo "⚠️ capacitor.config.json not found in native project, this might be expected if using SPM but unusual."
fi

echo "======================================"
echo "✅ Post-clone script completed successfully!"
echo "======================================"

