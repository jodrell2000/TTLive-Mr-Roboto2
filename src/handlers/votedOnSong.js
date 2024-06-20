import { logger } from "../utils/logging.js";

export default async ( payload, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions ) => {

  logger.debug( `=========================== votedOnSong.js ===========================` )
  const statePatch = payload.message.statePatch;

  for ( const patch of statePatch ) {
    const path = patch.path;
    const value = patch.value;

    // Check if the path matches the pattern for song votes
    const match = path.match(/^\/allUserData\/([a-f0-9\-]+)\/songVotes\/like$/);

    if (match) {
      const uuid = match[1];
      await userFunctions.updateUserLastVoted( uuid, databaseFunctions )

      if (value === true) {
        await songFunctions.recordUpVotes( uuid );
      } else if (value === false) {
        await songFunctions.recordDownVotes( uuid );
      }
    }
  }
}
