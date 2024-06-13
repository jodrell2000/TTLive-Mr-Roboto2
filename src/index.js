import { Chain } from 'repeat'
import { Bot } from './libs/bot.js'

import commandFunctions from './libs/commandsFunctions.js'
import userFunctions from './libs/userFunctions.js'
import roomFunctions from './libs/roomFunctions.js'
import songFunctions from './libs/songFunctions.js'
import chatFunctions from './libs/chatFunctions.js'
import videoFunctions from './libs/videoFunctions.js'
import documentationFunctions from './libs/documentationFunctions.js'
import databaseFunctions from './libs/databaseFunctions.js'
import dateFunctions from './libs/dateFunctions.js'
import botFunctions from './libs/botFunctions.js'

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Recommended: send the information to a logging service or write to a log file
});

const roomBot = new Bot( process.env.JOIN_ROOM )
await roomBot.connect( roomFunctions, userFunctions, chatFunctions, songFunctions, botFunctions, databaseFunctions )
roomBot.configureListeners( commandFunctions, userFunctions, videoFunctions, botFunctions, chatFunctions, roomFunctions, songFunctions, databaseFunctions, documentationFunctions, dateFunctions )
const repeatedTasks = new Chain()
repeatedTasks
  .add( () => roomBot.processNewMessages( commandFunctions, userFunctions, videoFunctions, botFunctions, chatFunctions, roomFunctions, songFunctions, databaseFunctions, documentationFunctions, dateFunctions ) )
  .every( 100 )
