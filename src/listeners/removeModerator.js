bot.on( 'rem_moderator', function ( data ) {
  const theUserID = data.userid;
  userFunctions.removeModerator( theUserID, databaseFunctions )
} )
