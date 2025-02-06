import { logger } from "../utils/logging.js";

export default async ( currentState, payload, socket, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions, mlFunctions ) => {
  // logger.debug( `=========================== userLeft.js ===========================` )
  const uuids = await userFunctions.findLeftUserUUID( currentState  )

  for ( const uuid of uuids ) {
    await userFunctions.deregisterUser( uuid, databaseFunctions )
  }
  await userFunctions.resetDJs( currentState.djs )
}
