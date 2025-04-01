import { logger } from '../utils/logging.js'
import playlistFunctions from "../libs/playlistFunctions.js";

export default async ( payload, commandFunctions, userFunctions, videoFunctions, botFunctions, chatFunctions, roomFunctions, songFunctions, databaseFunctions, documentationFunctions, dateFunctions, mlFunctions, playlistFunctions, socket ) => {
  await userFunctions.updateUserLastSpoke( payload.sender, databaseFunctions ); //update the afk position of the speaker

  if ( await commandFunctions.wasThisACommand( payload.message ) ) {
    await commandFunctions.parseCommands( payload, userFunctions, botFunctions, roomFunctions, songFunctions, chatFunctions, videoFunctions, documentationFunctions, databaseFunctions, dateFunctions, mlFunctions, playlistFunctions, socket );
  }
  
  console.log(`Someone said something: ${payload.message}`)
}
