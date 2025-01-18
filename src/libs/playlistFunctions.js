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
      await chatFunctions.botSpeak( `Playlists are ${ await this.getPlaylistNames() }` )
    },
    
    // ========================================================
    // Playlist Management Functions
    // ========================================================

    getPlaylistData: async function ( ) {
      const url = `https://playlists.prod.tt.fm/crate/user?limit=0&offset=0`;
      try {
        const { data: responseData } = await axios.get(url, { headers });
        console.log(`responseData: ${JSON.stringify(responseData, null, 2)}`);
        return responseData;

      } catch (error) {
        console.error( `Error calling get api...error:\n${JSON.stringify(error,null,2)}\nurl:${url}` );
        throw error;
      }
    },
    
    getPlaylistNames: async function ( ) {
      const playlistData = await this.getPlaylistData()
      const playlistNames = playlistData.crates.map(crate => crate.crateName);
      console.log( `playlistNames: ${playlistNames}` );
      return playlistNames;
    },
    
    getPlaylistUuid: async function ( playlistName ) {
      const playlistData = await this.getPlaylistData()
      return playlistData.crates.find(crate => crate.crateName === playlistName)?.crateUuid;
    },
    
    doesPlaylistExist: async function( thePlaylistName, chatFunctions ) {
      try {
        const playlistData = await this.getPlaylistData();
        const playlistNames = playlistData.crates.map(crate => crate.crateName);
        console.log(`playlists: ${JSON.stringify(playlistNames, null, 2)}`);
        if ( playlistNames.includes(thePlaylistName) ) {
          await chatFunctions.botSpeak( `Playlist exists` )
        } else {
          await chatFunctions.botSpeak( `Playlist not found` )
        }
        return playlistNames.includes(thePlaylistName);

      } catch (error) {
        console.error(`Error checking if playlist exists: ${error.message}`);
        throw error;
      }
    },
    
    deletePlaylist: async function( thePlaylistName, chatFunctions ) {
      if ( await this.doesPlaylistExist( thePlaylistName, chatFunctions ) ) {
        const playlistUuid = this.getPlaylistUuid( thePlaylistName )
        const url = `https://playlists.prod.tt.fm/crate/${ playlistUuid }`;
        await axios.delete(url, { headers });
        await chatFunctions.botSpeak( `Playlist deleted` )
      } else {
        await chatFunctions.botSpeak( `Playlist doesn't exist` )
      }
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