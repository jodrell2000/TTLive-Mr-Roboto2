import { logger } from '../utils/logging.js'

export default async ( currentState, payload, socket, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions, mlFunctions, playlistFunctions ) => {
  let OKToDJ;
  let theMessage;

  try {
    for ( const patch of payload.statePatch ) {
      if ( patch.path.startsWith( '/djs/' ) ) {
        const theUserID = patch.value.uuid;
        logger.debug( `addedDj: Processing DJ ${ theUserID }` );

        try {
          // [ OKToDJ, theMessage ] = await userFunctions.checkOKToDJ( theUserID, roomFunctions );
          //
          // if ( !OKToDJ ) {
          //   const theUsername = await userFunctions.getUsername( theUserID )
          //   const theMessage = `@${theUsername} is not allowed to DJ so was removed. Please speak to a Mod to find out why`;
          //   await userFunctions.removeDJ( theUserID, theMessage, socket );
          //   // await userFunctions.incrementSpamCounter( theUserID, databaseFunctions );
          //   await chatFunctions.botSpeak( theMessage );
          // } else {

          // sets djs current song count to zero when they enter the stage. unless they used the refresh command, in
          // which case its set to what it was before they left the room
          logger.debug( `addedDj: Setting DJ current play count for ${ theUserID }` );
          userFunctions.setDJCurrentPlayCount( theUserID, userFunctions.getUsersRefreshCurrentPlayCount[ theUserID ], databaseFunctions );

          logger.debug( `addedDj: Updating user joined stage for ${ theUserID }` );
          await userFunctions.updateUserJoinedStage( theUserID, databaseFunctions );

          if ( await userFunctions.hasDjsElement( currentState ) ) {
            logger.debug( `addedDj: Resetting DJs` );
            await userFunctions.resetDJs( currentState.djs )
          }

          if ( userFunctions.isUserIDInQueue( theUserID ) ) {
            logger.debug( `addedDj: Removing user ${ theUserID } from queue` );
            userFunctions.removeUserFromQueue( theUserID, botFunctions );
            userFunctions.clearDJToNotify();
          }

          if ( await userFunctions.isUserInRefreshList( theUserID ) ) {
            logger.debug( `addedDj: Removing refresh from user ${ theUserID }` );
            await userFunctions.removeRefreshFromUser( theUserID, databaseFunctions );
          }

          // check if Bot should start to DJ
          // and if it's their turn, pick a track to play
          logger.debug( `addedDj: Checking auto DJing` );
          await botFunctions.checkAutoDJing( userFunctions, songFunctions, mlFunctions, playlistFunctions, socket, roomFunctions, databaseFunctions, chatFunctions );

          // }

          // check to see if conditions are met for bots autodjing feature
          // await botFunctions.checkAutoDJing( userFunctions );

        } catch ( error ) {
          logger.error( `addedDj: Error processing DJ ${ theUserID }:`, error.message || error.toString() );
          // Continue processing other DJs even if one fails
        }
      }
    }
  } catch ( error ) {
    logger.error( `addedDj: Fatal error in addedDj handler:`, error.message || error.toString() );
    logger.error( `addedDj: Error details:`, JSON.stringify( error, Object.getOwnPropertyNames( error ), 2 ) );
  }
}
