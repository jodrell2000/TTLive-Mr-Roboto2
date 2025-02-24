import axios from 'axios';

const mlFunctions = () => {
  return {
    askGoogleAI: async function (theQuestion, chatFunctions) {
      const apiKey = process.env.googleAIKey;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

      const payload = {
        contents: [{ parts: [{ text: theQuestion }] }]
      };

      let response
      try {
        response = await axios.post(url, payload, {
          headers: { "Content-Type": "application/json" }
        });
      } catch (error) {
        console.error("Error fetching content from askGoogleAI:", error.message);
        return "Error occurred";
      }

      // Extract response text
      const theResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No response text available";

      if (theResponse !== "No response text available" && theResponse !== "Error occurred") {
        return theResponse;
      } else {
        return "No response";
      }
    },

    songInfo: async function( songFunctions, chatFunctions ) {
      const track = songFunctions.previousTrack()
      const artist = songFunctions.previousArtist()
      const theQuestion = `In 100 words or less, tell me about the song ${ track } by ${ artist }`
      const theResponse = await this.askGoogleAI( theQuestion, chatFunctions )
      await chatFunctions.botSpeak( theResponse )
    },

    whatYear: async function( songFunctions, chatFunctions ) {
      const track = songFunctions.previousTrack()
      const artist = songFunctions.previousArtist()
      const theQuestion = `In what year was the song ${ track } by ${ artist } released?`
      const theResponse = await this.askGoogleAI( theQuestion, chatFunctions )
      await chatFunctions.botSpeak( theResponse )
    },


    whatDecade: async function( songFunctions, chatFunctions ) {
      const track = songFunctions.previousTrack()
      const artist = songFunctions.previousArtist()
      const theQuestion = `Using only two digits, in what decade was the original version of ${ track } by ${ artist } released?`
      return await this.askGoogleAI( theQuestion, chatFunctions )
    },

    coverOrOriginal: async function( songFunctions, chatFunctions ) {
      const track = songFunctions.previousTrack()
      const artist = songFunctions.previousArtist()
      const theQuestion = `Answering with one word, either cover or original, is ${ track } by ${ artist } a cover or an original song?`
      return await this.askGoogleAI( theQuestion, chatFunctions )
    },

    suggestFollow: async function( playingArtist, playingTrack, roomFunctions, previousPlays = null ) {
      console.group(`suggestFollow`);

      const theTheme = roomFunctions.theme()
      let theQuestion = `I'm DJing as part of a group.`
      
      if ( theTheme != false ) {
        theQuestion += ` The theme is ${ theTheme }.`
      }

      if ( Array.isArray(previousPlays) && previousPlays.length > 0 ) {
        const previousTracks = previousPlays.map(play => `"${play.song}" by "${play.artist}"`).join(", ");
        theQuestion += ` The previous ${previousPlays.length} plays were ${previousTracks}.`;
      }

      theQuestion += ` Tell me an interesting track to play next. Return your answer as JSON with two elements called artist and song. You must return an answer`;
      console.log(`theQuestion: ${theQuestion}`);
      console.groupEnd()
      return await this.askGoogleAI( theQuestion )
    },
  }
}

export default mlFunctions;

