import axios from "axios";
import { logger } from '../utils/logging.js'

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
        const playlistUuid = await this.getPlaylistUuid( thePlaylistName )
        const url = `https://playlists.prod.tt.fm/crate/${ playlistUuid }`;
        await axios.delete(url, { headers });
        await chatFunctions.botSpeak( `Playlist deleted` )
      } else {
        await chatFunctions.botSpeak( `Playlist doesn't exist` )
      }
    },

    createPlaylist: async function ( playlistName, chatFunctions ) {
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

    addTrackToPlaylist: async function( data, songFunctions, chatFunctions ) {
      const crateUuid = "17a477bf-df68-428d-9660-de5ae9137d25"
      const songId = songFunctions.songID
      console.log( `songFunctions.songID: ${ songId }`)
      
      const url = `https://playlists.prod.tt.fm/crate/${ crateUuid }/songs`
      const payload = {
        songs: [
          {
            songId: songId
          }
        ],
        append: true
      };
      await axios.post(url, payload, { headers })
    },

    deleteTrackFromPlaylist: async function( playlistName ) {

    },

    // ========================================================
    // Queue Functions
    // ========================================================

    returnQueueCrateUUID: async function() {
      const url = `https://gateway.prod.tt.fm/api/playlist-service/crate/special/queue`;
      try {
        const { data: responseData } = await axios.get(url, { headers });
        return responseData.crateUuid;
      } catch (error) {
        console.error(`Error getting queue crate UUID: ${error.message}`);
        throw error;
      }
    },
    
    addSongToQueue: async function( songData ) {
      const providerKey = Object.keys(songData.musicProviders)[0]; // "sevenDigital"
      const providerID = songData.musicProviders[providerKey]; // "76753480"

      const queueCrateUUID = await this.returnQueueCrateUUID();
      const url = `https://gateway.prod.tt.fm/api/playlist-service/api/v1/playlists/${queueCrateUUID}/tracks`

      const payload = {
        songs: [
          {
            "songId": providerID,
            "append": false
          }
        ],
      }

      // const payload = {
      //   songs: [
      //     {
      //       "musicProvider": providerKey,
      //       "songId": providerID,
      //       "artistName": songData.artistName,
      //       "trackName": songData.trackName,
      //       "duration": songData.duration,
      //       "isrc": songData.isrc,
      //       "genre": songData.genre,
      //       "playbackToken": songData.playbackToken,
      //       "explicit": songData.explicit
      //     }
      //   ],
      //   "append": false
      // }

      await axios.post(url, payload, { headers })
    },

    clearQueue: async function( playlistName ) {
      
    },
    
    addPlaylistToQueue: async function( playlistName ) {
      
    },
    
    randomiseQueue: async function(  ) {
      
    },
    
    // ========================================================
    // Search Functions
    // ========================================================

    findTracks: async function (artistName, trackName) {
      let attempts = 0;
      const maxAttempts = 3;
      const delay = 10000; // 10 seconds

      while (attempts < maxAttempts) {
        try {
          const searchString = `${trackName} ${artistName}`;
          const url = `https://playlists.prod.tt.fm/search?q=${encodeURIComponent(searchString)}`;

          console.log(`Attempt ${attempts + 1}: Fetching ${url}`);

          const { data: responseData } = await axios.get(url, { headers });
          return responseData; // Success! Return the data

        } catch (error) {
          console.error(`Error in findTracks (attempt ${attempts + 1}):`, error.message);

          if (error.response) {
            console.error("Response data:", error.response.data);
            console.error("Status code:", error.response.status);
          } else if (error.request) {
            console.error("No response received:", error.request);
          }

          attempts++;

          if (attempts < maxAttempts) {
            console.log(`Retrying in ${delay / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay)); // Wait before retrying
          } else {
            console.error("Max retries reached. Unable to find tracks.");
            return null; // Failure after 3 attempts
          }
        }
      }
    }
  }
}

export default playlistFunctions;