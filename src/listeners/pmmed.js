bot.on( 'pmmed', async function ( data ) {
  if ( commandFunctions.wasThisACommand( data ) ) {
    // commandFunctions.parseCommands( data, userFunctions, botFunctions, roomFunctions, songFunctions, chatFunctions, videoFunctions, documentationFunctions, databaseFunctions, dateFunctions, mlFunctions );
    await commandFunctions.parseCommands( data, userFunctions, botFunctions, roomFunctions, songFunctions, chatFunctions, videoFunctions, documentationFunctions, databaseFunctions, dateFunctions, socket );
  }
} );
