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
import mlFunctions from './libs/mlFunctions.js'

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Recommended: send the information to a logging service or write to a log file
});

const commandFunctionsInstance = commandFunctions()
const userFunctionsInstance = userFunctions()
const roomFunctionsInstance = roomFunctions()
const songFunctionsInstance = songFunctions()
const chatFunctionsInstance = chatFunctions()
const videoFunctionsInstance = videoFunctions()
const documentationFunctionsInstance = documentationFunctions()
const databaseFunctionsInstance = databaseFunctions()
const dateFunctionsInstance = dateFunctions()
const botFunctionsInstance = botFunctions()
const mlFunctionsInstance = mlFunctions()

const roomBot = new Bot( process.env.JOIN_ROOM )

roomBot.on("reconnect", async () => {
  const { state } = await socketClient.joinRoom(token, params);
  set({ state }); // Or do whatever you normally do with the state
});

await roomBot.connect( roomFunctionsInstance, userFunctionsInstance, chatFunctionsInstance, songFunctionsInstance, botFunctionsInstance, databaseFunctionsInstance )
roomBot.configureListeners( commandFunctionsInstance, userFunctionsInstance, videoFunctionsInstance, botFunctionsInstance, chatFunctionsInstance, roomFunctionsInstance, songFunctionsInstance, databaseFunctionsInstance, documentationFunctionsInstance, dateFunctionsInstance )
const repeatedTasks = new Chain()
repeatedTasks
  .add( () => roomBot.processNewMessages( commandFunctionsInstance, userFunctionsInstance, videoFunctionsInstance, botFunctionsInstance, chatFunctionsInstance, roomFunctionsInstance, songFunctionsInstance, databaseFunctionsInstance, documentationFunctionsInstance, dateFunctionsInstance, mlFunctionsInstance ) )
  .every( 100 )
