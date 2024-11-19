import { logger } from "../utils/logging.js";
  
export default async ( currentState, payload, socket, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions ) => {
  logger.debug( `=========================== userJoined.js ===========================` )
  console.log( `payload: ${JSON.stringify(payload, null, 2)}` )

  const newUsers = await userFunctions.findNewUserUUID( currentState )
  console.log(`newUsers: ${JSON.stringify(newUsers, null, 2)}`)

  const userInfos = await Promise.all(
    newUsers.map(async uuid => await userFunctions.extractUserInfo(payload.statePatch, uuid))
  );
  console.log(`userInfos: ${JSON.stringify(userInfos, null, 2)}`)
  
  for (const uuid of newUsers) {
    const userProfile = await userFunctions.getUserProfileFromAPI( uuid )
    // const nickname = userProfile?.nickname;

    let nickname = payload.statePatch
      .filter(
        patch =>
          patch.op === "add" &&
          patch.path === `/allUserData/${uuid}`
      )
      .map(patch => patch.value.userProfile.nickname)[0];

    console.log(`================== new user joined: ${nickname}`)

    if (nickname) {
      try {
        await userFunctions.userJoinsRoom(userProfile, roomFunctions, databaseFunctions, chatFunctions);
        await chatFunctions.userGreeting(uuid, nickname, roomFunctions, userFunctions, databaseFunctions);
      } catch (error) {
        console.error('Error handling user join:', error);
      }
    } else {
      // console.warn(`This may be a Ghost...payload: ${JSON.stringify(payload,null,2)}
      // currentState: ${JSON.stringify(currentState,null,2)}
      // newUsers: ${JSON.stringify(await userFunctions.findNewUserUUID( currentState ),null,2)}`);
    }  }
}