import { logger } from "../utils/logging.js";

async function extractUserFromStatePatch( data ) {
  const statePatch = data.statePatch;

  for ( const patch of statePatch ) {
    if ( patch.op === "add" && patch.path.includes( '/allUserData/' ) ) {
      if ( patch.value && patch.value.userProfile ) {
        return patch.value.userProfile
      }
    }
  }
  return null; // Return null if no matching userProfile is found
}

export default async ( payload, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions ) => {
  logger.debug( `=========================== userJoined.js ===========================` )
  if ( Object.keys(payload.allUserData).length > 0 ) { 
    const uuid = Object.keys(payload.allUserData)[0]
    let userProfile
    if ( payload.statePatch && payload.statePatch.length > 0 ) {
      userProfile = await extractUserFromStatePatch( payload )
    } else {
      userProfile = payload.allUserData[uuid].userProfile
    }
    
   if ( userProfile !== undefined ) {
     let nickname
     try {
       nickname = userProfile.nickname
     } catch ( error ) {
       console.error( `Can't read the nickname:`, error.message );
       throw error;
     }
  
     if ( uuid != null && nickname != null ) {
       await userFunctions.userJoinsRoom( userProfile, roomFunctions, databaseFunctions );
       await chatFunctions.userGreeting( payload, uuid, nickname, roomFunctions, userFunctions, databaseFunctions )
     }
   }
 }
}
