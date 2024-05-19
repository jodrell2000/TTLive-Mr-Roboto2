bot.on( 'snagged', function ( data ) {
  songFunctions.incrementSnagCount();
  userFunctions.updateUserLastSnagged( data.userid, databaseFunctions ); //update the afk position of people who add a song to their queue
} )
