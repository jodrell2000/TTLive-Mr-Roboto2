import { logger } from "../utils/logging.js";
  
export default async ( currentState, payload, socket, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions ) => {
  logger.debug( `=========================== userJoined.js ===========================` )
  console.log( `payload: ${ JSON.stringify( payload, null, 2 ) }` )

  const newUsers = await userFunctions.findNewUserUUID( currentState )
  console.log( `newUsers: ${ JSON.stringify( newUsers, null, 2 ) }` )

  const userInfos = await Promise.all(
    newUsers.map( async uuid => await userFunctions.extractUserInfo( payload.statePatch, uuid ) )
  );
  console.log( `userInfos: ${ JSON.stringify( userInfos, null, 2 ) }` )

  for ( const userInfo of userInfos ) {
    let userProfile
    if ( userInfo.avatarId === "ghost" ) {
      console.log(`We have a Ghost`)
      //build a userInfo object for the ghost

    } else {
      userProfile = await userFunctions.getUserProfileFromAPI( userInfo.uuid )
      console.log( `userProfile: ${ JSON.stringify( userProfile, null, 2 ) }` )
    }

    try {
      await userFunctions.userJoinsRoom( userProfile, roomFunctions, databaseFunctions, chatFunctions );
      await chatFunctions.userGreeting( userInfo.uuid, userInfo.nickname, roomFunctions, userFunctions, databaseFunctions );
    } catch ( error ) {
      console.error( 'Error handling user join:', error );
    }
  }
}