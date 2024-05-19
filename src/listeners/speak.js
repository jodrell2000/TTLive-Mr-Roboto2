bot.on( 'speak', async function ( data ) {
  let text = data.text; //the most recent text in the chatbox on turntable
  let theUserID = data.userid;
  userFunctions.name = data.name; //name of latest person to say something
  botFunctions.recordActivity();

  userFunctions.updateUserLastSpoke( theUserID, databaseFunctions ); //update the afk position of the speaker

  if ( commandFunctions.wasThisACommand( data ) ) {
    // commandFunctions.parseCommands( data, userFunctions, botFunctions, roomFunctions, songFunctions, chatFunctions, videoFunctions, documentationFunctions, databaseFunctions, dateFunctions, mlFunctions );
    await commandFunctions.parseCommands( data, userFunctions, botFunctions, roomFunctions, songFunctions, chatFunctions, videoFunctions, documentationFunctions, databaseFunctions, dateFunctions );
  }

  //checks to see if someone is trying to speak to an afk person or not.
  const foundUsernames = userFunctions.checkTextForUsernames( text );

  for ( let userLoop = 0; userLoop < foundUsernames.length; userLoop++ ) {
    let thisAFKUserID = await userFunctions.getUserIDFromUsername( foundUsernames[ userLoop ] );
    if ( userFunctions.isUserAFK( thisAFKUserID ) && !userFunctions.isThisTheBot( theUserID ) === true ) {
      userFunctions.sendUserIsAFKMessage( data, thisAFKUserID, chatFunctions );
    }
  }
} );
