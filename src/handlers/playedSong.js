import { logger } from "../utils/logging.js";
import { ActionName } from "ttfm-socket";
import roomDefaults from "../defaults/roomDefaults.js";

export default async ( state, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions, socket ) => {
  // logger.debug( `================== playedSong ====================` )

  if ( await userFunctions.hasDjsElement( state ) ) {
    await userFunctions.resetDJs( state.djs )
    // console.log( `djList:${ userFunctions.djList() }` )
  }

  // end song
  let djID;
  if ( state.nowPlaying && state.nowPlaying.song ) {
    // console.log(JSON.stringify(state.nowPlaying.song, null, 2))
    djID = state.djs[ 0 ].uuid;
    await songFunctions.grabSongStats();
    await userFunctions.setCurrentDJID( djID, databaseFunctions );
    const videoID = state.nowPlaying.song.songShortId
    await chatFunctions.readSongStats( videoID, songFunctions, botFunctions, databaseFunctions, userFunctions );
    await databaseFunctions.saveLastSongStats( songFunctions );
    await userFunctions.incrementDJPlayCount( djID, databaseFunctions );

  // await userFunctions.removeDJsOverPlaylimit( data, chatFunctions, djID );
    await roomFunctions.escortDJsDown( await userFunctions.getPreviousDJID(), botFunctions, userFunctions, chatFunctions, databaseFunctions, socket );

  // new song

    await songFunctions.resetVoteCountSkip();
    await songFunctions.resetVotesLeft( roomDefaults.HowManyVotesToSkip );
    await songFunctions.resetUpVotes();
    await songFunctions.resetDownVotes();
    await songFunctions.resetSnagCount();
    await songFunctions.resetJumpCount();
    await songFunctions.resetVoteSnagging();
    await botFunctions.clearAllTimers( userFunctions, roomFunctions, songFunctions, chatFunctions, socket );

    if ( state.nowPlaying.song ) {
      songFunctions.getSongTags( state )
      await databaseFunctions.saveTrackData( djID, state.nowPlaying.song );
    }

    await userFunctions.setPreviousDJID( djID );
    songFunctions.setPreviousTrack( state.nowPlaying.song.trackName )
    songFunctions.setPreviousArtist( state.nowPlaying.song.artistName )
    const theMessage = 'Now playing ' + state.nowPlaying.song.trackName + ' by ' + state.nowPlaying.song.artistName
    await chatFunctions.botSpeak( theMessage )
  }
  roomFunctions.setDJCount( state.djs.length ); //the number of djs on stage
  
  await roomFunctions.pickRandomizerTriggerDJ( userFunctions );
  
  // bot votes, after 30 seconds in case a skip is needed
  await new Promise( resolve => {
    setTimeout( async () => {
      await botFunctions.upVote( socket )
      resolve();
    }, 30 * 1000 );
  } );
}
