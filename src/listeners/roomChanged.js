bot.on( 'roomChanged', async function ( data ) {
  try {
    userFunctions.resetUsersList();

    // load in and user data on disk first
    userFunctions.initialUserDataLoad( databaseFunctions );

    // reset arrays in case this was triggered by the bot restarting
    userFunctions.resetAllWarnMe( data, databaseFunctions );

    // get & set information
    roomFunctions.setRoomDefaults( data );

    // build in the users in the room, skip any already loaded from disk
    userFunctions.rebuildUserList( data );

    userFunctions.resetModerators( data, databaseFunctions );
    userFunctions.startAllUserTimers( databaseFunctions );
    userFunctions.resetDJs( data );

    if ( data.room.metadata.current_dj !== null ) {
      userFunctions.setCurrentDJ( data.room.metadata.current_dj, databaseFunctions );
    }
    if ( data.room.metadata.current_song !== null ) {
      songFunctions.getSongTags( data.room.metadata.current_song );
    }
    // ask users for their regions if we don't have them
    userFunctions.checkUsersHaveRegions( data, chatFunctions );
    userFunctions.updateRegionAlertsFromUsers( data, videoFunctions, chatFunctions );

    chatFunctions.botSpeak( "System online...", data );
  } catch ( err ) {
    console.error( 'Error in roomChanged event:', err );
    console.log( 'error', 'Unable to join the room due to an error: ' + err.toString() );
  }
} );
