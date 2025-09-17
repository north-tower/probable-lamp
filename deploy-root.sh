#!/bin/bash

# Telegram Postback Tracker Bot - Deployment Script (Root Version)
# This script helps deploy the bot to a production server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BOT_NAME="telegram-postback-bot"
PM2_APP_NAME="telegram-bot"
NODE_VERSION="18"

echo -e "${BLUE}🚀 Telegram Postback Tracker Bot - Deployment Script (Root Version)${NC}\n"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    echo "Installing Node.js $NODE_VERSION..."
    
    # Install Node.js using NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | bash -
    apt-get install -y nodejs
    
    print_status "Node.js installed successfully"
else
    NODE_CURRENT_VERSION=$(node --version)
    print_status "Node.js is installed: $NODE_CURRENT_VERSION"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
else
    NPM_VERSION=$(npm --version)
    print_status "npm is installed: $NPM_VERSION"
fi

# Check PM2
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 is not installed. Installing..."
    npm install -g pm2
    print_status "PM2 installed successfully"
else
    PM2_VERSION=$(pm2 --version)
    print_status "PM2 is installed: $PM2_VERSION"
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found"
    if [ -f env.example ]; then
        print_info "Copying env.example to .env"
        cp env.example .env
        print_warning "Please edit .env file with your actual values before continuing"
        echo "Press Enter when you've configured .env file..."
        read
    else
        print_error "env.example file not found. Please create .env file manually"
        exit 1
    fi
else
    print_status ".env file found"
fi

# Install dependencies
echo -e "\n📦 Installing dependencies..."
npm install
print_status "Dependencies installed successfully"

# Build the application (if needed)
if [ -f "package.json" ] && grep -q "\"build\"" package.json; then
    echo "🔨 Building application..."
    npm run build
    print_status "Application built successfully"
fi

# Test the configuration
echo -e "\n🧪 Testing configuration..."
node test-bot.js
print_status "Configuration test passed"

# Create PM2 ecosystem file
echo -e "\n⚙️  Creating PM2 ecosystem file..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$PM2_APP_NAME',
    script: 'bot.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF
print_status "PM2 ecosystem file created"

# Create logs directory
mkdir -p logs
print_status "Logs directory created"

# Start the application with PM2
echo -e "\n🚀 Starting application with PM2..."
pm2 start ecosystem.config.js --env production
print_status "Application started with PM2"

# Save PM2 configuration
pm2 save
print_status "PM2 configuration saved"

# Setup PM2 to start on boot
pm2 startup
print_status "PM2 startup script generated"

# Show status
echo -e "\n📊 Application Status:"
pm2 status

# Show logs
echo -e "\n📋 Recent logs:"
pm2 logs $PM2_APP_NAME --lines 10

# Instructions for webhook setup
echo -e "\n${BLUE}🎯 Next Steps:${NC}"
echo "1. Your bot is now running on port 3000"
echo "2. Set up your webhook URL:"
echo "   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://yourdomain.com/webhook"
echo "3. Test the webhook endpoint:"
echo "   curl -X POST http://localhost:3000/set-webhook"
echo "4. Monitor the application:"
echo "   pm2 logs $PM2_APP_NAME"
echo "   pm2 monit"

# Health check
echo -e "\n🏥 Performing health check..."
sleep 2
if curl -s http://localhost:3000/health > /dev/null; then
    print_status "Health check passed - bot is running correctly"
else
    print_warning "Health check failed - check the logs for issues"
fi

echo -e "\n${GREEN}🎉 Deployment completed successfully!${NC}"
echo "Your Telegram Postback Tracker Bot is now running and ready to track conversions."
