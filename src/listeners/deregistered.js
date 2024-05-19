bot.on( 'deregistered', function ( data ) {
  const username = data.user[ 0 ].name;
  if ( username !== "Guest" ) {
    let theUserID = data.user[ 0 ].userid;
    userFunctions.deregisterUser( theUserID, databaseFunctions );
    userFunctions.updateRegionAlertsFromUsers( data, videoFunctions, chatFunctions );
  }
} );
