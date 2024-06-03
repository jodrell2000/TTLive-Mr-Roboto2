import { postMessage } from '../libs/cometchat.js'
import { logger } from "../utils/logging.js";

export default async ( payload ) => {
  logger.debug( `payload: ${ JSON.stringify( payload ) }` )
  const room = process.env.ROOM_UUID
  if ( payload.allUserData ) {
    const firstUUID = Object.keys( payload.allUserData )[ 0 ];
    logger.debug( `firstUUID: ${ firstUUID }` )
    const nickname = payload.allUserData[ firstUUID ].userProfile.nickname;

    return await postMessage( {
      room,
      message: `Welcome @${ nickname }`
    } )
  }
}
