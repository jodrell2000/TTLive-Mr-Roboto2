import axios from "axios";

const playlistFunctions = ( ) => {
  return {

    getPlaylists: async function ( data, chatFunctions ) {
      const url = `https://playlists.prod.tt.fm/crate/user?limit=0&offset=0`;
      const headers = {
        'accept': 'application/json',
        'Authorization': `Bearer ${process.env.TTL_USER_TOKEN}`
      };

      try {
        const { data } = await axios.get(url, { headers });
        console.log(JSON.stringify(data, null, 2));
      } catch (error) {
        console.error( `Error calling get api...error:\n${JSON.stringify(error,null,2)}\nurl:${url}` );
        throw error;
      }
    },

    createPlaylist: async function ( data, playlistName, chatFunctions ) {
      const payload = {
        "crateName": playlistName,
        "isPublic": true
      };
      const url = "https://playlists.prod.tt.fm/crate"

      const headers = {
        'accept': 'application/json',
        'Authorization': `Bearer ${ process.env.TTL_USER_TOKEN }`
      };
      
      try {
        await axios.post(url, payload, { headers })
        await chatFunctions.botSpeak( `Playlist ${ playlistName} created` )

      } catch ( error ) {
        console.error( `Error calling post api...error:\n${JSON.stringify(error,null,2)}\nurl:${url}\npayload:${JSON.stringify(payload,null,2)}` );
        throw error;
      }
    },
  }
}

export default playlistFunctions;