#!/bin/bash

# Trading Strategy Backtester Build Script for Production Deployment

echo "Starting build process..."

# Install Python dependencies
echo "Installing Python dependencies..."
cd server
if [ -f requirements.txt ]; then
    pip install -r requirements.txt
fi
cd ..

# Build the frontend
echo "Building client (React + Vite)..."
npm run build:client

# Build the server
echo "Building server (Node.js + TypeScript)..."
npm run build:server

# Run database migrations
echo "Setting up database schema..."
npm run db:push

echo "Build completed successfully!"

# Verify build outputs
if [ -d "dist" ]; then
    echo "✓ Frontend built successfully"
else
    echo "✗ Frontend build failed"
    exit 1
fi

if [ -f "dist/server.js" ]; then
    echo "✓ Server built successfully"
else
    echo "✗ Server build failed"
    exit 1
fi

echo "All build steps completed successfully. Ready for deployment!"