const Discord = require('discord.js')
const client = new Discord.Client()
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');

const MAX_LIST_LEGTH = 13
const globalStore = {
    items: [],
    connection: null
}

client.on('ready', () => {
    console.log("Connected as " + client.user.tag)
    client.guilds.cache.forEach((guild) => {
        console.log(" - " + guild.name)
    })
})

client.on('message', async (message) => {
    console.log('conent found', message.content)
    if (!message.guild) return;

    let channel
    if (message.member.voice.channel) {
        channel = await message.member.voice.channel
    } else {
        return message.reply('You need to join a voice channel to use this bot!');
    }

    if (message.content === '/join') {
        await joinChannel()
    }

    if (message.content.includes('/play')) {
        try {
            await joinChannel()
            const playUrl = message.content.split(' ')[1]
            console.log(`Loading ${playUrl}...`, )

            await playPlaylist({playlistUrl: playUrl})
            listCurrentSongs({message})
        } catch (err) {
            console.log(`Didn't work: ${err}`)
        }
    }

    if (message.content.includes('/next')) {
        globalStore.items.splice(0, 1)
        await recurrentPlayItems()
    }

    if (message.content.includes('/list')) {
        listCurrentSongs({message})
    }

    async function joinChannel() {
        if (!globalStore.connection) {
           globalStore.connection = await channel.join()
        }
    }
})

function listCurrentSongs({ message }) {
    const songs = globalStore.items.slice(0, MAX_LIST_LEGTH).map(song => song.title)
    message.reply(songs.join('\n'))
}

async function playPlaylist({playlistUrl}) {
    try {
        let list = await ytpl(playlistUrl, { pages: 100 });

        console.log(`Loaded ${list.items.length} items`)
        globalStore.items = list.items
        await recurrentPlayItems()
    } catch(err) {
        console.log('Paylist error: ', err)
    }
}

async function recurrentPlayItems() {
    if (globalStore.items.length === 0) {
        console.log('There are no songs in the list')
        return
    }

    const dispatcher = await globalStore.connection.play(ytdl(globalStore.items[0].url), {
        volume: 0.5,
    });
    dispatcher.on('finish', async () => {
        if (globalStore.items.length > 1) {
            globalStore.items.splice(0, 1)
            await recurrentPlayItems()
        }
    });

}


bot_secret_token = "NzYwNzYwNDIyNTMzMDM4MDkx.X3QvWg.7S9IKKPLm27k9yfuQhUSDO1j6GE"

client.login(bot_secret_token)
