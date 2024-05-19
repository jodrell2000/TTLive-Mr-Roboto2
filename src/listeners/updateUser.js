bot.on( 'update_user', function ( data ) {
  userFunctions.updateUser( data, databaseFunctions );
} )
