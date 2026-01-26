# Open Recorder Tauri

Aplicación de escritorio para reproducir y gestionar grabaciones de audio, construida con Tauri y Next.js.

## Requisitos Previos

Antes de ejecutar este proyecto, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior) - [Descargar Node.js](https://nodejs.org/)
- **Rust** (última versión estable) - [Instalar Rust](https://www.rust-lang.org/tools/install)
- **npm** (incluido con Node.js)

### Verificar Instalación

```bash
node --version
npm --version
rustc --version
cargo --version
```

## Instalación Rápida

Ejecuta el script de configuración:

```bash
chmod +x setup.sh
./setup.sh
```

O sigue los pasos manuales a continuación.

## Instalación Manual

1. **Instalar dependencias de Node.js:**
   ```bash
   npm install
   ```

2. **Las dependencias de Rust se instalarán automáticamente** cuando ejecutes Tauri por primera vez.

## Ejecutar en Modo Desarrollo

Para ejecutar la aplicación en modo desarrollo:

```bash
npm run tauri:dev
```

Este comando:
- Inicia el servidor de desarrollo de Next.js
- Compila el backend de Rust/Tauri
- Abre la ventana de la aplicación de escritorio

## Construir para Producción

Para crear una versión de producción:

```bash
npm run tauri:build
```

El ejecutable se generará en:
- **macOS**: `src-tauri/target/release/bundle/macos/`
- **Windows**: `src-tauri/target/release/bundle/msi/`
- **Linux**: `src-tauri/target/release/bundle/appimage/`

## Scripts Disponibles

- `npm run dev` - Ejecuta solo Next.js (sin Tauri)
- `npm run build` - Construye solo Next.js
- `npm run start` - Inicia el servidor de producción de Next.js
- `npm run lint` - Ejecuta el linter de ESLint
- `npm run tauri` - Ejecuta comandos de Tauri CLI
- `npm run tauri:dev` - Modo desarrollo con Tauri
- `npm run tauri:build` - Construye la aplicación de escritorio

## Estructura del Proyecto

```
open-recorder-tauri/
├── app/                    # Páginas de Next.js (App Router)
├── src/
│   ├── components/         # Componentes React
│   └── lib/               # Utilidades y tipos TypeScript
├── src-tauri/             # Backend Rust/Tauri
│   ├── src/               # Código Rust
│   └── tauri.conf.json    # Configuración de Tauri
└── plan/                  # Planificación del proyecto
```

## Solución de Problemas

### Error: "tauri: command not found"
Asegúrate de haber ejecutado `npm install` para instalar `@tauri-apps/cli`.

### Error de compilación de Rust
Verifica que Rust esté correctamente instalado:
```bash
rustup update
```

### Puerto 3000 ya en uso
Si el puerto 3000 está ocupado, puedes cambiarlo editando `package.json` o usando una variable de entorno.

## Desarrollo

Este proyecto utiliza:
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Tauri 2.x, Rust
- **Iconos**: Lucide React

## Licencia

[Especificar licencia aquí]
