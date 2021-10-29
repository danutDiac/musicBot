const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const {variables: { application_id }} = require('./init')

const MAX_LIST_LEGTH = 13
const IDLE_WAIT_TIME = 1000 * 60 * 5
const defaultStoreValues = {
  items: [],
  connection: null,
  message: null,
  channel: null,
  lastSongMessage: null,
  idleTrigger: null,
}
let globalStore = defaultStoreValues

const COMANDS = [{
    name: 'hai',
    description: 'Vin unde ești tu.',
    exec: joinChannel,
    reply: 'Gata, zi-mi.'
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
    exec: playNext,
    reply: 'Ia-o pe asta, poate-i mai bună.'
  },
  {
    name: 'listează',
    description: `Ițî arăt următoarele ${MAX_LIST_LEGTH} melodii din listă.`,
    exec: listCurrentSongs,
    reply: 'Cam astea-s. Mai pot să le mix puțin. Scrie "zăpăcește-le" și se face.',
    replyCondition: globalStore.items > 0,
  },
  {
    name: 'zăpăceste-le',
    description: `Le tulbur puțin. O să iasă în altă ordine.`,
    exec: shuffleSongs,
    reply: 'Gata, le-am zăpăcit de le-a luat .. sunt în alta ordine acum.'
  },
  {
    name: 'pleacă',
    description: 'Plec',
    exec: disconnect,
    reply: 'Hai pa.'
  },
  {
    name: 'restart',
    description: 'O iau de la zero: fără melodii, fără canal de voce, nimic în memorie, doar comenzile le mai știu.',
    exec: reset,
    reply: 'Gata, mi-am revenit. Dă o comandă să vedem.'
  },
  {
    name: 'comenzi',
    description: 'Îți zic ce știu sa fac. Cu subiect si predicat.',
    exec: listCommands
  },
  {
    name: 'test',
    description: 'Secret. Doar developerii știu ce face asta. Sau nici ei.',
    exec: test
  },
]

async function updateGlobalStore(message) {
  if (message.member.voice.channel) {
    globalStore.channel = await message.member.voice.channel
  } else {
      return message.reply('Trebuie să fii intr-un canal sonor ca să folosesti comenzile!');
  }
  globalStore.message = message
}

async function interpretMessage(message) {
  if (!message.guild) return;
  if (message.member.id === application_id) return

  COMANDS.forEach(async function (command) {
    if (message.content.indexOf(command.name) > -1 && message.content.indexOf(command.name) < 2 ) {
      await updateGlobalStore(message)
      await command.exec()

      if (command.reply && command.replyCondition) {
        message.channel.send(command.reply)
      }
    }  
  })
}

async function joinChannel() {
  if (!globalStore.connection) {
    globalStore.connection = await globalStore.channel.join()
  }
}

async function playNext() {
  if (globalStore.items.length > 0) {
    return recurrentPlayItems()
  }

  globalStore.idleTrigger = setTimeout(graceouslyLeaveChannel, IDLE_WAIT_TIME)
  return globalStore.message.channel.send('S-au terminat melodiile. Mai ai altceva?')
}

async function test() {
  return globalStore.message.channel.send('Nu se testează nimic acum.')
}

async function graceouslyLeaveChannel() {
  await globalStore.message.channel.send('Pare ca nu mai e nevoie de mine. Vă urez ok. Pa')
  await globalStore.channel.leave()
  reset()
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
  if (globalStore.items.length === 0) {
    return globalStore.message.reply('Nu mai sunt melodii de cântat. Propune tu ceva')
  }

  const shortList = globalStore.items.slice(0, MAX_LIST_LEGTH)
  const songs = shortList.map(song => song.title)
  await globalStore.message.reply(`Iată ce va urma:\n${songs.join('\n')}`)
}

async function playPlaylist({playlistUrl}) {
  try {
      let list = await ytpl(playlistUrl, { pages: 1 });

      console.log(list.items.map(item => `${item.title} ${item.url}`))
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

  resetIdleTimeout()

  const nextSong = globalStore.items[0]
  const songURL = nextSong.url.replace(/&list.*/, '')

  const filterOptions = {
    opusEncoded: true,
    encoderArgs: ["-af", "bass=g=10,dynaudnorm=f=200"],
    filter: "audioonly",
    quality: "highestaudio",
    isHLS: true,
  }

  const dispatcher = await globalStore.connection.play(ytdl(songURL, filterOptions), {
      volume: 0.5,
  });
  
  await writeSongDetails(nextSong.title)
  globalStore.items.splice(0, 1)
  
  dispatcher.on('finish', playNext);

  dispatcher.on('error', (err) => console.log('There was an error: ', err) || playNext());
}

function resetIdleTimeout() {
  if (globalStore.idleTrigger) {
    clearTimeout(globalStore.idleTrigger)
    globalStore.idleTrigger = null
  }
}

async function writeSongDetails(details) {
  if (globalStore.lastSongMessage) {
    await globalStore.lastSongMessage.delete()
  }
  
  globalStore.lastSongMessage = await globalStore.message.channel.send(`Se cantă ${details}`)
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

async function reset() {
  try {
    await disconnect()
  } catch (err) {
    console.log('Did not disconnect, err: ', err)
  }

  globalStore = defaultStoreValues
}

async function listCommands() {
  let commandsList = 'Iată ce-mi poate mintea... adică, codul:'
  COMANDS.forEach(command => {
    commandsList = `${commandsList}\n\`${command.name}\` : ${command.description}`
  })
  globalStore.message.channel.send(commandsList)
}

module.exports = {
  interpretMessage
}