# 🚀 Quick Start Guide

Get your Telegram Postback Tracker Bot running in 5 minutes!

## ⚡ Super Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp env.example .env
# Edit .env with your actual values
```

### 3. Test Configuration
```bash
npm test
```

### 4. Start the Bot
```bash
npm start
```

### 5. Set Webhook
```bash
curl -X POST http://localhost:3000/set-webhook
```

## 🔧 Required Configuration

Edit `.env` file with these values:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_WEBHOOK_URL=https://yourdomain.com
PROPELLERADS_AID=your_advertiser_id
PROPELLERADS_TID=your_traffic_source_id
```

## 📱 Test Your Bot

Use this deep link format in PropellerAds:
```
https://t.me/your_bot_username?start=${SUBID}_{campaignid}_{zoneid}_prop
```

## 🎯 What Happens Next?

1. **User clicks ad** → PropellerAds redirects to Telegram
2. **Bot receives start command** → Stores tracking data
3. **User interacts** → Bot detects action (join group, type keyword, etc.)
4. **Postback sent** → Conversion data sent to PropellerAds

## 🛠️ Useful Commands

```bash
npm run dev          # Development mode with auto-restart
npm run monitor      # Real-time monitoring dashboard
npm run logs         # View live logs
npm run health       # Check bot health
npm run setup        # Run setup script
npm run deploy       # Deploy to production
```

## 🐳 Docker Deployment

```bash
# Build and run with Docker
npm run docker:build
npm run docker:run

# Or use Docker Compose
npm run docker:compose
```

## 📊 Monitor Your Bot

```bash
npm run monitor
```

This shows:
- Real-time statistics
- Recent activity
- Health status
- Configuration details

## 🆘 Need Help?

- Check the logs: `npm run logs`
- Run health check: `npm run health`
- View README.md for detailed documentation
- Check troubleshooting section in README

---

**That's it!** Your bot is now tracking conversions and sending postbacks to PropellerAds. 🎉


