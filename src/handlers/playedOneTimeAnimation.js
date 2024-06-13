import { postMessage } from '../libs/cometchat.js'
import { logger } from '../utils/logging.js'

export default async ( payload, userFunctions ) => {
  const room = process.env.ROOM_UUID
  const userID = payload.params.userUuid;
  const username = await userFunctions.getUsername( userID )
  logger.debug( `OneTimeAnimation: ${JSON.stringify( payload, null, 2 )}` )
  if ( username ) {
    const message = `${ username } jumped`

    switch ( payload.params.animation ) {
      case "jump":
        return await postMessage( {
          room,
          message: message
        } )
        break;
      case "💚":
        break;
      case "⭐️":
        break;

    }
  }
}
