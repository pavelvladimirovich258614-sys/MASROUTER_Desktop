#!/usr/bin/env bash
# Build script for macOS / Linux.
set -e
echo "[1/3] Installing dependencies..."
npm install
echo "[2/3] Building renderer + main..."
npm run build
echo "[3/3] Building installers via electron-builder..."
npx electron-builder
echo "Done. Artifacts in release/"
