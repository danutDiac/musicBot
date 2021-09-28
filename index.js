const Discord = require('discord.js')
const client = new Discord.Client()
const { interpretMessage } = require('./commands');
const { bot_secret_token } = require('./config.json')

client.on('ready', () => {
    console.log("Connected as " + client.user.tag)
    client.guilds.cache.forEach((guild) => {
        console.log(" - " + guild.name)
    })
})

client.on('message', interpretMessage)

client.login(bot_secret_token)
