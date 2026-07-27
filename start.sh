#!/bin/bash

# Sticker & Vectorization Studio Launcher for macOS and Linux
echo "==================================================="
echo " Sticker & Vectorization Studio - Local Desktop App"
echo "==================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please download and install Node.js from https://nodejs.org/"
    echo ""
    exit 1
fi

# Copy .env.example to .env if it doesn't exist
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "[INFO] Creating .env config file..."
        cp .env.example .env
        echo "[SUCCESS] .env file created."
        echo "Please open '.env' file to add your GEMINI_API_KEY if needed."
    fi
fi

# Install dependencies if node_modules is missing
if [ ! -d node_modules ]; then
    echo "[INFO] First time setup: Installing local dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install dependencies."
        exit 1
    fi
fi

echo "[INFO] Starting the local app server..."
echo "[INFO] Your app will open shortly at http://localhost:3000"

# Open the browser automatically
if [ "$(uname)" == "Darwin" ]; then
    open "http://localhost:3000"
elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
    xdg-open "http://localhost:3000" 2>/dev/null || echo "Please open http://localhost:3000 in your browser"
fi

# Start Vite dev server on port 3000
npm run dev -- --port 3000 --host 0.0.0.0
