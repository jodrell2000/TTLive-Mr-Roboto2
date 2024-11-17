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
      currentState: ${JSON.stringify(await userFunctions.getUserProfileFromAPI( uuid ),null,2)}
      newUsers: ${JSON.stringify(await userFunctions.findNewUserUUID( currentState ),null,2)}`);
    }  }
}

// Ghost example
// This may be a Ghost...payload: {
//   "name": "userJoined",
//     "statePatch": [
//     {
//       "op": "replace",
//       "path": "/vibeMeter",
//       "value": 0.14285714285714285
//     },
//     {
//       "op": "add",
//       "path": "/floorUsers/5",
//       "value": {
//         "uuid": "95d7a292-1d05-4fb9-aa15-45ed41411b58",
//         "tokenRole": "guest",
//         "canDj": true
//       }
//     },
//     {
//       "op": "add",
//       "path": "/audienceUsers/5",
//       "value": {
//         "uuid": "95d7a292-1d05-4fb9-aa15-45ed41411b58",
//         "tokenRole": "guest",
//         "canDj": true
//       }
//     },
//     {
//       "op": "add",
//       "path": "/allUsers/7",
//       "value": {
//         "uuid": "95d7a292-1d05-4fb9-aa15-45ed41411b58",
//         "tokenRole": "guest",
//         "canDj": true
//       }
//     },
//     {
//       "op": "add",
//       "path": "/allUserData/95d7a292-1d05-4fb9-aa15-45ed41411b58",
//       "value": {
//         "userProfile": {
//           "color": "#FFFFFF",
//           "nickname": "ghost-9913",
//           "uuid": "95d7a292-1d05-4fb9-aa15-45ed41411b58",
//           "avatarId": "ghost"
//         },
//         "position": {
//           "x": 19.8,
//           "y": 22.3
//         },
//         "songVotes": {}
//       }
//     }
//   ]
// }
// userProfile: undefined
// This may be a Ghost...payload: {
//   "name": "userJoined",
//     "statePatch": [
//     {
//       "op": "replace",
//       "path": "/vibeMeter",
//       "value": 0.14285714285714285
//     },
//     {
//       "op": "add",
//       "path": "/floorUsers/5",
//       "value": {
//         "uuid": "95d7a292-1d05-4fb9-aa15-45ed41411b58",
//         "tokenRole": "guest",
//         "canDj": true
//       }
//     },
//     {
//       "op": "add",
//       "path": "/audienceUsers/5",
//       "value": {
//         "uuid": "95d7a292-1d05-4fb9-aa15-45ed41411b58",
//         "tokenRole": "guest",
//         "canDj": true
//       }
//     },
//     {
//       "op": "add",
//       "path": "/allUsers/7",
//       "value": {
//         "uuid": "95d7a292-1d05-4fb9-aa15-45ed41411b58",
//         "tokenRole": "guest",
//         "canDj": true
//       }
//     },
//     {
//       "op": "add",
//       "path": "/allUserData/95d7a292-1d05-4fb9-aa15-45ed41411b58",
//       "value": {
//         "userProfile": {
//           "color": "#FFFFFF",
//           "nickname": "ghost-9913",
//           "uuid": "95d7a292-1d05-4fb9-aa15-45ed41411b58",
//           "avatarId": "ghost"
//         },
//         "position": {
//           "x": 19.8,
//           "y": 22.3
//         },
//         "songVotes": {}
//       }
//     }
//   ]
// }
// userProfile: undefined