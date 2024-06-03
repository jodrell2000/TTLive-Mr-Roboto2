bot.on( 'registered', async function ( data ) {
  const username = data.user[ 0 ].name;
  if ( username !== "Guest" ) {
    const userID = data.user[ 0 ].userid;

    userFunctions.userJoinsRoom( userID, username, databaseFunctions );

    const bootThisUser = userFunctions.bootNewUserCheck( userID, username );
    const bootUser = bootThisUser[ 0 ];
    const bootUserMessage = bootThisUser[ 1 ];

    if ( bootUser !== false ) {
      userFunctions.bootThisUser( userID, bootUserMessage );
    } else {
      chatFunctions.userGreeting( data, userID, username, roomFunctions, userFunctions, databaseFunctions )
    }

    if ( !( await databaseFunctions.hasUserHadInitialRoboCoinGift( userID ) ) ) {
      await userFunctions.giveInitialRoboCoinGift( data, userID, databaseFunctions, chatFunctions, roomFunctions );
    }

    userFunctions.askUserToSetRegion( userID, chatFunctions );
    userFunctions.updateRegionAlertsFromUsers( data, videoFunctions, chatFunctions );
  }
} );
