const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const {variables: { application_id, server_id, bot_secret_token }} = require('./init')

const MAX_LIST_LEGTH = 13
const globalStore = {
  items: [],
  connection: null,
  message: null,
  channel: null
}


const COMANDS = [{
    name: 'hai',
    description: 'Vin unde ești tu.',
    exec: joinChannel
  },
  {
    name: 'cântă',
    description: 'Voi cânta ceva, cum știu eu.',
    exec: play
  },
  {
    name: 'canta',
    description: 'Tot cânt, dar fără diacritice',
    exec: play
  },
  {
    name: 'alta',
    description: 'Opresc cântarea curentă, pentru una mai bună.',
    exec: playNext
  },
  {
    name: 'listează',
    description: `Ițî arăt următoarele ${MAX_LIST_LEGTH} melodii din listă.`,
    exec: listCurrentSongs
  },
  {
    name: 'zăpăceste-le',
    description: `Le tulbur puțin. O să iasă în altă ordine.`,
    exec: shuffleSongs
  },
  {
    name: 'pleacă',
    description: 'Plec',
    exec: disconnect
  },
]

async function updateGlobalStore(message) {
  if (message.member.voice.channel) {
    globalStore.channel = await message.member.voice.channel
  } else {
      return message.reply('You need to join a voice channel to use this bot!');
  }
  globalStore.message = message
}

async function interpretMessage(message) {
  if (!message.guild) return;

  COMANDS.forEach(async function (command) {
    if (message.content.indexOf(command.name) > -1 && message.content.indexOf(command.name) < 2 ) {
      await updateGlobalStore(message)
      await command.exec()
    }  
  })
}

async function joinChannel() {
  if (!globalStore.connection) {
    globalStore.connection = await globalStore.channel.join()
  }
}

async function playNext() {
  globalStore.items.splice(0, 1)
  await recurrentPlayItems()
}

async function play() {
  try {
      await joinChannel()
      const playUrl = globalStore.message.content.split(' ')[1]
      console.log(`Loading ${playUrl}...`, )

      await playPlaylist({playlistUrl: playUrl})
      listCurrentSongs()
  } catch (err) {
      console.log(`Didn't work: ${err}`)
  }
}

async function listCurrentSongs() {
  const songs = globalStore.items.slice(0, MAX_LIST_LEGTH).map(song => song.title)
  await globalStore.message.reply(songs.join('\n'))
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
  globalStore.items.splice(0, 1)
  
  dispatcher.on('finish', async () => {
      if (globalStore.items.length > 0) {
          return recurrentPlayItems()
      }

      globalStore.connection.leave()
  });
}

async function disconnect() {
  return globalStore.channel.leave()
}

function shuffleSongs() {
  shuffle(globalStore.items)
}

function shuffle(array) {
  let currentIndex = array.length,  randomIndex;

  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}


module.exports = {
  interpretMessage
}