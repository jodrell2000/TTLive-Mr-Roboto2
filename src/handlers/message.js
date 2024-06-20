import { logger } from '../utils/logging.js'

export default async ( payload, commandFunctions, userFunctions, videoFunctions, botFunctions, chatFunctions, roomFunctions, songFunctions, databaseFunctions, documentationFunctions, dateFunctions ) => {
  // logger.debug(`message.js payload: ${JSON.stringify(payload, null, 2)}`)
  logger.info( `message.js: sender: ${ payload.sender }, message: ${ payload.message }` )

  await userFunctions.updateUserLastSpoke( payload.sender, databaseFunctions ); //update the afk position of the speaker

  if ( await commandFunctions.wasThisACommand( payload.message ) ) {
    await commandFunctions.parseCommands( payload, userFunctions, botFunctions, roomFunctions, songFunctions, chatFunctions, videoFunctions, documentationFunctions, databaseFunctions, dateFunctions );
  }
}
