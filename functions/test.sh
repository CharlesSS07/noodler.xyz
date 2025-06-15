#!/bin/bash

# Test script for HuggingFace Cloud Functions

echo "🧪 Running HuggingFace Cloud Functions Tests..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the functions
echo "🏗️  Building TypeScript functions..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix TypeScript errors and try again."
    exit 1
fi

echo "✅ Build successful!"

# Run tests based on argument
case "$1" in
    "utils")
        echo "🔧 Running utility function tests..."
        npm run test:utils
        ;;
    "text")
        echo "📝 Running text processing tests..."
        npm run test:text
        ;;
    "media")
        echo "🖼️  Running media processing tests..."
        npm run test:media
        ;;
    "legacy")
        echo "🕰️  Running legacy endpoint tests..."
        npm run test:legacy
        ;;
    "unit")
        echo "🎯 Running all unit tests..."
        npm run test:unit
        ;;
    "all"|"")
        echo "🚀 Running all tests..."
        npm run test
        ;;
    *)
        echo "Usage: $0 [utils|text|media|legacy|unit|all]"
        echo "  utils  - Test utility functions"
        echo "  text   - Test text processing endpoints"
        echo "  media  - Test media processing endpoints"
        echo "  legacy - Test legacy proxy endpoint"
        echo "  unit   - Test all unit tests"
        echo "  all    - Test everything (default)"
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    echo "✅ Tests passed!"
else
    echo "❌ Some tests failed. Check the output above."
    exit 1
fi