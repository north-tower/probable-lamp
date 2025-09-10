#!/usr/bin/env node

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const botToken = process.env.TELEGRAM_BOT_TOKEN;

if (!botToken) {
  console.log('❌ TELEGRAM_BOT_TOKEN not found');
  process.exit(1);
}

console.log('🔍 Testing bot methods...\n');

try {
  const bot = new TelegramBot(botToken, { polling: false });
  
  console.log('✅ Bot initialized successfully');
  console.log('\n📋 Available methods:');
  
  // Check for webhook methods
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(bot));
  const webhookMethods = methods.filter(method => method.toLowerCase().includes('webhook'));
  
  console.log('Webhook-related methods:');
  webhookMethods.forEach(method => {
    console.log(`  - ${method}`);
  });
  
  console.log('\nAll methods containing "webhook":');
  methods.forEach(method => {
    if (method.toLowerCase().includes('webhook')) {
      console.log(`  ✅ ${method}`);
    }
  });
  
  // Test specific methods
  console.log('\n🧪 Testing specific methods:');
  
  if (typeof bot.setWebhook === 'function') {
    console.log('✅ setWebhook is available');
  } else {
    console.log('❌ setWebhook is NOT available');
  }
  
  if (typeof bot.getWebhookInfo === 'function') {
    console.log('✅ getWebhookInfo is available');
  } else {
    console.log('❌ getWebhookInfo is NOT available');
  }
  
  if (typeof bot.setWebHook === 'function') {
    console.log('✅ setWebHook is available');
  } else {
    console.log('❌ setWebHook is NOT available');
  }
  
  if (typeof bot.getWebHookInfo === 'function') {
    console.log('✅ getWebHookInfo is available');
  } else {
    console.log('❌ getWebHookInfo is NOT available');
  }
  
} catch (error) {
  console.log('❌ Error:', error.message);
}


