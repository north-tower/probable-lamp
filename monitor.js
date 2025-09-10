#!/usr/bin/env node

/**
 * Simple monitoring dashboard for Telegram Postback Tracker Bot
 * Run this to see real-time statistics and status
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const CONFIG = require('./config');
const STORAGE_FILE = CONFIG.tracking.storage.file;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader() {
  console.clear();
  console.log(colorize('╔══════════════════════════════════════════════════════════════╗', 'cyan'));
  console.log(colorize('║                TELEGRAM POSTBACK TRACKER BOT                ║', 'cyan'));
  console.log(colorize('║                        MONITORING DASHBOARD                 ║', 'cyan'));
  console.log(colorize('╚══════════════════════════════════════════════════════════════╝', 'cyan'));
  console.log();
}

function printStats() {
  console.log(colorize('📊 BOT STATISTICS', 'bright'));
  console.log('══════════════════════════════════════════════════════════════');
  
  // Load tracking data
  let trackingData = {};
  let totalEntries = 0;
  let recentEntries = 0;
  
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      trackingData = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
      totalEntries = Object.keys(trackingData).length;
      
      // Count recent entries (last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      recentEntries = Object.values(trackingData).filter(entry => 
        new Date(entry.timestamp) > oneDayAgo
      ).length;
    }
  } catch (error) {
    console.log(colorize('❌ Error loading tracking data', 'red'));
  }
  
  console.log(`Total Tracking Entries: ${colorize(totalEntries.toString(), 'green')}`);
  console.log(`Recent Entries (24h): ${colorize(recentEntries.toString(), 'yellow')}`);
  console.log(`Storage File: ${colorize(STORAGE_FILE, 'blue')}`);
  console.log();
  
  // Network breakdown
  if (totalEntries > 0) {
    console.log(colorize('🌐 NETWORK BREAKDOWN', 'bright'));
    console.log('══════════════════════════════════════════════════════════════');
    
    const networkStats = {};
    Object.values(trackingData).forEach(entry => {
      const network = entry.network || 'unknown';
      networkStats[network] = (networkStats[network] || 0) + 1;
    });
    
    Object.entries(networkStats).forEach(([network, count]) => {
      const percentage = ((count / totalEntries) * 100).toFixed(1);
      console.log(`${network.toUpperCase()}: ${colorize(count.toString(), 'green')} (${percentage}%)`);
    });
    console.log();
  }
}

function printConfiguration() {
  console.log(colorize('⚙️  CONFIGURATION', 'bright'));
  console.log('══════════════════════════════════════════════════════════════');
  
  console.log(`Bot Name: ${colorize(CONFIG.bot.name, 'green')}`);
  console.log(`Bot Username: ${colorize(CONFIG.bot.username, 'green')}`);
  console.log(`Server Port: ${colorize(CONFIG.server.port.toString(), 'yellow')}`);
  console.log(`Webhook Path: ${colorize(CONFIG.server.webhookPath, 'blue')}`);
  console.log(`Trigger Keywords: ${colorize(CONFIG.tracking.triggerKeywords.length.toString(), 'cyan')}`);
  console.log();
  
  console.log(colorize('🔑 TRIGGER KEYWORDS', 'bright'));
  console.log('══════════════════════════════════════════════════════════════');
  CONFIG.tracking.triggerKeywords.forEach((keyword, index) => {
    const color = index % 2 === 0 ? 'green' : 'yellow';
    process.stdout.write(`${colorize(keyword, color)}  `);
    if ((index + 1) % 5 === 0) console.log();
  });
  console.log('\n');
}

async function checkHealth() {
  console.log(colorize('🏥 HEALTH CHECK', 'bright'));
  console.log('══════════════════════════════════════════════════════════════');
  
  try {
    const response = await axios.get(`http://localhost:${CONFIG.server.port}/health`, {
      timeout: 5000
    });
    
    if (response.status === 200) {
      const data = response.data;
      console.log(`Status: ${colorize('ONLINE', 'green')}`);
      console.log(`Timestamp: ${colorize(data.timestamp, 'blue')}`);
      console.log(`Active Mappings: ${colorize(data.mappings.toString(), 'yellow')}`);
      console.log(`Response Time: ${colorize('Good', 'green')}`);
    } else {
      console.log(`Status: ${colorize('ERROR', 'red')}`);
      console.log(`HTTP Status: ${colorize(response.status.toString(), 'red')}`);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(`Status: ${colorize('OFFLINE', 'red')}`);
      console.log(`Error: ${colorize('Connection refused - Bot not running', 'red')}`);
    } else if (error.code === 'ENOTFOUND') {
      console.log(`Status: ${colorize('ERROR', 'red')}`);
      console.log(`Error: ${colorize('Cannot resolve localhost', 'red')}`);
    } else {
      console.log(`Status: ${colorize('ERROR', 'red')}`);
      console.log(`Error: ${colorize(error.message, 'red')}`);
    }
  }
  console.log();
}

function printRecentActivity() {
  console.log(colorize('📱 RECENT ACTIVITY', 'bright'));
  console.log('══════════════════════════════════════════════════════════════');
  
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const trackingData = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf8'));
      const entries = Object.entries(trackingData);
      
      if (entries.length === 0) {
        console.log('No tracking data available');
      } else {
        // Sort by timestamp (newest first)
        const sortedEntries = entries.sort((a, b) => 
          new Date(b[1].timestamp) - new Date(a[1].timestamp)
        );
        
        // Show last 5 entries
        const recentEntries = sortedEntries.slice(0, 5);
        
        recentEntries.forEach(([userId, data], index) => {
          const timeAgo = getTimeAgo(new Date(data.timestamp));
          const network = data.network || 'unknown';
          
          console.log(`${index + 1}. User ${colorize(userId, 'green')} - ${colorize(network.toUpperCase(), 'yellow')}`);
          console.log(`   Click ID: ${colorize(data.visitorId, 'blue')}`);
          console.log(`   Campaign: ${colorize(data.campaignId || 'N/A', 'cyan')}`);
          console.log(`   Time: ${colorize(timeAgo, 'magenta')}`);
          console.log();
        });
      }
    } else {
      console.log('No tracking data file found');
    }
  } catch (error) {
    console.log(`Error reading activity: ${colorize(error.message, 'red')}`);
  }
}

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }
}

function printFooter() {
  console.log(colorize('══════════════════════════════════════════════════════════════', 'cyan'));
  console.log(colorize('Press Ctrl+C to exit | Auto-refresh every 30 seconds', 'bright'));
  console.log(colorize('══════════════════════════════════════════════════════════════', 'cyan'));
}

async function main() {
  try {
    printHeader();
    printStats();
    printConfiguration();
    await checkHealth();
    printRecentActivity();
    printFooter();
  } catch (error) {
    console.error('Error in monitoring:', error.message);
  }
}

// Auto-refresh every 30 seconds
if (require.main === module) {
  main();
  
  setInterval(() => {
    main();
  }, 30000);
}

module.exports = { main };


