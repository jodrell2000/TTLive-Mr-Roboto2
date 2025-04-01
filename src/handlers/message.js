import { logger } from '../utils/logging.js'
import playlistFunctions from "../libs/playlistFunctions.js";

export default async ( payload, commandFunctions, userFunctions, videoFunctions, botFunctions, chatFunctions, roomFunctions, songFunctions, databaseFunctions, documentationFunctions, dateFunctions, mlFunctions, playlistFunctions, socket ) => {
  await userFunctions.updateUserLastSpoke( payload.sender, databaseFunctions ); //update the afk position of the speaker

  if ( await commandFunctions.wasThisACommand( payload.message ) ) {
    await commandFunctions.parseCommands( payload, userFunctions, botFunctions, roomFunctions, songFunctions, chatFunctions, videoFunctions, documentationFunctions, databaseFunctions, dateFunctions, mlFunctions, playlistFunctions, socket );
  }

  console.log(`Someone said something: ${payload.message}`)
  console.log(`Payload: ${JSON.stringify(payload, null, 2)}`);

  // //checks to see if someone is trying to speak to an afk person or not.
  // const foundUsernames = userFunctions.checkTextForUsernames( text );
  //
  // for ( let userLoop = 0; userLoop < foundUsernames.length; userLoop++ ) {
  //   let thisAFKUserID = await userFunctions.getUserIDFromUsername( foundUsernames[ userLoop ] );
  //   if ( await userFunctions.isUserAFK( thisAFKUserID ) && !userFunctions.isThisTheBot(  ) === true ) {
  //     await userFunctions.sendUserIsAFKMessage( data, thisAFKUserID, chatFunctions );
  //   }
  // }

}
