import { logger } from "../utils/logging.js";
import { ActionName } from "ttfm-socket";
import roomDefaults from "../defaults/roomDefaults.js";

export default async ( payload, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions, socket ) => {
  logger.debug( `================== playedSong ====================` )

  // end song
  let djID;
  if ( payload.nowPlaying && payload.nowPlaying.song ) {
    console.log(JSON.stringify(payload.nowPlaying.song, null, 2))
    djID = payload.djs[ 0 ].uuid;
    await songFunctions.grabSongStats();
    await userFunctions.setCurrentDJID( djID, databaseFunctions );
    const videoID = payload.nowPlaying.song.songShortId
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

    if ( payload.nowPlaying.song ) {
      songFunctions.getSongTags( payload )
      await databaseFunctions.saveTrackData( djID, payload.nowPlaying.song );
    }

    await userFunctions.setPreviousDJID( djID );
    songFunctions.setPreviousTrack( payload.nowPlaying.song.trackName )
    songFunctions.setPreviousArtist( payload.nowPlaying.song.artistName )
    const theMessage = 'Now playing ' + payload.nowPlaying.song.trackName + ' by ' + payload.nowPlaying.song.artistName
    await chatFunctions.botSpeak( theMessage )
  }
  roomFunctions.setDJCount( payload.djs.length ); //the number of djs on stage
  
  // bot votes, after 30 seconds in case a skip is needed
  await new Promise( resolve => {
    setTimeout( async () => {
      await botFunctions.upVote( socket )
      resolve();
    }, 30 * 1000 );
  } );
}
