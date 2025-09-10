# Telegram Postback Tracker Bot

A Node.js-based Telegram bot that tracks user interactions and sends conversion postbacks to PropellerAds. This bot is designed to work with advertising campaigns where you need to track user engagement from click to conversion.

## 🎯 Features

- **Deep Link Tracking**: Captures click IDs from PropellerAds campaigns
- **Multiple Event Types**: Tracks various user interactions (joins, keywords, button clicks)
- **Automatic Postbacks**: Sends conversion data back to PropellerAds
- **Group Support**: Works in both private chats and groups
- **Comprehensive Logging**: Detailed logs for debugging and analytics
- **RESTful API**: Webhook endpoints for easy integration
- **Production Ready**: Includes error handling, rate limiting, and graceful shutdown

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- A public server with HTTPS
- Telegram Bot Token (from @BotFather)
- PropellerAds account with AID and TID

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `env.example` to `.env` and fill in your values:

```bash
cp env.example .env
```

Edit `.env` with your actual values:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=123456789:ABCDEFghIJKlmNoPQRStuvWxYZ987654321
TELEGRAM_WEBHOOK_URL=https://yourdomain.com

# PropellerAds Configuration
PROPELLERADS_AID=your_advertiser_id
PROPELLERADS_TID=your_traffic_source_id
PROPELLERADS_POSTBACK_URL=http://ad.propellerads.com/conversion.php

# Server Configuration
PORT=3000
NODE_ENV=production
```

### 3. Start the Bot

```bash
# Production
npm start

# Development (with auto-restart)
npm run dev
```

### 4. Set Webhook

Once your server is running, set the Telegram webhook:

```bash
curl -X POST http://localhost:3000/set-webhook
```

Or manually via Telegram API:

```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://yourdomain.com/webhook
```

## 📱 Usage

### Deep Link Format

Set this as your Target URL in PropellerAds:

```
https://t.me/your_bot_username?start=${SUBID}_{campaignid}_{zoneid}_prop
```

**Parameters:**
- `${SUBID}`: Unique click ID (automatically replaced by PropellerAds)
- `{campaignid}`: Campaign identifier (optional)
- `{zoneid}`: Zone identifier (optional)
- `_prop`: Network tag (optional)

**Example:**
```
https://t.me/postback_tracker_bot?start=abc123_456_789_prop
```

### Supported Commands

- `/start <parameters>` - Initialize bot with tracking parameters
- `/help` - Show available commands
- `/status` - Check bot status and tracking info

### Trigger Keywords

The bot automatically detects these keywords and sends postbacks:
- `register`, `signup`, `join`
- `subscribe`, `confirm`
- `buy`, `purchase`
- `download`, `install`

## 🏗️ Architecture

```
PropellerAds Campaign → Deep Link → Telegram Bot → Webhook → Postback
```

1. **Campaign Click**: User clicks ad in PropellerAds
2. **Deep Link**: User is redirected to Telegram with tracking parameters
3. **Bot Interaction**: Bot receives start command and stores tracking data
4. **User Action**: User performs tracked action (join group, type keyword, etc.)
5. **Postback**: Bot sends conversion data back to PropellerAds

## 🔧 Configuration

### Bot Settings

Edit `config.js` to customize:

- Bot name and username
- Trigger keywords
- Event types
- Storage settings
- Security options

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | Yes |
| `TELEGRAM_WEBHOOK_URL` | Your server's public URL | Yes |
| `PROPELLERADS_AID` | PropellerAds advertiser ID | Yes |
| `PROPELLERADS_TID` | PropellerAds traffic source ID | Yes |
| `PORT` | Server port (default: 3000) | No |

## 📊 API Endpoints

### Webhook
- `POST /webhook` - Main Telegram webhook endpoint

### Management
- `GET /health` - Health check and status
- `POST /set-webhook` - Set Telegram webhook
- `GET /webhook-info` - Get current webhook information

### Health Check Response
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "mappings": 42
}
```

## 🧪 Testing

### 1. Test Deep Link

Use this URL to test your bot:
```
https://t.me/your_bot_username?start=test123_456_789_prop
```

### 2. Test Keywords

After starting the bot, type any trigger keyword:
- `register`
- `signup`
- `join`

### 3. Check Logs

Monitor the logs for tracking information:
```bash
tail -f combined.log
```

## 🚀 Deployment

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start the bot
pm2 start bot.js --name "telegram-bot"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Using Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Using Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    location /webhook {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔍 Monitoring

### Log Files

- `combined.log` - All log entries
- `error.log` - Error-level logs only
- `access.log` - HTTP request logs

### Metrics

The bot tracks:
- Number of active click ID mappings
- Postback success/failure rates
- User interaction events
- Webhook processing times

## 🛠️ Troubleshooting

### Common Issues

1. **Webhook not receiving updates**
   - Check if webhook is set correctly
   - Verify HTTPS is working
   - Check server firewall settings

2. **Postbacks failing**
   - Verify AID and TID are correct
   - Check PropellerAds postback URL
   - Monitor error logs

3. **Bot not responding**
   - Check bot token validity
   - Verify webhook endpoint is accessible
   - Check server logs for errors

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug npm start
```

## 🔒 Security Considerations

- **HTTPS Required**: Telegram webhooks require HTTPS
- **Rate Limiting**: Built-in rate limiting prevents abuse
- **Input Validation**: All inputs are validated and sanitized
- **Logging**: Comprehensive logging for audit trails
- **Environment Variables**: Sensitive data stored in environment

## 📈 Scaling

For high-traffic scenarios:

1. **Database**: Replace file storage with Redis/PostgreSQL
2. **Load Balancing**: Use multiple bot instances behind a load balancer
3. **Caching**: Implement Redis caching for frequently accessed data
4. **Monitoring**: Add Prometheus metrics and Grafana dashboards

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs
3. Open an issue on GitHub
4. Contact the maintainers

---

**Note**: This bot is designed for legitimate advertising tracking purposes. Ensure compliance with Telegram's Terms of Service and PropellerAds policies.
