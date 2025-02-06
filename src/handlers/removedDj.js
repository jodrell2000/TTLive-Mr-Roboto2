export default async ( currentState, payload, socket, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions, mlFunctions ) => {
  
  const beforeDJList = await userFunctions.djList();
  await userFunctions.resetDJs( currentState.djs )
  const afterDJList = await userFunctions.djList();

  const removedDJuuid = beforeDJList.find(uuid => !afterDJList.includes(uuid));

  if ( removedDJuuid !== undefined ) {
    // do we need a new SwitchDJ for the randomizer?
    if ( roomFunctions.themeRandomizerEnabled() ) {
      await roomFunctions.checkIfWeNeedANewSwitchDJ( removedDJuuid, userFunctions, chatFunctions )
    }

    await userFunctions.removeEscortMeFromUser( removedDJuuid, databaseFunctions );
    await userFunctions.resetDJFlags( removedDJuuid, databaseFunctions );
  }

  // check if Bot should start to DJ
  // and if it's their turn, pick a track to play
  await botFunctions.checkAutoDJing( userFunctions, songFunctions, mlFunctions, socket )

}

//gives them one chance to get off-stage, then after that they're play limit is treated as normal
// if ( typeof await userFunctions.getUsersRefreshCurrentPlayCount[ theUserID ] == 'number' && await userFunctions.isUserInRefreshList( theUserID ) === false ) {
//   delete await userFunctions.getUsersRefreshCurrentPlayCount[ theUserID ]
// }


// this is for /warnme
// if ( userFunctions.warnme().length !== 0 ) {
//   let areTheyBeingWarned = userFunctions.warnme().indexOf( theUserID );
//   if ( areTheyBeingWarned !== -1 ) { //if they're on /warnme and they leave the stage
//     userFunctions.warnme().splice( areTheyBeingWarned, 1 );
//   }
// }

//checks if when someone gets off the stage, if the person
//on the left is now the next dj
// userFunctions.warnMeCall( roomFunctions );

//check to see if conditions are met for bots autodjing feature
// await botFunctions.checkAutoDJing( userFunctions );
