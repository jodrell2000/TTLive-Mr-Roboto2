import { postMessage } from '../libs/cometchat.js'
import { logger } from '../utils/logging.js'

export default async ( payload, userFunctions ) => {
  const room = process.env.ROOM_UUID
  const userID = payload.params.userUuid;
  const username = await userFunctions.getUsername( userID )
logger.debug(JSON.stringify(username))
  if ( username ) {
    const message = `${ username } jumped`
    return await postMessage( {
      room,
      message: message
    } )
  }
}
