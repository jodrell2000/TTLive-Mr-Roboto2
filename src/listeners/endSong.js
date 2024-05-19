bot.on( 'endsong', function ( data ) {
  songFunctions.grabSongStats();
  const djID = data.room.metadata.current_dj;
  roomFunctions.setLastDJ( djID );

  //bot says song stats for each song
  chatFunctions.readSongStats( data, songFunctions, botFunctions, databaseFunctions );

  userFunctions.incrementDJPlayCount( djID, databaseFunctions );

  // check the play limit and remove the current DJ if they've reached it
  userFunctions.removeDJsOverPlaylimit( data, chatFunctions, djID );

  roomFunctions.escortDJsDown( data, djID, botFunctions, userFunctions, chatFunctions, databaseFunctions );
} );
