export default async ( currentState, payload, socket, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions ) => {
  // console.log(`removedDJ payload:${JSON.stringify(payload,null,2)}`)
  for ( const patch of payload.statePatch ) {
    if (patch.path.startsWith('/audienceUsers/') && patch.path.endsWith('/uuid')) {
      const theUserID = patch.value;
      await userFunctions.resetDJFlags( theUserID, databaseFunctions );

      //gives them one chance to get off-stage, then after that they're play limit is treated as normal
      if ( typeof await userFunctions.getUsersRefreshCurrentPlayCount[ theUserID ] == 'number' && await userFunctions.isUserInRefreshList( theUserID ) === false ) {
        delete await userFunctions.getUsersRefreshCurrentPlayCount[ theUserID ]
      }

      if ( await userFunctions.hasDjsElement( currentState ) ) {
        await userFunctions.resetDJs( currentState.djs )
        console.log( `djList:${ userFunctions.djList() }` )
      }

      // this is for /warnme
      if ( userFunctions.warnme().length !== 0 ) {
        let areTheyBeingWarned = userFunctions.warnme().indexOf( theUserID );
        if ( areTheyBeingWarned !== -1 ) { //if they're on /warnme and they leave the stage
          userFunctions.warnme().splice( areTheyBeingWarned, 1 );
        }
      }

      //checks if when someone gets off the stage, if the person
      //on the left is now the next dj
      userFunctions.warnMeCall( roomFunctions );

      //check to see if conditions are met for bots autodjing feature
      // await botFunctions.checkAutoDJing( userFunctions );

      await userFunctions.removeEscortMeFromUser( theUserID, databaseFunctions );
    }
  }
}
