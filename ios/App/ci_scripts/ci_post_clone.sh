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
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js not found! This is unexpected in Xcode Cloud."
    # We try to use a default path or install if absolutely necessary, 
    # but usually it's in the path.
    exit 1
fi

NODE_VERSION=$(node -v)
echo "📍 Node version: $NODE_VERSION"
echo "📍 npm version: $(npm -v)"

# 2. Dependency Installation
echo "📦 Installing npm dependencies..."
# Use --legacy-peer-deps to avoid common installation failures in CI
# npm ci is preferred if package-lock.json is reliable
if [ -f "package-lock.json" ]; then
    echo "using npm ci..."
    npm ci --legacy-peer-deps || (echo "npm ci failed, trying npm install..." && npm install --legacy-peer-deps)
else
    echo "using npm install..."
    npm install --legacy-peer-deps
fi

# 3. Web App Build
echo "🏗️ Building web application..."
# Use CI=false to prevent warnings from failing the build in some environments
CI=false npm run build

# Verify build output
if [ ! -d "dist" ]; then
    echo "❌ dist/ directory not created after build!"
    exit 1
fi
echo "✅ Web build completed successfully"

# 4. Capacitor Copy
echo "📱 Copying assets to iOS..."
# We use 'copy' instead of 'sync' to avoid triggering CocoaPods as per ios-helper.sh
./node_modules/.bin/cap copy ios


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

