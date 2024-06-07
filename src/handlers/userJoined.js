import { logger } from "../utils/logging.js";

async function extractUserFromStatePatch( data ) {
  const statePatch = data.statePatch;

  for ( const patch of statePatch ) {
    if ( patch.op === "add" && patch.path.includes( '/allUserData/' ) ) {
      if ( patch.value && patch.value.userProfile && patch.value.userProfile.nickname ) {
        return [ patch.value.userProfile.uuid, patch.value.userProfile.nickname ];
      }
    }
  }
  return null; // Return null if no matching userProfile is found
}

export default async ( payload, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions ) => {
  logger.debug( `userJoined.js payload: ${ JSON.stringify( payload ) }` )
  if ( payload.statePatch && payload.statePatch.length > 0 ) {
    const [ uuid, nickname ] = await extractUserFromStatePatch( payload ) ?? [ null, null ]

    if ( uuid != null && nickname != null) {
      await userFunctions.userJoinsRoom( uuid, nickname, databaseFunctions );
      await chatFunctions.userGreeting( payload, uuid, nickname, roomFunctions, userFunctions, databaseFunctions )
    }
  }
}
