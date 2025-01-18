import axios from "axios";

const headers = {
  'accept': 'application/json',
  'Authorization': `Bearer ${process.env.TTL_USER_TOKEN}`
};

const playlistFunctions = ( ) => {
  return {

    // ========================================================
    // Playlist Commands
    // ========================================================

    listPlaylists: async function ( data, chatFunctions ) {
      await chatFunctions.botSpeak( `Playlists are ${ await this.getPlaylists() }` )
    },
    
    // ========================================================
    // Playlist Management Functions
    // ========================================================

    getPlaylists: async function ( ) {
      const url = `https://playlists.prod.tt.fm/crate/user?limit=0&offset=0`;
      try {
        const { data: responseData } = await axios.get(url, { headers });
        console.log(`responseData: ${JSON.stringify(responseData, null, 2)}`);
        return  responseData.crates.map(crate => crate.crateName);

      } catch (error) {
        console.error( `Error calling get api...error:\n${JSON.stringify(error,null,2)}\nurl:${url}` );
        throw error;
      }
    },
    
    doesPlaylistExist: async function( playlistName, chatFunctions ) {
      try {
        const playlists = await this.getPlaylists();
        console.log(`playlists: ${JSON.stringify(playlists, null, 2)}`);
        if ( playlists.includes(playlistName) ) {
          await chatFunctions.botSpeak( `Playlist exists` )
        } else {
          await chatFunctions.botSpeak( `Playlist not found` )
        }
        return playlists.includes(playlistName);

      } catch (error) {
        console.error(`Error checking if playlist exists: ${error.message}`);
        throw error;
      }
    },
    
    deletePlaylist: async function( playlistName, chatFunctions ) {
      
    },

    createPlaylist: async function ( data, playlistName, chatFunctions ) {
      const url = "https://playlists.prod.tt.fm/crate"
      const payload = {
        "crateName": playlistName,
        "isPublic": true
      };
      
      try {
        await axios.post(url, payload, { headers })
        await chatFunctions.botSpeak( `Playlist ${ playlistName} created` )

      } catch ( error ) {
        console.error( `Error calling post api...error:\n${JSON.stringify(error,null,2)}\nurl:${url}\npayload:${JSON.stringify(payload,null,2)}` );
        throw error;
      }
    },

    // ========================================================
    // Playlist Track Management Functions
    // ========================================================

    isTrackInPlaylist: async function( playlistName ) {

    },

    addTrackToPlaylist: async function( playlistName ) {

    },

    deleteTrackFromPlaylist: async function( playlistName ) {

    },

    // ========================================================
    // Playlist Queue Functions
    // ========================================================

    clearQueue: async function( playlistName ) {
      
    },
    
    addPlaylistToQueue: async function( playlistName ) {
      
    },
    
    randomiseQueue: async function(  ) {
      
    },
  }
}

export default playlistFunctions;