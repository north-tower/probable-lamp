module.exports = {
  // Bot configuration
  bot: {
    name: 'Postback Tracker Bot',
    username: 'postback_tracker_bot', // Change this to your bot's username
    commands: {
      start: '/start',
      help: '/help',
      status: '/status'
    }
  },

  // PropellerAds configuration
  propellerAds: {
    // These will be overridden by environment variables
    aid: process.env.PROPELLERADS_AID || 'YOUR_AID',
    tid: process.env.PROPELLERADS_TID || 'YOUR_TID',
    postbackUrl: process.env.PROPELLERADS_POSTBACK_URL || 'http://ad.propellerads.com/conversion.php',
    
    // Postback parameters
    postbackParams: {
      aid: 'aid',
      pid: 'pid',
      tid: 'tid',
      visitor_id: 'visitor_id'
    }
  },

  // Tracking configuration
  tracking: {
    // Keywords that trigger postbacks
    triggerKeywords: [
      'register',
      'signup', 
      'join',
      'subscribe',
      'confirm',
      'buy',
      'purchase',
      'download',
      'install'
    ],
    
    // Events that can trigger postbacks
    events: {
      deep_link_start: 'User started bot via deep link',
      group_join: 'User joined a group',
      keyword_match: 'User typed a trigger keyword',
      button_click: 'User clicked an inline button',
      message_sent: 'User sent any message',
      conversion: 'General conversion event'
    },
    
    // Storage configuration
    storage: {
      file: 'subid_map.json',
      backupInterval: 5 * 60 * 1000, // 5 minutes
      maxEntries: 10000 // Maximum number of tracking entries
    }
  },

  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    webhookPath: '/webhook',
    healthPath: '/health'
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    files: {
      error: 'error.log',
      combined: 'combined.log',
      access: 'access.log'
    },
    maxSize: '10m',
    maxFiles: 5
  },

  // Security configuration
  security: {
    // Rate limiting
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    },
    
    // Webhook validation (optional)
    validateWebhook: false,
    webhookSecret: process.env.WEBHOOK_SECRET || null
  },

  // Development configuration
  development: {
    debug: process.env.NODE_ENV === 'development',
    mockPropellerAds: false,
    logWebhooks: true
  }
};


