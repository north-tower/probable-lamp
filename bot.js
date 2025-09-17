const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Initialize Express app
const app = express();
app.use(express.json());

// Bot configuration
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
const port = process.env.PORT || 3000;
const tradingChannelUrl = process.env.TRADING_CHANNEL_URL || 'https://t.me/your_trading_channel';

if (!botToken) {
  logger.error('TELEGRAM_BOT_TOKEN is required in environment variables');
  process.exit(1);
}

// Initialize bot
const bot = new TelegramBot(botToken, { polling: false });

// Storage for tracking click IDs (in production, use a proper database)
const STORAGE_FILE = 'subid_map.json';
let clickIdMap = {};

// Load existing mapping data
function loadClickIdMap() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf8');
      clickIdMap = JSON.parse(data);
      logger.info(`Loaded ${Object.keys(clickIdMap).length} click ID mappings`);
    }
  } catch (error) {
    logger.error('Error loading click ID map:', error);
  }
}

// Save mapping data
function saveClickIdMap() {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(clickIdMap, null, 2));
  } catch (error) {
    logger.error('Error saving click ID map:', error);
  }
}

// Load initial data
loadClickIdMap();

// Function to send postback to PropellerAds
async function sendPostback(visitorId, eventType = 'conversion') {
  try {
    const aid = process.env.PROPELLERADS_AID;
    const tid = process.env.PROPELLERADS_TID;
    const baseUrl = process.env.PROPELLERADS_POSTBACK_URL;

    if (!aid || !tid) {
      logger.error('PropellerAds AID or TID not configured');
      return false;
    }

    const postbackUrl = `${baseUrl}?aid=${aid}&pid=&tid=${tid}&visitor_id=${encodeURIComponent(visitorId)}`;
    
    logger.info(`Sending postback for ${eventType}: ${postbackUrl}`);
    
    const response = await axios.get(postbackUrl);
    
    if (response.status === 200) {
      logger.info(`Postback sent successfully for visitor ${visitorId}`);
      return true;
    } else {
      logger.warn(`Postback failed with status ${response.status}`);
      return false;
    }
  } catch (error) {
    logger.error('Error sending postback:', error.message);
    return false;
  }
}

// Handle deep link start command
async function handleStartCommand(message) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  const text = message.text;
  
  if (!text.startsWith('/start ')) return;

  const startParam = text.substring(7);
  const params = startParam.split('_');
  
  const visitorId = params[0];
  const campaignId = params[1];
  const zoneId = params[2];
  const network = params[3];

  logger.info(`New user started bot: ${userId}, visitorId: ${visitorId}, campaign: ${campaignId}, zone: ${zoneId}, network: ${network}`);

  // Store the mapping
  if (visitorId && userId) {
    clickIdMap[userId] = {
      visitorId,
      campaignId,
      zoneId,
      network,
      timestamp: new Date().toISOString()
    };
    saveClickIdMap();
    
    logger.info(`Stored click ID mapping: ${userId} -> ${visitorId}`);
  }

  // Send welcome message
  const welcomeText = `👋 *Welcome! You've just come across AI-powered, risk-managed trading built for long-term growth.*\n\n` +
                     `*Here's why people are joining us:*\n` +
                     `📈 Consistent 15% + monthly returns\n` +
                     `🤝 No charge until you've made £500 profit\n` +
                     `📊 Trusted by 1,000+ members already seeing results\n` +
                     `📢 Weekly updates, transparent results & 24/7 personal support line\n\n` +
                     `*This is about building steady growth.*\n\n` +
                     `👉 *Join our free Telegram channel today to see live results, updates, and everything happening inside. Don't miss out on what others are already benefiting from.*`;

  // Create inline keyboard with join button
  const keyboard = {
    inline_keyboard: [[
      {
        text: '🚀 Join Now and Claim your free 100% Deposit Bonus',
        url: tradingChannelUrl
      }
    ]]
  };

  await bot.sendMessage(chatId, welcomeText, { 
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });

  // Send postback for deep link start
  if (visitorId && network === 'prop') {
    await sendPostback(visitorId, 'deep_link_start');
  }
}

