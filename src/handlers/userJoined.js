import { postMessage } from '../libs/cometchat.js'
import { logger } from "../utils/logging.js";

export default async ( payload, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions ) => {
  logger.debug( `In userJoined.js payload.allUserData: ${ JSON.stringify( payload.allUserData ) }` )
  if ( payload.allUserData && Object.keys( payload.allUserData ).length > 0 ) {
    const firstUUID = Object.keys( payload.allUserData )[ 0 ];
    const nickname = payload.allUserData[ firstUUID ].userProfile.nickname;

    await userFunctions.userJoinsRoom( firstUUID, nickname, databaseFunctions );
    await chatFunctions.userGreeting( payload, firstUUID, nickname, roomFunctions, userFunctions, databaseFunctions )

  }
}
