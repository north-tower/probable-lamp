#!/usr/bin/env node

console.log('🚀 Starting simple test...');

// Test 1: Check if dotenv works
try {
  require('dotenv').config();
  console.log('✅ dotenv loaded successfully');
} catch (error) {
  console.log('❌ dotenv error:', error.message);
}

// Test 2: Check environment variables
const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (botToken) {
  console.log('✅ TELEGRAM_BOT_TOKEN found:', botToken.substring(0, 10) + '...');
} else {
  console.log('❌ TELEGRAM_BOT_TOKEN not found');
}

// Test 3: Check if TelegramBot can be imported
try {
  const TelegramBot = require('node-telegram-bot-api');
  console.log('✅ TelegramBot imported successfully');
  
  if (botToken) {
    const bot = new TelegramBot(botToken, { polling: false });
    console.log('✅ Bot initialized successfully');
    
    // Test a simple method
    bot.getMe().then((info) => {
      console.log('✅ Bot info:', info.first_name, '@' + info.username);
    }).catch((error) => {
      console.log('❌ Error getting bot info:', error.message);
    });
  }
} catch (error) {
  console.log('❌ TelegramBot import error:', error.message);
}

// Test 4: Check if Express works
try {
  const express = require('express');
  console.log('✅ Express imported successfully');
} catch (error) {
  console.log('❌ Express import error:', error.message);
}

console.log('🏁 Test completed');