// Handle basic start command (without parameters)
async function handleBasicStartCommand(message) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  
  logger.info(`Basic start command from user: ${userId}`);
  
  const welcomeText = `👋 *Welcome! You've just come across AI-powered, risk-managed trading built for long-term growth.*\n\n` +
                     `*Here's why people are joining us:*\n` +
                     `📈 Consistent 15% + monthly returns\n` +
                     `🤝 No charge until you've made £500 profit\n` +
                     `📊 Trusted by 1,000+ members already seeing results\n` +
                     `📢 Weekly updates, transparent results & 24/7 personal support line\n\n` +
                     `*This is about building steady growth.*\n\n` +
                     `👉 *Join our free Telegram channel today to see live results, updates, and everything happening inside. Don't miss out on what others are already benefiting from.*`;

  // Create inline keyboard with join button
  const keyboard = {
    inline_keyboard: [[
      {
        text: '🚀 Join Now and Claim your free 100% Deposit Bonus',
        url: tradingChannelUrl
      }
    ]]
  };
  
  await bot.sendMessage(chatId, welcomeText, { 
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
}

// Handle help command
async function handleHelpCommand(message) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  
  logger.info(`Help command from user: ${userId}`);
  
  const helpText = `🆘 *Help Center - Your Trading Success Guide!*\n\n` +
                  `🎯 *What is this bot?*\n` +
                  `This is your gateway to AI-powered, risk-managed trading built for long-term growth. We help you achieve consistent monthly returns through advanced trading strategies.\n\n` +
                  `🚀 *How does it work?*\n` +
                  `1. Join our trading community\n` +
                  `2. Access exclusive AI trading signals\n` +
                  `3. Follow our risk-managed strategies\n` +
                  `4. Build consistent monthly profits\n\n` +
                  `🎮 *Available Actions:*\n` +
                  `┌─────────────────────────────────┐\n` +
                  `│ 📝 \`register\` - Join trading community\n` +
                  `│ 🎪 \`signup\` - Create trading account\n` +
                  `│ 🤝 \`join\` - Access trading signals\n` +
                  `│ 📧 \`subscribe\` - Get market updates\n` +
                  `│ ✅ \`confirm\` - Confirm trading interest\n` +
                  `└─────────────────────────────────┘\n\n` +
                  `📊 *Your Trading Status:*\n` +
                  `• Bot Status: ✅ Active\n` +
                  `• Trading Access: ✅ Enabled\n` +
                  `• Profit Tracking: ✅ Monitored\n\n` +
                  `💰 *Why Choose Us?*\n` +
                  `• Consistent 15%+ monthly returns\n` +
                  `• No charge until you've made £500 profit\n` +
                  `• Trusted by 1,000+ members\n` +
                  `• 24/7 personal support line\n\n` +
                  `🎉 *Ready to start trading?*\n` +
                  `Just type any of the action words above and begin your journey to consistent profits!\n\n` +
                  `💡 *Pro Tip:* The more you engage, the better your trading results become!`;
  
  await bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
}

// Handle group join events
async function handleGroupJoin(message) {
  if (!message.new_chat_members) return;

  for (const member of message.new_chat_members) {
    if (member.is_bot) continue;

    const joinedUserId = member.id;
    const chatId = message.chat.id;
    const chatTitle = message.chat.title || 'Unknown Group';

    logger.info(`User ${joinedUserId} joined group: ${chatTitle} (${chatId})`);

    // Check if we have tracking data for this user
    if (clickIdMap[joinedUserId]) {
      const trackingData = clickIdMap[joinedUserId];
      logger.info(`Found tracking data for user ${joinedUserId}: ${trackingData.visitorId}`);

      // Send postback for group join
      await sendPostback(trackingData.visitorId, 'group_join');

      // Optionally notify the group with creative message
      const notificationText = `🎉 *Welcome to Our Trading Community!*\n\n` +
                              `👋 Hey ${member.first_name || 'User'}!\n\n` +
                              `🚀 *You've just joined our AI-powered trading community!*\n` +
                              `• Your trading participation is being tracked\n` +
                              `• You're now part of our exclusive profit-building network\n` +
                              `• Get ready for AI trading signals and market updates\n\n` +
                              `💰 *Your journey to consistent profits begins now!*`;
      await bot.sendMessage(chatId, notificationText, { parse_mode: 'Markdown' });
    }
  }
}

