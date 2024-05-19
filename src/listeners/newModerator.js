bot.on( 'new_moderator', function ( data ) {
  const theUserID = data.userid;
  userFunctions.addModerator( theUserID, databaseFunctions )
} )
