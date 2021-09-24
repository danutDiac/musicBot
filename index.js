const Discord = require('discord.js')
const client = new Discord.Client()
const ytdl = require('ytdl-core');

// let mpv = require('node-mpv');
// let mpvPlayer = new mpv({
//     audio_only: true,
//     debug: true,
//     socket: '/tmp/node-mpv.sock',
//     ipcCommand: '--input-unix-socket'
// });

client.on('ready', () => {
    console.log("Connected as " + client.user.tag)
    client.guilds.cache.forEach((guild) => {
        console.log(" - " + guild.name)
    })
})

client.on('message', async (message) => {
    console.log('conent found', message.content)
    if (!message.guild) return;

    if (message.content === '/join') {
        // Only try to join the sender's voice channel if they are in one themselves
        if (message.member.voice.channel) {
            const connection = await message.member.voice.channel.join();
        } else {
            message.reply('You need to join a voice channel first!');
        }
    }

    if (message.content.includes('/play')) {
        try {
            const connection = await message.member.voice.channel.join();
            const playUrl = message.content.split(' ')[1]
            console.log(`Loading ${playUrl}...`, )
            connection.play(ytdl(playUrl), { // 'poc-vorbaLunga.m4a'
                volume: 0.3,
            });
            // mpvPlayer.volume(20)
            // connection.play(mpvPlayer.loadFile(playUrl))
        } catch (err) {
            console.log(`Didn't work: ${err}`)
        }
    }
})


bot_secret_token = "NzYwNzYwNDIyNTMzMDM4MDkx.X3QvWg.7S9IKKPLm27k9yfuQhUSDO1j6GE"

client.login(bot_secret_token)
