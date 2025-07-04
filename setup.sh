#!/bin/bash

echo "🚀 RAG Starter Kit Setup"
echo "========================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "📦 Installing server dependencies..."
cd server && npm install && cd ..

echo "📦 Installing client dependencies..."
cd client && npm install && cd ..

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads

# Check if .env file exists
if [ ! -f "server/.env" ]; then
    echo "📝 Creating environment file..."
    cp server/env.example server/.env
    echo "⚠️  Please edit server/.env with your API keys before starting the application."
else
    echo "✅ Environment file already exists."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit server/.env with your OpenAI and Pinecone API keys"
echo "2. Run 'npm run dev' to start the application"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "For more information, see the README.md file." 