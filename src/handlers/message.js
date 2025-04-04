import { logger } from '../utils/logging.js'
import playlistFunctions from "../libs/playlistFunctions.js";

export default async ( payload, commandFunctions, userFunctions, videoFunctions, botFunctions, chatFunctions, roomFunctions, songFunctions, databaseFunctions, documentationFunctions, dateFunctions, mlFunctions, playlistFunctions, socket ) => {
  await userFunctions.updateUserLastSpoke( payload.sender, databaseFunctions ); //update the afk position of the speaker

  if ( await commandFunctions.wasThisACommand( payload.message ) ) {
    await commandFunctions.parseCommands( payload, userFunctions, botFunctions, roomFunctions, songFunctions, chatFunctions, videoFunctions, documentationFunctions, databaseFunctions, dateFunctions, mlFunctions, playlistFunctions, socket );
  }

  //checks to see if someone is trying to speak to an afk person or not.
  const foundUsernames = await userFunctions.checkTextForUsernames( payload.message );

  for ( let userLoop = 0; userLoop < foundUsernames.length; userLoop++ ) {
    let thisAFKUserID = await userFunctions.getUserIDFromUsername( foundUsernames[ userLoop ] );
    if ( await userFunctions.isUserAFK( thisAFKUserID ) && !userFunctions.isThisTheBot( payload.sender ) === true ) {
      await userFunctions.sendUserIsAFKMessage( thisAFKUserID, chatFunctions );
    }
  }

}
