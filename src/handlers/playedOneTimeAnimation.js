import { postMessage } from '../libs/cometchat.js'

export default async ( payload, userFunctions, songFunctions, databaseFunctions ) => {
  const room = process.env.ROOM_UUID
  const userID = payload.params.userUuid;
  
  if ( payload.params.animation && payload.params.animation === "jump" ) {
    await songFunctions.recordJump(userID);

    const username = await userFunctions.getUsername( userID )
    const message = `${ username } jumped`
    return await postMessage( {
      room,
      message: message
    } )
  } else if ( payload.params.animation && payload.params.animation === "emoji" ) {
    switch ( payload.params.emoji ) {
      case "💚":
      case "💜":
      case "⭐️":
        try {
          await userFunctions.updateUserLastSnagged( userID, databaseFunctions )
          await songFunctions.recordSnag(userID);
        } catch (error) {
          console.error(`Error recording snag: ${error.message}`);
        }
        break;
      default:
        console.warn(`Unhandled animation: ${payload.params.animation}`);
    }
  }
}
