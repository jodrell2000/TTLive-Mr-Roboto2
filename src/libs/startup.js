import { logger } from "../utils/logging.js";

export default async ( roomUUID, state, roomFunctions, userFunctions, chatFunctions, songFunctions, botFunctions, databaseFunctions ) => {
  logger.debug(`+++++++++++++++++++++++++ startup.js +++++++++++++++++++++++++` )
  // console.log( `startup state: ${ JSON.stringify( state, null, 2) }` )
  botFunctions.setBotStartTime()
  try {
    const roomData = await roomFunctions.getRoomData( roomUUID )
    
    await botFunctions.reloadMemory( databaseFunctions, roomFunctions );
    
    await chatFunctions.botChat("System online...")
    if ( state.djs.length > 0 ) {
      const djID = state.djs[ 0 ].uuid
      await userFunctions.setCurrentDJID( djID );
      await userFunctions.setPreviousDJID( djID );
    }
    
    if ( state.nowPlaying.song ) {
      songFunctions.setPreviousTrack( state.nowPlaying.song.trackName )
      songFunctions.setPreviousArtist( state.nowPlaying.song.artistName )
    }
    
    await userFunctions.resetUsersList();
    await userFunctions.rebuildUserList( state, databaseFunctions );
    await userFunctions.updateModeratorsFromRoomData( roomData.roomRoles, databaseFunctions );

    //
    // // load in and user data on disk first
    // userFunctions.initialUserDataLoad( databaseFunctions );
    //
    // reset arrays in case this was triggered by the bot restarting
    // userFunctions.resetAllWarnMe( state, databaseFunctions );
    //
    // // get & set information
    // roomFunctions.setRoomDefaults( data );
    //
    // // build in the users in the room, skip any already loaded from disk
    //
    // userFunctions.resetModerators( data, databaseFunctions );
    // userFunctions.startAllUserTimers( databaseFunctions );
    // userFunctions.resetDJs( data );
    //
    // if ( data.room.metadata.current_dj !== null ) {
    //   userFunctions.setCurrentDJ( data.room.metadata.current_dj, databaseFunctions );
    // }
    // if ( data.room.metadata.current_song !== null ) {
    //   songFunctions.getSongTags( data.room.metadata.current_song );
    // }
    // // ask users for their regions if we don't have them
    // userFunctions.checkUsersHaveRegions( data, chatFunctions );
    // userFunctions.updateRegionAlertsFromUsers( data, videoFunctions, chatFunctions );
    //
    // chatFunctions.botSpeak( "System online...", data );
  } catch ( err ) {
    console.error( 'Error', 'Unable to join the room due to an error: ' + err.toString() );
  }
}
