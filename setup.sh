#!/bin/bash

# setup.sh
# Script de configuración para Open Recorder Tauri

set -e

echo "🚀 Configurando Open Recorder Tauri..."
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar Node.js
echo "📦 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado. Por favor instálalo desde https://nodejs.org/${NC}"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js encontrado: $NODE_VERSION${NC}"

# Verificar npm
echo "📦 Verificando npm..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm no está instalado.${NC}"
    exit 1
fi
NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ npm encontrado: $NPM_VERSION${NC}"

# Verificar Rust
echo "🦀 Verificando Rust..."
if ! command -v rustc &> /dev/null; then
    echo -e "${YELLOW}⚠️  Rust no está instalado.${NC}"
    echo "Instalando Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
    echo -e "${GREEN}✅ Rust instalado${NC}"
else
    RUST_VERSION=$(rustc --version)
    echo -e "${GREEN}✅ Rust encontrado: $RUST_VERSION${NC}"
fi

# Verificar Cargo
echo "📦 Verificando Cargo..."
if ! command -v cargo &> /dev/null; then
    echo -e "${RED}❌ Cargo no está instalado.${NC}"
    exit 1
fi
CARGO_VERSION=$(cargo --version)
echo -e "${GREEN}✅ Cargo encontrado: $CARGO_VERSION${NC}"

# Instalar dependencias de Node.js
echo ""
echo "📥 Instalando dependencias de Node.js..."
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencias de Node.js instaladas correctamente${NC}"
else
    echo -e "${RED}❌ Error al instalar dependencias de Node.js${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✨ ¡Configuración completada!${NC}"
echo ""
echo "Para ejecutar la aplicación en modo desarrollo:"
echo "  npm run tauri:dev"
echo ""
echo "Para construir la aplicación:"
echo "  npm run tauri:build"
echo ""
