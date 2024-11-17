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
      console.warn(`This may be a Ghost...payload: ${JSON.stringify(payload,null,2)}
      userProfile: ${JSON.stringify(await userFunctions.getUserProfileFromAPI( uuid ),null,2)}`);
    }  }
}

// Ghost example
// {
//   "name": "userJoined",
//     "statePatch": [
//     {
//       "op": "replace",
//       "path": "/vibeMeter",
//       "value": 0.1111111111111111
//     },
//     {
//       "op": "add",
//       "path": "/floorUsers/7",
//       "value": {
//         "uuid": "7327359a-b420-412d-b8a2-db492534161e",
//         "tokenRole": "user",
//         "canDj": true
//       }
//     },
//     {
//       "op": "add",
//       "path": "/audienceUsers/7",
//       "value": {
//         "uuid": "7327359a-b420-412d-b8a2-db492534161e",
//         "tokenRole": "user",
//         "canDj": true
//       }
//     },
//     {
//       "op": "replace",
//       "path": "/allUsers/8/tokenRole",
//       "value": "user"
//     },
//     {
//       "op": "replace",
//       "path": "/allUsers/8/uuid",
//       "value": "7327359a-b420-412d-b8a2-db492534161e"
//     },
//     {
//       "op": "add",
//       "path": "/allUsers/9",
//       "value": {
//         "uuid": "cab98d10-c3e2-40ea-8045-8e34009b52b9",
//         "tokenRole": "guest",
//         "canDj": true
//       }
//     },
//     {
//       "op": "add",
//       "path": "/allUserData/7327359a-b420-412d-b8a2-db492534161e",
//       "value": {
//         "userProfile": {
//           "id": 198747,
//           "color": null,
//           "avatarId": "23",
//           "badges": [],
//           "createdAt": "2024-11-15T04:18:03.664Z",
//           "discord": "",
//           "nickname": "MrWest",
//           "discordNickname": "",
//           "firstName": "",
//           "lastName": "",
//           "pronoun": "",
//           "displayPronouns": true,
//           "songOfTheWeek": "",
//           "song": {
//             "id": "",
//             "isrc": "",
//             "genre": "",
//             "duration": 0,
//             "trackUrl": "",
//             "trackName": "",
//             "artistName": "",
//             "musicProvider": ""
//           },
//           "coverPicture": "",
//           "facebook": "",
//           "instagram": "",
//           "twitter": "",
//           "snapchat": "",
//           "tiktok": "",
//           "priceForGig": 0,
//           "zodiac": "",
//           "uuid": "7327359a-b420-412d-b8a2-db492534161e"
//         },
//         "position": {
//           "x": 55,
//           "y": 28.3
//         },
//         "songVotes": {}
//       }
//     }
//   ]
// }