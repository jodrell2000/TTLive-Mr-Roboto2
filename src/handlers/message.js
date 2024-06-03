import { postMessage } from '../libs/cometchat.js'
import { logger } from '../utils/logging.js'

import commandFunctions from '../libs/commandsFunctions.js'
import userFunctions from '../libs/userFunctions.js'
import roomFunctions from '../libs/roomFunctions.js'
import songFunctions from '../libs/songFunctions.js'
import chatFunctions from '../libs/chatFunctions.js'
import videoFunctions from '../libs/videoFunctions.js'
import documentationFunctions from '../libs/documentationFunctions.js'
import databaseFunctions from '../libs/databaseFunctions.js'
import dateFunctions from '../libs/dateFunctions.js'
import botFunctions from '../libs/botFunctions.js'


export default async ( payload, room ) => {
  //logger.debug(`message.js payload: ${JSON.stringify(payload)}`)
  logger.info( `message.js: sender: ${payload.senderName}, message: ${payload.message}, room: ${room}` )
  
  if ( await commandFunctions.wasThisACommand(payload.message) ) {
    await commandFunctions.parseCommands( payload, userFunctions, botFunctions, roomFunctions, songFunctions, chatFunctions, videoFunctions, documentationFunctions, databaseFunctions, dateFunctions );
  }

  // const isACommand = await commandFunctions.wasThisACommand(payload.message)
  //
  // return await postMessage({
  //   room,
  //   message: 'Command=' + isACommand
  // })
}
