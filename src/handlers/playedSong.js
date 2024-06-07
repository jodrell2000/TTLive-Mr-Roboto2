import { postMessage } from '../libs/cometchat.js'
import { logger } from "../utils/logging.js";
import roomDefaults from "../defaults/roomDefaults.js";
import { ActionName } from "ttfm-socket";
// import { getTrackFact } from '../libs/ai.js'
// let merchCount = 0
// let songDetailCount = 0

export default async ( data, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, socket ) => {
  logger.debug( `================== playedSong start ====================` )
  // console.log( `playedSong data: ${ JSON.stringify( data, null, 2) }` )
  await userFunctions.setPreviousDJID( await userFunctions.getCurrentDJID() )

  let djID;

  if ( data.djs.length > 0 ) {
    djID = data.djs[0].uuid;

    await userFunctions.setCurrentDJID( djID )
    let previousDJName
    
    if ( await userFunctions.getPreviousDJID() ) {
      previousDJName = await userFunctions.getUsername( await userFunctions.getPreviousDJID() )
    } else {
      previousDJName = "Just"
    }
    const previousArtist = songFunctions.previousArtist()
    const previousTrack = songFunctions.previousTrack()
    console.log('playedSong previousArtist: ' + previousArtist)
    console.log('playedSong previousTrack:' + previousTrack)
    if ( previousArtist && previousTrack ) {
      let snags = data.voteCounts.stars ?? 0

      const previousMessage = `${ previousDJName } played...
      ${ previousTrack } by ${ previousArtist }
      Stats: 👍 ${ songFunctions.upVotes() } 👎 ${ songFunctions.downVotes() } ❤️ ${ snags }`
      await chatFunctions.botSpeak( previousMessage, data )
    }
    
    if ( data.nowPlaying && data.nowPlaying.song ) {
      songFunctions.setPreviousTrack( data.nowPlaying.song.trackName )
      songFunctions.setPreviousArtist( data.nowPlaying.song.artistName )
      const theMessage = 'Now playing ' + data.nowPlaying.song.trackName + ' by ' + data.nowPlaying.song.artistName
      await chatFunctions.botSpeak( theMessage, data )
    }
  }

  // songFunctions.resetVoteCountSkip();
  // songFunctions.resetVotesLeft( roomDefaults.HowManyVotesToSkip );
  await songFunctions.resetUpVotes();
  await songFunctions.resetDownVotes();
  await songFunctions.resetSnagCount();
  // songFunctions.resetVoteSnagging();
  botFunctions.clearAllTimers( userFunctions, roomFunctions, songFunctions );
  if ( data.nowPlaying ) {
    songFunctions.getSongTags( data )
  }
  roomFunctions.setDJCount( data.djs.length ); //the number of djs on stage

  // socket.action( ActionName.voteOnSong, { roomUuid: process.env.ROOM_UUID, userUuid: process.env.USERID, songVotes: { likes: true } }  )
  
  logger.debug( `================== playedSong end ====================` )
}
