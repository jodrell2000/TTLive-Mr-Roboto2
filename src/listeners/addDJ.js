bot.on( 'add_dj', function ( data ) {
  let OKToDJ;
  let theMessage;
  const theUserID = data.user[ 0 ].userid;
  const totalPlayCount = userFunctions.getDJTotalPlayCount( theUserID );

  [ OKToDJ, theMessage ] = userFunctions.checkOKToDJ( theUserID, roomFunctions );

  if ( !OKToDJ ) {
    userFunctions.removeDJ( theUserID, 'User is not allowed to DJ so was removed', socket );
    userFunctions.incrementSpamCounter( theUserID, databaseFunctions );
    chatFunctions.botSpeak( theMessage );
  }

  //sets djs current song count to zero when they enter the stage.
  //unless they used the refresh command, in which case its set to
  //what it was before they left the room
  userFunctions.setDJCurrentPlayCount( theUserID, userFunctions.getUsersRefreshCurrentPlayCount[ theUserID ], databaseFunctions );

  //keep the total play count as it is, unless they've refreshed
  if ( totalPlayCount !== undefined ) {
    userFunctions.setDJTotalPlayCount( theUserID, totalPlayCount, databaseFunctions );
  } else {
    userFunctions.setDJTotalPlayCount( theUserID, userFunctions.getUsersRefreshTotalPlayCount[ theUserID ], databaseFunctions );
  }
  //updates the afk position of the person who joins the stage.
  userFunctions.updateUserJoinedStage( theUserID, databaseFunctions );

  //adds a user to the Djs list when they join the stage.
  userFunctions.addDJToList( theUserID );

  if ( userFunctions.isUserIDInQueue( theUserID ) ) {
    userFunctions.removeUserFromQueue( theUserID, botFunctions );
    userFunctions.clearDJToNotify();
  }

  if ( userFunctions.isUserInRefreshList( theUserID ) ) {
    userFunctions.removeRefreshFromUser( theUserID, databaseFunctions );
  }

  //check to see if conditions are met for bots autodjing feature
  botFunctions.checkAutoDJing( userFunctions );
} );
