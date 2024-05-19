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

const roomBot = new Bot( process.env.JOIN_ROOM )
await roomBot.connect( userFunctions )
roomBot.configureListeners( userFunctions, databaseFunctions )
const repeatedTasks = new Chain()
repeatedTasks
  .add( () => roomBot.processNewMessages() )
  .every( 500 )
  .add( () => roomBot.checkIfConnected() )
  .every( 5 * 1000 )
