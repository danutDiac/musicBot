const  { Client, Intents } = require('discord.js')
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES] })
const { interpretMessage } = require('./commands');
const {variables: {bot_secret_token}} = require('./init')

client.on('ready', () => {
    console.log(`Connected as ${client.user.tag} (${client.user.id})`)
    client.guilds.cache.forEach((guild) => {
        console.log(`Guild: ${guild.name} (${guild.id})`)
    })
})

client.on('message', interpretMessage)

client.login(bot_secret_token)
