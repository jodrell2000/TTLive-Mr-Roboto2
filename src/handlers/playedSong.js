import { logger } from "../utils/logging.js";
import { ActionName } from "ttfm-socket";
import roomDefaults from "../defaults/roomDefaults.js";

export default async ( payload, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions, socket ) => {
  logger.debug( `================== playedSong ====================` )
  //await userFunctions.setPreviousDJID( await userFunctions.getCurrentDJID() )

  // end song
  let djID;
  if ( payload.nowPlaying && payload.nowPlaying.song ) {
    djID = payload.djs[ 0 ].uuid;
    await songFunctions.grabSongStats();
    await userFunctions.setCurrentDJID( djID )
    const videoID = payload.nowPlaying.song.songShortId
    await chatFunctions.readSongStats( videoID, songFunctions, botFunctions, databaseFunctions, userFunctions );
    await databaseFunctions.saveLastSongStats( songFunctions );
    await userFunctions.incrementDJPlayCount( djID, databaseFunctions );

  // await userFunctions.removeDJsOverPlaylimit( data, chatFunctions, djID );
  // await roomFunctions.escortDJsDown( data, djID, botFunctions, userFunctions, chatFunctions, databaseFunctions );

  // new song

    await songFunctions.resetVoteCountSkip();
    await songFunctions.resetVotesLeft( roomDefaults.HowManyVotesToSkip );
    await songFunctions.resetUpVotes();
    await songFunctions.resetDownVotes();
    await songFunctions.resetSnagCount();
    await songFunctions.resetVoteSnagging();
    await botFunctions.clearAllTimers( userFunctions, roomFunctions, songFunctions, chatFunctions );

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
      await socket.action( ActionName.voteOnSong, {
        roomUuid: process.env.ROOM_UUID,
        userUuid: process.env.USERID,
        songVotes: { like: true }
      } );
      resolve();
    }, 30 * 1000 );
  } );
}
