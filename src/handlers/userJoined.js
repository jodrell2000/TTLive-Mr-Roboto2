import { logger } from "../utils/logging.js";
  
export default async ( currentState, payload, socket, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions ) => {
  logger.debug( `=========================== userJoined.js ===========================` )
  const newUsers = await userFunctions.findNewUserUUID( currentState )
  for (const uuid of newUsers) {
    const userProfile = await userFunctions.getUserProfileFromAPI( uuid )
    const nickname = userProfile?.nickname;
    if (nickname) {
      try {
        await userFunctions.userJoinsRoom(userProfile, roomFunctions, databaseFunctions, chatFunctions);
        await chatFunctions.userGreeting(uuid, nickname, roomFunctions, userFunctions, databaseFunctions);
      } catch (error) {
        console.error('Error handling user join:', error);
      }
    } else {
      console.warn('User profile does not have a nickname:', JSON.stringify(payload,null,2));
    }  }
}
