import { logger } from "../utils/logging.js";

export default async ( roomUUID, state, roomFunctions, userFunctions, chatFunctions, songFunctions, botFunctions, databaseFunctions ) => {
  logger.debug(`+++++++++++++++++++++++++ startup.js +++++++++++++++++++++++++` )
  console.log( `startup state: ${ JSON.stringify( state.djs, null, 2) }` )
  botFunctions.setBotStartTime()
  try {
    await roomFunctions.storeRoomData( roomUUID )
    
    await databaseFunctions.resetAllCurrentDJs()
    await botFunctions.reloadMemory( databaseFunctions, roomFunctions );
    
    await chatFunctions.botChat("System online...")
    if ( state.nowPlaying.song ) {
      songFunctions.setPreviousTrack( state.nowPlaying.song.trackName )
      songFunctions.setPreviousArtist( state.nowPlaying.song.artistName )
    }
    
    await userFunctions.resetUsersList();
    await userFunctions.rebuildUserList( state, databaseFunctions );

    // console.log(JSON.stringify(`full state ${JSON.stringify(state, null, 2)}`))
    console.log(`djs from state: ${ JSON.stringify(state.djs, null, 2) }`)
    if ( await userFunctions.hasDjsElement( state ) ) {
      await userFunctions.resetDJs( state.djs )
      console.log( `djList:${ userFunctions.djList() }` )
    }
    
    if ( state.djs.length > 0 ) {
      const djID = state.djs[ 0 ].uuid
      await userFunctions.setCurrentDJID( djID, databaseFunctions );
      await userFunctions.setPreviousDJID( djID );
    }

    // console.log( `startup roomData:${ JSON.stringify( roomData, null, 2 ) }` )
    await userFunctions.updateModeratorsFromRoomData( roomFunctions, databaseFunctions );
    
  } catch ( err ) {
    console.error( 'Error', 'There was an issue on startup: ' + err.toString() );
  }
}
