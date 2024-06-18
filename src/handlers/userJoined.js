import { logger } from "../utils/logging.js";
  
export default async ( currentState, payload, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions ) => {
  logger.debug( `=========================== userJoined.js ===========================` )
  
  const newUsers = await userFunctions.findNewUserUUID( payload )
  console.log(`newUsers:${JSON.stringify(newUsers,null,2)}`)
  for (const uuid of newUsers) {
    const userProfile = await userFunctions.getUserProfileFromAPI( uuid )
    console.log(`userProfile:${JSON.stringify(userProfile,null,2)}`)
    const nickname = userProfile.nickname
    
    await userFunctions.userJoinsRoom( userProfile, roomFunctions, databaseFunctions );
    await chatFunctions.userGreeting( uuid, nickname, roomFunctions, userFunctions, databaseFunctions )
  }
}
