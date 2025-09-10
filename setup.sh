#!/bin/bash

# Simple setup script for Telegram Postback Tracker Bot

echo "🚀 Setting up Telegram Postback Tracker Bot..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your actual values before running the bot"
    echo "   Required values:"
    echo "   - TELEGRAM_BOT_TOKEN"
    echo "   - TELEGRAM_WEBHOOK_URL"
    echo "   - PROPELLERADS_AID"
    echo "   - PROPELLERADS_TID"
else
    echo "✅ .env file already exists"
fi

# Test the configuration
echo "🧪 Testing configuration..."
node test-bot.js

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your actual values"
echo "2. Run: npm start"
echo "3. Set your webhook URL"
echo "4. Test with a deep link"
echo ""
echo "📚 For more information, see README.md"


