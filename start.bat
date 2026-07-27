@echo off
title Sticker & Vectorization Studio Launcher
echo ===================================================
echo  Sticker & Vectorization Studio - Local Desktop App
echo ===================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b
)

:: Copy .env.example to .env if it doesn't exist
if not exist .env (
    if exist .env.example (
        echo [INFO] Creating .env config file...
        copy .env.example .env >nul
        echo [SUCCESS] .env file created.
        echo Please open '.env' file in a text editor to add your GEMINI_API_KEY if needed.
    )
)

:: Check and install dependencies if node_modules is missing
if not exist node_modules (
    echo [INFO] First time setup: Installing local dependencies...
    echo This may take a minute, please wait...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies. Check your internet connection.
        pause
        exit /b
    )
)

:: Launch the default web browser at the correct local address
echo [INFO] Starting the local app server...
echo [INFO] Your app will open shortly at http://localhost:3000
start http://localhost:3000

:: Start Vite server on port 3000
call npm run dev -- --port 3000 --host 0.0.0.0

pause