// Handle keyword matches
async function handleKeywordMatch(message) {
  const userId = message.from.id;
  const text = message.text?.toLowerCase().trim();
  
  if (!text) return;

  // Define keywords that trigger postbacks
  const triggerKeywords = ['register', 'signup', 'join', 'subscribe', 'confirm'];
  
  if (triggerKeywords.includes(text)) {
    if (clickIdMap[userId]) {
      const trackingData = clickIdMap[userId];
      logger.info(`Keyword match "${text}" for user ${userId}, visitorId: ${trackingData.visitorId}`);

      // Send postback for keyword match
      await sendPostback(trackingData.visitorId, `keyword_${text}`);

      // Confirm action to user with creative response
      const responses = {
        'register': `🎉 *Trading Community Registration Confirmed!*\n\n✨ Welcome to our exclusive AI-powered trading community! Your registration has been successfully tracked and you're now part of our elite group of profitable traders!\n\n🚀 *What's next?*\n• Access to exclusive AI trading signals\n• Weekly market analysis reports\n• 24/7 personal support line\n• Priority access to new strategies\n\n💰 *Your journey to consistent profits starts now!*`,
        'signup': `🌟 *Trading Account Created Successfully!*\n\n🎊 Congratulations! You've officially joined our AI-powered trading platform. Your account has been created and you're ready to start building consistent monthly returns!\n\n💫 *Get ready for:*\n• AI-generated trading signals\n• Risk-managed strategies\n• Transparent profit tracking\n• Weekly performance reports\n\n🎮 *Let's build your wealth together!*`,
        'join': `🎯 *Welcome to Our Trading Signals!*\n\n🔥 Fantastic! You've successfully joined our exclusive trading signal service. Your participation has been tracked and you now have access to our AI-powered trading strategies!\n\n🚀 *Your benefits:*\n• Real-time trading signals\n• Risk management guidance\n• Market analysis updates\n• Profit optimization tips\n\n🌟 *Together we achieve consistent profits!*`,
        'subscribe': `📧 *Trading Updates Subscription Active!*\n\n🎊 Excellent choice! You're now subscribed to our premium trading updates. Your subscription has been confirmed and you'll never miss out on profitable opportunities!\n\n📬 *You'll receive:*\n• Weekly market analysis\n• Trading signal alerts\n• Profit performance reports\n• Exclusive trading tips\n\n🎯 *Stay informed, stay profitable!*`,
        'confirm': `✅ *Trading Interest Confirmed!*\n\n🎉 Perfect! Your trading interest has been successfully processed and tracked. You're all set to begin your journey to consistent monthly profits!\n\n🚀 *Status Update:*\n• Trading access confirmed ✓\n• AI signals enabled ✓\n• Profit tracking active ✓\n• Ready to start trading ✓\n\n🎯 *Let's build your wealth systematically!*`
      };
      
      const responseText = responses[text] || `✅ *Action Confirmed!*\n\n🎊 Your "${text}" action has been successfully tracked and processed!\n\n🚀 *Status:* Active and monitored\n🎯 *Next:* Continue your journey\n\n✨ *The magic continues!*`;
      
      await bot.sendMessage(message.chat.id, responseText, { parse_mode: 'Markdown' });
    }
  }
}

// Handle callback queries (inline button clicks)
async function handleCallbackQuery(callbackQuery) {
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;
  const chatId = callbackQuery.message.chat.id;

  logger.info(`Callback query from user ${userId}: ${data}`);

  if (clickIdMap[userId]) {
    const trackingData = clickIdMap[userId];
    
    // Send postback for button click
    await sendPostback(trackingData.visitorId, `button_${data}`);

    // Acknowledge the callback with creative response
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: `🎉 Action "${data}" tracked successfully!`
    });

    // Send creative confirmation message
    const confirmationText = `🎯 *Button Action Confirmed!*\n\n` +
                            `✨ Your "${data}" action has been successfully tracked!\n\n` +
                            `🚀 *Status Update:*\n` +
                            `• Action: ✅ Processed\n` +
                            `• Tracking: ✅ Active\n` +
                            `• Conversion: ✅ Recorded\n\n` +
                            `🎊 *Great job! Keep the momentum going!*`;
    
    await bot.sendMessage(chatId, confirmationText, { parse_mode: 'Markdown' });
  }
}

// Main webhook handler
app.post('/webhook', async (req, res) => {
  try {
    const update = req.body;
    logger.info('Received webhook update:', JSON.stringify(update, null, 2));

    // Handle different types of updates
    if (update.message) {
      const message = update.message;
      
      // Handle start command with deep link
      if (message.text && message.text.startsWith('/start ')) {
        await handleStartCommand(message);
      }
      
      // Handle basic start command (without parameters)
      if (message.text === '/start') {
        await handleBasicStartCommand(message);
      }
      
      // Handle help command
      if (message.text === '/help') {
        await handleHelpCommand(message);
      }
      
      // Handle group join events
      if (message.new_chat_members) {
        await handleGroupJoin(message);
      }
      
      // Handle keyword matches
      await handleKeywordMatch(message);
    }
    
    // Handle callback queries (inline button clicks)
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mappings: Object.keys(clickIdMap).length
  });
});

// Set webhook endpoint
app.post('/set-webhook', async (req, res) => {
  try {
    if (!webhookUrl) {
      return res.status(400).json({ error: 'WEBHOOK_URL not configured' });
    }

    const result = await bot.setWebHook(`${webhookUrl}/webhook`);
    logger.info('Webhook set successfully:', result);
    res.json({ success: true, result });
  } catch (error) {
    logger.error('Error setting webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get webhook info endpoint
app.get('/webhook-info', async (req, res) => {
  try {
    const info = await bot.getWebHookInfo();
    res.json(info);
  } catch (error) {
    logger.error('Error getting webhook info:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(port, () => {
  logger.info(`Telegram bot server running on port ${port}`);
  logger.info(`Webhook endpoint: ${webhookUrl || 'Not configured'}/webhook`);
  logger.info(`Health check: http://localhost:${port}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  saveClickIdMap();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down gracefully...');
  saveClickIdMap();
  process.exit(0);
});


