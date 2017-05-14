console.log(`Running in ${process.env.NODE_ENV} environment`)

// this configuration file allows you to use a different bot for development
// and testing. 

const environment = process.env.NODE_ENV;  // 'development' or 'production'

const telegram_bot_token = {
  'production': 'TELEGRAM_PRODUCTION_TOKEN',
  'development': 'TELEGRAM_DEVELOPMENT_TOKEN'
}

module.exports = {
  'bot_token': telegram_bot_token[environment]
}

