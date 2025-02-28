import { logger } from "../utils/logging.js";

export default async (currentState, payload, socket, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions, mlFunctions) => {
  const newUsers = await userFunctions.findNewUserUUID(currentState);

  const userInfos = await Promise.all(
    newUsers.map(async uuid => {
      const userInfo = await userFunctions.extractUserInfo(payload.statePatch, uuid);
      if (!userInfo) {
        console.error(`userInfo is null for UUID: ${uuid}`);
        return null;
      }
      return userInfo;
    })
  );

  for (const userInfo of userInfos.filter(user => user !== null)) {

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
