import { postMessage } from '../libs/cometchat.js'
import { logger } from "../utils/logging.js";
import roomDefaults from "../defaults/roomDefaults.js";
// import { getTrackFact } from '../libs/ai.js'
// let merchCount = 0
// let songDetailCount = 0

export default async ( data, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions ) => {
  logger.debug( `================== playedSong start ====================` )
  logger.debug( `payload: ${ JSON.stringify( data ) }` )
  logger.debug( `================== playedSong end ====================` )

  songFunctions.resetVoteCountSkip();
  songFunctions.resetVotesLeft( roomDefaults.HowManyVotesToSkip );
  songFunctions.resetUpVotes();
  songFunctions.resetDownVotes();
  songFunctions.resetSnagCount();
  songFunctions.resetVoteSnagging();
  botFunctions.clearAllTimers( userFunctions, roomFunctions, songFunctions );
  if ( data.nowPlaying ) {
    songFunctions.getSongTags( data )
  }
  roomFunctions.setDJCount( data.djs.length ); //the number of djs on stage
  
  let djID;

  if ( data.djs.length > 0 ) {
    djID = data.djs[0].uuid;
    await userFunctions.setPreviousDJID( userFunctions.getCurrentDJID() )
    await userFunctions.setCurrentDJID( djID );
  
    if ( userFunctions.getPreviousDJID() ) {
      const previousDJName = await userFunctions.getUsername( userFunctions.getPreviousDJID() )
      const previousArtist = songFunctions.previousArtist()
      const previousTrack = songFunctions.previousTrack()
      if ( previousDJName && previousArtist && previousTrack ) {
        const previousMessage = `${ previousDJName } played...\n${ previousTrack } by ${ previousArtist }`
        await chatFunctions.botSpeak( previousMessage, data )
      }
    }
  }


  if ( data.nowPlaying && data.nowPlaying.song ) {
    songFunctions.setPreviousTrack( data.nowPlaying.song.trackName )
    songFunctions.setPreviousArtist( data.nowPlaying.song.artistName )
    if ( data.djs.length > 0 ) {
      userFunctions.setPreviousDJID( djID )
    }
    const theMessage = 'Now playing ' + data.nowPlaying.song.trackName + ' by ' + data.nowPlaying.song.artistName
    await chatFunctions.botSpeak( theMessage, data )
  }
}

  // if (songDetailCount++ > process.env.ANNOUNCE_SONG_DETAILS_COUNT) {
  //   songDetailCount = 0
  //   if (payload?.nowPlaying?.song?.artistName?.toLowerCase().includes(process.env.FAVOURITE_ARTIST.toLowerCase())) {
  //     // const reply = await getTrackFact(`${payload.nowPlaying.song.trackName} by ${payload.nowPlaying.song.artistName}`)
  //     let messageSuffix = ''
  //     if (merchCount++ > process.env.MERCH_MESSAGE_RANDOM_SONG_COUNT) {
  //       merchCount = 0
  //       if (Math.floor(Math.random() * 2) === 1) {
  //         messageSuffix = process.env.MERCH_MESSAGE_RANDOM
  //       }
  //     }
  //     // if (reply?.length > 0) {
  //     //   await postMessage({
  //     //     room,
  //     //     message: `Great song. Let me tell you a little about it! ${messageSuffix}`
  //     //   })
  //     //   const responses = reply.split('\n')
  //     //   for (const item in responses) {
  //     //     const response = responses[item].trim()
  //     //     if (response.length > 0) {
  //     //       await postMessage({
  //     //         room,
  //     //         message: response
  //     //       })
  //     //     }
  //     //   }
  //     // }
  //   }
  // }

