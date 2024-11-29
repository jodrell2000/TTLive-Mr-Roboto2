export default async ( currentState, payload, socket, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions ) => {
  let theUserID;
  for (const patch of payload.statePatch) {
    if (["replace"].includes(patch.op)) {
      console.log(`Replace found!!!! payload: ${JSON.stringify(payload, null, 2)}`);
    }
    if (["replace", "remove", "add"].includes(patch.op) && patch.path.startsWith('/audienceUsers/')) {
      // Check if patch.value is an object and contains uuid
      theUserID = typeof patch.value === 'object' && patch.value !== null ? patch.value.uuid : patch.value;

      if (theUserID === undefined) {
        console.log(`undefined theUserID: patch ${JSON.stringify(patch, null, 2)}`);
      } else {
        console.log(`UserID: ${JSON.stringify(theUserID, null, 2)}`);
      }
    }
  }
  
  if ( theUserID === undefined ) {
    console.log(`=======================`);
    console.log(`No UserID found?!?`)
    console.log(`removedDJ payload: ${JSON.stringify(payload, null, 2)}`);
    console.log(`=======================`);
  } else {
    console.log(`=======================`);
    console.log(`removedDJ Found UserID: ${theUserID}`);
    console.log(`=======================`);

    // do we need a new SwitchDJ for the randomizer?
    if ( roomFunctions.themeRandomizerEnabled() ) {
      await roomFunctions.checkIfWeNeedANewSwitchDJ( theUserID, userFunctions, chatFunctions )
    }
    
    await userFunctions.removeEscortMeFromUser( theUserID, databaseFunctions );
    await userFunctions.resetDJFlags( theUserID, databaseFunctions );
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
