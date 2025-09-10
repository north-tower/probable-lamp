#!/usr/bin/env node

/**
 * Test script to verify Telegram bot token
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const botToken = process.env.TELEGRAM_BOT_TOKEN;

console.log('🔍 Testing Telegram Bot Token...\n');

if (!botToken) {
  console.log('❌ TELEGRAM_BOT_TOKEN not found in environment variables');
  console.log('Please check your .env file');
  process.exit(1);
}

console.log(`✅ Bot token found: ${botToken.substring(0, 10)}...`);

try {
  // Initialize bot
  const bot = new TelegramBot(botToken, { polling: false });
  
  console.log('✅ Bot initialized successfully');
  
  // Test bot methods
  if (typeof bot.setWebhook === 'function') {
    console.log('✅ setWebhook method is available');
  } else {
    console.log('❌ setWebhook method is NOT available');
  }
  
  if (typeof bot.getWebhookInfo === 'function') {
    console.log('✅ getWebhookInfo method is available');
  } else {
    console.log('❌ getWebhookInfo method is NOT available');
  }
  
  // Test getting bot info
  bot.getMe().then((info) => {
    console.log('✅ Bot info retrieved successfully:');
    console.log(`   Name: ${info.first_name}`);
    console.log(`   Username: @${info.username}`);
    console.log(`   ID: ${info.id}`);
    console.log('\n🎉 Bot token is working correctly!');
  }).catch((error) => {
    console.log('❌ Error getting bot info:', error.message);
    console.log('Please check your bot token');
  });
  
} catch (error) {
  console.log('❌ Error initializing bot:', error.message);
  console.log('Please check your bot token format');
}



