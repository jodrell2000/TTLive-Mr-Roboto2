import { logger } from "../utils/logging.js";
  
export default async ( currentState, payload, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions ) => {
  logger.debug( `=========================== userJoined.js ===========================` )
  const newUsers = await userFunctions.findNewUserUUID( currentState )
  for (const uuid of newUsers) {
    const userProfile = await userFunctions.getUserProfileFromAPI( uuid )
    const nickname = userProfile.nickname
    
    await userFunctions.userJoinsRoom( userProfile, roomFunctions, databaseFunctions );
    await chatFunctions.userGreeting( uuid, nickname, roomFunctions, userFunctions, databaseFunctions )
  }
}
