bot.on( 'update_votes', function ( data ) {
  songFunctions.recordUpVotes( data );
  songFunctions.recordDownVotes( data );
  userFunctions.updateUserLastVoted( data.room.metadata.votelog[ 0 ][ 0 ], databaseFunctions ); //update the afk position of people who vote for a song

  //this is for /autosnag, automatically adds songs that get over the awesome threshold
  if ( botDefaults.autoSnag === true && songFunctions.snagSong() === false && songFunctions.upVotes() >= botDefaults.howManyVotes && songFunctions.ALLREADYCALLED() === false ) {
    songFunctions.songSnagged();
    botFunctions.checkAndAddToPlaylist( songFunctions );
  }
} )
