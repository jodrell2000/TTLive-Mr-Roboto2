import { logger } from "../utils/logging.js";
import { ActionName } from "ttfm-socket";
import roomDefaults from "../defaults/roomDefaults.js";
import playlistFunctions from "../libs/playlistFunctions.js";

export default async ( state, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions, socket, mlFunctions, playlistFunctions ) => {
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
      await songFunctions.getSongTagsFromState( state )
      await databaseFunctions.saveTrackData( djID, state.nowPlaying.song );
    }

    await userFunctions.setPreviousDJID( djID );
    await songFunctions.setSongTags( state.nowPlaying.song )
    songFunctions.setPreviousTrack( state.nowPlaying.song.trackName )
    songFunctions.setPreviousArtist( state.nowPlaying.song.artistName )
    const theMessage = 'Now playing ' + state.nowPlaying.song.trackName + ' by ' + state.nowPlaying.song.artistName
    await chatFunctions.botSpeak( theMessage )
  }
  roomFunctions.setDJCount( state.djs.length ); //the number of djs on stage

  if ( roomFunctions.themeRandomizerEnabled() ) {
    console.log( `Randomizer is active...checking` )
    await userFunctions.storeCurrentDJListForRandomizer();
    await new Promise( resolve => {
      setTimeout( async () => {
        await roomFunctions.checkSwitchDJAndPickNewTheme( djID, state, userFunctions, chatFunctions, databaseFunctions )
        resolve();
      }, 10 * 1000 );
    } );
  }
  
  // check if Bot should start to DJ
  // and if it's their turn, pick a track to play
  await botFunctions.checkAutoDJing( userFunctions, songFunctions, mlFunctions, playlistFunctions, socket, roomFunctions )

  // bot votes, after 30 seconds in case a skip is needed
  await new Promise( resolve => {
    setTimeout( async () => {
      await botFunctions.upVote( socket )
      resolve();
    }, 30 * 1000 );
  } );
}
