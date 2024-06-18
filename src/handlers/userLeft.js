import { logger } from "../utils/logging.js";

export default async ( state, payload, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions ) => {
  logger.debug( `=========================== userLeft.js ===========================` )

  await userFunctions.rebuildUserList( state, databaseFunctions );
}
