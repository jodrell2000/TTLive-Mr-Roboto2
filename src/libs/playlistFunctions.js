const playlistFunctions = ( ) => {
  return {

    getPlaylists: async function ( data, chatFunctions ) {
      await chatFunctions.botSpeak( "Here" )    
    }
    
  }
}

export default playlistFunctions;