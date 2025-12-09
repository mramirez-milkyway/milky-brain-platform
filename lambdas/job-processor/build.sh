#!/bin/bash
set -e

echo "Building Lambda package..."

# Clean previous build
rm -rf dist *.zip

# Compile TypeScript
echo "Compiling TypeScript..."
npx tsc

# Copy Prisma schema and generate client
echo "Generating Prisma client..."
mkdir -p dist/prisma
cp ../../apps/api/prisma/schema.prisma dist/prisma/
cd dist && npx prisma generate && cd ..

# Install production dependencies in a clean directory
echo "Installing production dependencies..."
rm -rf node_modules
npm install --omit=dev

# Create deployment package from dist
echo "Creating deployment package..."
cd dist && zip -r ../lambda.zip . && cd ..

# Add production node_modules (exclude unnecessary files)
echo "Adding dependencies..."
zip -r lambda.zip node_modules/ package.json \
  -x "node_modules/@types/*" \
  -x "node_modules/@jest/*" \
  -x "node_modules/*/test/*" \
  -x "node_modules/*/tests/*" \
  -x "node_modules/*/*.md" \
  -x "node_modules/*/LICENSE*" \
  -x "node_modules/.bin/*" \
  -x "node_modules/typescript/*"

echo "Lambda package created: lambda.zip"
echo "Size: $(ls -lh lambda.zip | awk '{print $5}')"
