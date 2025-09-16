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
  const welcomeText = `🚀 *Welcome to the Future of Tracking!*\n\n` +
                     `🎯 *You've successfully connected to our advanced conversion tracking system!*\n\n` +
                     `📈 *Your Tracking Details:*\n` +
                     `┌─────────────────────────────────┐\n` +
                     `│ 🆔 Click ID: \`${visitorId || 'N/A'}\`\n` +
                     `│ 🎪 Campaign: \`${campaignId || 'N/A'}\`\n` +
                     `│ 🌐 Zone: \`${zoneId || 'N/A'}\`\n` +
                     `│ 🔗 Network: \`${network || 'N/A'}\`\n` +
                     `└─────────────────────────────────┘\n\n` +
                     `✨ *What happens next?*\n` +
                     `• Your interactions are being tracked\n` +
                     `• Conversions will be automatically reported\n` +
                     `• You'll receive updates on your journey\n\n` +
                     `🎮 *Try these commands:*\n` +
                     `• Type \`register\` to confirm your interest\n` +
                     `• Type \`join\` to participate in our community\n` +
                     `• Type \`subscribe\` for exclusive updates\n\n` +
                     `🔮 *The magic is happening behind the scenes!*`;

  await bot.sendMessage(chatId, welcomeText, { parse_mode: 'Markdown' });

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
  
  const welcomeText = `🎉 *Welcome to Our Tracking Bot!*\n\n` +
                     `🚀 *You've connected to our advanced conversion tracking system!*\n\n` +
                     `✨ *What can I do for you?*\n` +
                     `• Track your interactions and conversions\n` +
                     `• Provide real-time status updates\n` +
                     `• Connect you with exclusive offers\n\n` +
                     `🎮 *Available Commands:*\n` +
                     `• Type \`register\` - Join our community\n` +
                     `• Type \`signup\` - Create your account\n` +
                     `• Type \`join\` - Participate in activities\n` +
                     `• Type \`subscribe\` - Get updates\n` +
                     `• Type \`confirm\` - Confirm your action\n\n` +
                     `📊 *Your Status:* Ready to track!\n\n` +
                     `🔮 *The magic happens when you interact!*`;
  
  await bot.sendMessage(chatId, welcomeText, { parse_mode: 'Markdown' });
}

// Handle help command
async function handleHelpCommand(message) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  
  logger.info(`Help command from user: ${userId}`);
  
  const helpText = `🆘 *Help Center - Your Guide to Success!*\n\n` +
                  `🎯 *What is this bot?*\n` +
                  `This is an advanced conversion tracking bot that monitors your interactions and automatically reports conversions to our advertising partners.\n\n` +
                  `🚀 *How does it work?*\n` +
                  `1. You interact with our bot\n` +
                  `2. Your actions are tracked automatically\n` +
                  `3. Conversions are reported in real-time\n` +
                  `4. You get exclusive benefits and updates\n\n` +
                  `🎮 *Available Actions:*\n` +
                  `┌─────────────────────────────────┐\n` +
                  `│ 📝 \`register\` - Join community\n` +
                  `│ 🎪 \`signup\` - Create account\n` +
                  `│ 🤝 \`join\` - Participate\n` +
                  `│ 📧 \`subscribe\` - Get updates\n` +
                  `│ ✅ \`confirm\` - Confirm action\n` +
                  `└─────────────────────────────────┘\n\n` +
                  `📊 *Your Tracking Status:*\n` +
                  `• Bot Status: ✅ Active\n` +
                  `• Tracking: ✅ Enabled\n` +
                  `• Conversions: ✅ Monitored\n\n` +
                  `🎉 *Ready to get started?*\n` +
                  `Just type any of the action words above and watch the magic happen!\n\n` +
                  `💡 *Pro Tip:* The more you interact, the better your experience becomes!`;
  
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
      const notificationText = `🎉 *Welcome to the Community!*\n\n` +
                              `👋 Hey ${member.first_name || 'User'}!\n\n` +
                              `🚀 *You've just joined something amazing!*\n` +
                              `• Your participation is being tracked\n` +
                              `• You're now part of our exclusive network\n` +
                              `• Get ready for special updates and offers\n\n` +
                              `✨ *The adventure begins now!*`;
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
        'register': `🎉 *Registration Confirmed!*\n\n✨ Welcome to our exclusive community! Your registration has been successfully tracked and you're now part of something amazing!\n\n🚀 *What's next?*\n• You'll receive exclusive updates\n• Access to special offers\n• Priority support\n\n🎯 *Your journey starts now!*`,
        'signup': `🌟 *Signup Successful!*\n\n🎊 Congratulations! You've officially joined our platform. Your signup has been recorded and you're ready to explore all the amazing features we have to offer!\n\n💫 *Get ready for:*\n• Personalized experiences\n• Exclusive content\n• Special rewards\n\n🎮 *Let's make magic happen!*`,
        'join': `🎯 *Welcome to the Team!*\n\n🔥 Fantastic! You've successfully joined our community. Your participation has been tracked and you're now connected to like-minded individuals!\n\n🚀 *Your benefits:*\n• Community access\n• Networking opportunities\n• Shared experiences\n\n🌟 *Together we're stronger!*`,
        'subscribe': `📧 *Subscription Active!*\n\n🎊 Excellent choice! You're now subscribed to our premium updates. Your subscription has been confirmed and you'll never miss out on important news!\n\n📬 *You'll receive:*\n• Weekly newsletters\n• Exclusive announcements\n• Special offers\n\n🎯 *Stay connected, stay informed!*`,
        'confirm': `✅ *Confirmation Received!*\n\n🎉 Perfect! Your confirmation has been successfully processed and tracked. You're all set to proceed with your journey!\n\n🚀 *Status Update:*\n• Action confirmed ✓\n• Tracking active ✓\n• Ready to proceed ✓\n\n🎯 *Let's keep moving forward!*`
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


