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
  const welcomeText = `🎉 Welcome! Thanks for joining our bot.\n\n` +
                     `📊 Tracking Info:\n` +
                     `• Click ID: ${visitorId || 'N/A'}\n` +
                     `• Campaign: ${campaignId || 'N/A'}\n` +
                     `• Zone: ${zoneId || 'N/A'}\n` +
                     `• Network: ${network || 'N/A'}\n\n` +
                     `Type /help for available commands.`;

  await bot.sendMessage(chatId, welcomeText);

  // Send postback for deep link start
  if (visitorId && network === 'prop') {
    await sendPostback(visitorId, 'deep_link_start');
  }
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

      // Optionally notify the group
      const notificationText = `👋 Welcome ${member.first_name || 'User'}! ` +
                              `Your interaction is being tracked.`;
      await bot.sendMessage(chatId, notificationText);
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

      // Confirm action to user
      const responseText = `✅ Action "${text}" confirmed and tracked!`;
      await bot.sendMessage(message.chat.id, responseText);
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

    // Acknowledge the callback
    await bot.answerCallbackQuery(callbackQuery.id, {
      text: `Action "${data}" tracked successfully!`
    });

    // Update the message or send confirmation
    await bot.sendMessage(chatId, `✅ Button action "${data}" has been tracked!`);
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


