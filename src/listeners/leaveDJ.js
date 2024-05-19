bot.on( 'rem_dj', function ( data ) {
  let theUserID = data.user[ 0 ].userid;
  //removes user from the dj list when they leave the stage
  userFunctions.resetDJFlags( theUserID, databaseFunctions );

  //gives them one chance to get off-stage, then after that they're play limit is treated as normal
  if ( typeof userFunctions.getUsersRefreshCurrentPlayCount[ theUserID ] == 'number' && userFunctions.isUserInRefreshList( theUserID ) === false ) {
    delete userFunctions.getUsersRefreshCurrentPlayCount[ theUserID ]
  }

  //remove from the current djs list.
  userFunctions.removeDJFromList( theUserID )

  //this is for /warnme
  if ( userFunctions.warnme().length !== 0 ) {
    let areTheyBeingWarned = userFunctions.warnme().indexOf( theUserID );

    if ( areTheyBeingWarned !== -1 ) //if they're on /warnme and they leave the stage
    {
      userFunctions.warnme().splice( areTheyBeingWarned, 1 );
    }
  }

  //checks if when someone gets off the stage, if the person
  //on the left is now the next dj
  userFunctions.warnMeCall( roomFunctions );

  //check to see if conditions are met for bots autodjing feature
  botFunctions.checkAutoDJing( userFunctions );

  //takes a user off the escort list if they leave the stage.
  userFunctions.removeEscortMeFromUser( theUserID, databaseFunctions );
} );
