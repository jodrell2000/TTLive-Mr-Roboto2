import { logger } from "../utils/logging.js";
  
export default async ( currentState, payload, socket, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions ) => {
  logger.debug( `=========================== userJoined.js ===========================` )
  const newUsers = await userFunctions.findNewUserUUID( currentState )
  const userInfos = await Promise.all(
    newUsers.map( async uuid => await userFunctions.extractUserInfo( payload.statePatch, uuid ) )
  );
  console.log( `userInfos: ${ JSON.stringify( userInfos, null, 2 ) }` )

  for ( const userInfo of userInfos ) {
    let userProfile
    if ( userInfo.avatarId === "ghost" ) {
      userProfile = { uuid: userInfo.uuid, nickname: userInfo.nickname, avatarId: userInfo.avatarId }
      await chatFunctions.botSpeak( "Who you gonna call?!?" )
      //build a userInfo object for the ghost

    } else {
      userProfile = await userFunctions.getUserProfileFromAPI( userInfo.uuid )
      await chatFunctions.userGreeting( userInfo.uuid, userInfo.nickname, roomFunctions, userFunctions, databaseFunctions );
      console.log( `userProfile: ${ JSON.stringify( userProfile, null, 2 ) }` )
    }

    await userFunctions.userJoinsRoom( userProfile, roomFunctions, databaseFunctions, chatFunctions );
  }
}
