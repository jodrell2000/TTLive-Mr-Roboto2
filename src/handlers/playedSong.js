import { postMessage } from '../libs/cometchat.js'
import { logger } from "../utils/logging.js";
import roomDefaults from "../defaults/roomDefaults.js";
import { ActionName } from "ttfm-socket";
// import { getTrackFact } from '../libs/ai.js'
// let merchCount = 0
// let songDetailCount = 0

export default async ( payload, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions, connection ) => {
  logger.debug( `================== playedSong start ====================` )
  // console.log( `playedSong payload: ${ JSON.stringify( payload, null, 2) }` )
  await userFunctions.setPreviousDJID( await userFunctions.getCurrentDJID() )

  let djID;

  if ( payload.djs.length > 0 ) {
    djID = payload.djs[0].uuid;

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
      let snags = payload.voteCounts.stars ?? 0

      const previousMessage = `${ previousDJName } played...
      ${ previousTrack } by ${ previousArtist }
      Stats: 👍 ${ songFunctions.upVotes() } 👎 ${ songFunctions.downVotes() } ❤️ ${ snags }`
      await chatFunctions.botSpeak( previousMessage, payload )
    }
    
    if ( payload.nowPlaying && payload.nowPlaying.song ) {
      songFunctions.setPreviousTrack( payload.nowPlaying.song.trackName )
      songFunctions.setPreviousArtist( payload.nowPlaying.song.artistName )
      const theMessage = 'Now playing ' + payload.nowPlaying.song.trackName + ' by ' + payload.nowPlaying.song.artistName
      await chatFunctions.botSpeak( theMessage, payload )
    }
  }

  // songFunctions.resetVoteCountSkip();
  // songFunctions.resetVotesLeft( roomDefaults.HowManyVotesToSkip );
  await songFunctions.resetUpVotes();
  await songFunctions.resetDownVotes();
  await songFunctions.resetSnagCount();
  // songFunctions.resetVoteSnagging();
  botFunctions.clearAllTimers( userFunctions, roomFunctions, songFunctions );
  if ( payload.nowPlaying ) {
    songFunctions.getSongTags( payload )
  }
  roomFunctions.setDJCount( payload.djs.length ); //the number of djs on stage
  
  console.log( `connection: ${ JSON.stringify( connection, null, 2 ) }` )
  
  await connection.voteOnSong( { roomUuid: process.env.ROOM_UUID, userUuid: process.env.USERID, songVotes: { likes: true } } )

  // await socket.action( ActionName.voteOnSong, { roomUuid: process.env.ROOM_UUID, userUuid: process.env.USERID,
  // songVotes: { likes: true } }  )
  
  logger.debug( `================== playedSong end ====================` )
}
