#!/bin/bash

# Deployment script for HuggingFace Cloud Functions

echo "🚀 Starting deployment of HuggingFace Cloud Functions..."

# Check if HuggingFace token is configured
echo "📝 Checking HuggingFace token configuration..."
if [ -z "$HUGGINGFACE_TOKEN" ]; then
    echo "⚠️  HUGGINGFACE_TOKEN environment variable not set"
    echo "   You can set it with: export HUGGINGFACE_TOKEN='your_token_here'"
    echo "   Or configure it for Firebase Functions with:"
    echo "   firebase functions:config:set huggingface.token='your_token_here'"
fi

# Build the functions
echo "🏗️  Building TypeScript functions..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix TypeScript errors and try again."
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Firebase
echo "☁️  Deploying to Firebase..."
firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo "🎉 Deployment successful!"
    echo ""
    echo "📋 Available endpoints:"
    echo "   Text Processing:"
    echo "   • textGeneration"
    echo "   • textClassification" 
    echo "   • tokenClassification"
    echo "   • questionAnswering"
    echo "   • fillMask"
    echo "   • summarization"
    echo "   • translation"
    echo "   • sentenceSimilarity"
    echo "   • conversational"
    echo "   • featureExtraction"
    echo ""
    echo "   Media Processing:"
    echo "   • imageClassification"
    echo "   • objectDetection"
    echo "   • automaticSpeechRecognition"
    echo "   • tableQuestionAnswering"
    echo ""
    echo "📖 See HUGGINGFACE_API_DOCS.md for detailed usage examples"
else
    echo "❌ Deployment failed. Check the error messages above."
    exit 1
fi