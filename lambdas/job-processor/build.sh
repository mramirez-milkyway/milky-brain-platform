#!/bin/bash
set -e

echo "Building Lambda package..."

# Clean previous build
rm -rf dist package *.zip

# Compile TypeScript
echo "Compiling TypeScript..."
npx tsc

# Copy Prisma schema and generate client
echo "Generating Prisma client..."
mkdir -p dist/prisma
cp ../../apps/api/prisma/schema.prisma dist/prisma/
cd dist && npx prisma generate && cd ..

# Install production dependencies
echo "Installing production dependencies..."
cp package.json dist/
cd dist
npm install --production --omit=dev
cd ..

# Create deployment package
echo "Creating deployment package..."
cd dist
zip -r ../lambda.zip . -x "*.ts" "*.map"
cd ..

echo "Lambda package created: lambda.zip"
echo "Size: $(ls -lh lambda.zip | awk '{print $5}')"
