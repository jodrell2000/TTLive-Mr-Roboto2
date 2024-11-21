import { logger } from "../utils/logging.js";
  
export default async ( currentState, payload, socket, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions ) => {
  // logger.debug( `=========================== userJoined.js ===========================` )
  const newUsers = await userFunctions.findNewUserUUID( currentState )

  const userInfos = await Promise.all(
    newUsers.map( async uuid => await userFunctions.extractUserInfo( payload.statePatch, uuid ) )
  );

  for (const userInfo of userInfos) {
    const isGhost = userInfo.avatarId === "ghost";

    const userProfile = isGhost
      ? { uuid: userInfo.uuid, nickname: userInfo.nickname, avatarId: userInfo.avatarId }
      : await userFunctions.getUserProfileFromAPI(userInfo.uuid);

    await userFunctions.userJoinsRoom(userProfile, roomFunctions, databaseFunctions, chatFunctions);

    if (!isGhost) {
      await chatFunctions.userGreeting(userInfo.uuid, userInfo.nickname, roomFunctions, userFunctions, databaseFunctions);
    }
  }
}
