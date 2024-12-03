export default async ( currentState, payload, socket, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions ) => {
  
  let removedDJuuid
  
  // Iterate through the statePatch array
  for (const operation of payload.statePatch) {
    if (operation.op === "remove" && operation.path.startsWith("/djs/")) {
      // Extract the integer at the end of the path
      const match = operation.path.match(/\/djs\/(\d+)$/);
      if (match) {
        const theDJNumber = parseInt(match[1], 10)
        removedDJuuid = userFunctions.djList()[theDJNumber]
        console.log(`DJ List ${JSON.stringify(userFunctions.djList(), null, 2)}`)
        console.log(`Found DJ No.${theDJNumber}`)
        console.log(`Found DJ uuid ${removedDJuuid}`)
      }
    }
  }

  if ( removedDJuuid === undefined ) {
    console.log(`=======================`);
    console.log(`No UserID found?!?`)
    console.log(`removedDJ payload: ${JSON.stringify(payload, null, 2)}`);
    console.log(`=======================`);
  } else {
    console.log(`=======================`);
    console.log(`removedDJ Found UserID: ${removedDJuuid}`);
    console.log(`=======================`);

    // do we need a new SwitchDJ for the randomizer?
    if ( roomFunctions.themeRandomizerEnabled() ) {
      await roomFunctions.checkIfWeNeedANewSwitchDJ( removedDJuuid, userFunctions, chatFunctions )
    }

    await userFunctions.removeEscortMeFromUser( removedDJuuid, databaseFunctions );
    await userFunctions.resetDJFlags( removedDJuuid, databaseFunctions );
  }

  if ( await userFunctions.hasDjsElement( currentState ) ) {
    await userFunctions.resetDJs( currentState.djs )
  }
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
