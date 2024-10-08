export default async ( currentState, payload, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions ) => {
  let OKToDJ;
  let theMessage;

  for ( const patch of payload.statePatch ) {
    if (patch.path.startsWith('/djs/')) {
      const theUserID = patch.value.uuid;
      
      [ OKToDJ, theMessage ] = await userFunctions.checkOKToDJ( theUserID, roomFunctions );

      if ( !OKToDJ ) {
        await userFunctions.removeDJ( theUserID, 'User is not allowed to DJ so was removed' );
        await userFunctions.incrementSpamCounter( theUserID, databaseFunctions );
        await chatFunctions.botSpeak( theMessage );
      }

      // sets djs current song count to zero when they enter the stage. unless they used the refresh command, in
      // which case its set to what it was before they left the room
      userFunctions.setDJCurrentPlayCount( theUserID, userFunctions.getUsersRefreshCurrentPlayCount[ theUserID ], databaseFunctions );

      await userFunctions.updateUserJoinedStage( theUserID, databaseFunctions );
      
      if ( await userFunctions.hasDjsElement( currentState ) ) {
        await userFunctions.resetDJs( currentState.djs )
        console.log( `djList:${ userFunctions.djList() }` )
      }

      if ( userFunctions.isUserIDInQueue( theUserID ) ) {
        userFunctions.removeUserFromQueue( theUserID, botFunctions );
        userFunctions.clearDJToNotify();
      }

      if ( await userFunctions.isUserInRefreshList( theUserID ) ) {
        await userFunctions.removeRefreshFromUser( theUserID, databaseFunctions );
      }

      // check to see if conditions are met for bots autodjing feature
      // await botFunctions.checkAutoDJing( userFunctions );

    }
  }
}
