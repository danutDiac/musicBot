function variables() {
  try {
    const { bot_secret_token, server_id, application_id } = require('./config.json')
    return {
      bot_secret_token,
      server_id,
      application_id
    }
  } catch(err) {
    console.log('config file not found, using env vars')
    return {
      bot_secret_token: process.env.bot_secret_token,
      server_id: process.env.server_id,
      application_id: process.env.application_id
    }
  }
}

module.exports = {
  variables: variables()
}