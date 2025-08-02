#!/bin/bash

# Change a working directory to the script directory
cd "$(dirname "$0")"
cd ../

set -e  # Exit on any error

# Parse command line arguments
OVERRIDE_ENV=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -o)
            OVERRIDE_ENV=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [-o]"
            echo "  -o    Override existing .env files"
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "🚀 Starting build process for 1inch-fusion-plus..."

# Function to copy .env.example to .env
copy_env_files() {
    echo "📋 Copying .env.example files to .env..."
    
    # Copy for common package
    if [[ -f "packages/common/.env.example" ]]; then
        if [[ ! -f "packages/common/.env" ]] || [[ "$OVERRIDE_ENV" == true ]]; then
            echo "  📄 Copying packages/common/.env.example to packages/common/.env"
            cp packages/common/.env.example packages/common/.env
        else
            echo "  ⚠️  packages/common/.env already exists, skipping..."
        fi
    fi
    
    # Copy for server package
    if [[ -f "packages/server/.env.example" ]]; then
        if [[ ! -f "packages/server/.env" ]] || [[ "$OVERRIDE_ENV" == true ]]; then
            echo "  📄 Copying packages/server/.env.example to packages/server/.env"
            cp packages/server/.env.example packages/server/.env
        else
            echo "  ⚠️  packages/server/.env already exists, skipping..."
        fi
    fi
    
    # Copy for client package
    if [[ -f "packages/client/.env.example" ]]; then
        if [[ ! -f "packages/client/.env" ]] || [[ "$OVERRIDE_ENV" == true ]]; then
            echo "  📄 Copying packages/client/.env.example to packages/client/.env"
            cp packages/client/.env.example packages/client/.env
        else
            echo "  ⚠️  packages/client/.env already exists, skipping..."
        fi
    fi
    
    # Copy for local-evm-node package
    if [[ -f "packages/local-evm-node/.env.example" ]]; then
        if [[ ! -f "packages/local-evm-node/.env" ]] || [[ "$OVERRIDE_ENV" == true ]]; then
            echo "  📄 Copying packages/local-evm-node/.env.example to packages/local-evm-node/.env"
            cp packages/local-evm-node/.env.example packages/local-evm-node/.env
        else
            echo "  ⚠️  packages/local-evm-node/.env already exists, skipping..."
        fi
    fi
    
    # Copy for tezos scripts
    if [[ -f "contracts/tezos/scripts/.env.example" ]]; then
        if [[ ! -f "contracts/tezos/scripts/.env" ]] || [[ "$OVERRIDE_ENV" == true ]]; then
            echo "  📄 Copying contracts/tezos/scripts/.env.example to contracts/tezos/scripts/.env"
            cp contracts/tezos/scripts/.env.example contracts/tezos/scripts/.env
        else
            echo "  ⚠️  contracts/tezos/scripts/.env already exists, skipping..."
        fi
    fi
    
    echo "✅ Environment files setup complete"
}

# Function to install dependencies
install_dependencies() {
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
}

# Function to build all packages
build_packages() {
    echo "🔨 Building all packages..."
    
    # Build packages in the correct order (common first, then others)
    echo "  🔧 Building common package..."
    cd packages/common && npm run build && cd ../..
    
    echo "  🔧 Building server package..."
    cd packages/server && npm run build && cd ../..
    
    echo "  🔧 Building client package..."
    cd packages/client && npm run build && cd ../..
    
    echo "  🔧 Building local-evm-node package..."
    cd packages/local-evm-node && npm run build && cd ../..
    
    echo "  🔧 Building tezos scripts..."
    cd contracts/tezos/scripts && npm run build && cd ../../..
    
    echo "✅ All packages built successfully"
}

# Main execution
main() {
    echo "Starting at: $(date)"
    echo "Working directory is \"$PWD\""
    
    if [[ "$OVERRIDE_ENV" == true ]]; then
        echo "🔄 Override mode: Will overwrite existing .env files"
    fi
    
    # Ensure we're in the project root
    if [[ ! -f "package.json" ]]; then
        echo "❌ Error: package.json not found. Please run this script from the project root."
        exit 1
    fi
    
    # Copy environment files
    copy_env_files
    
    # Install dependencies
    install_dependencies
    
    # Build all packages
    build_packages
    
    echo ""
    echo "🎉 Build process completed successfully!"
    echo "Finished at: $(date)"
}

# Run the main function
main "$@"
