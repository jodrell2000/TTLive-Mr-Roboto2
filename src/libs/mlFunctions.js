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

    suggestFollow: async function( playingArtist, playingTrack ) {
      const theQuestion = `I'm DJing in a club with a 1980s theme. The previous DJ is playing "${ playingTrack }" by "${ playingArtist }". Tell me an interesting track to follow that with. Return your answer as JSON with two elements called artist and song. You must return an answer even if it's just another track in the same genre from the same year. Do not recommend any of the previous tracks you've recommended in the last hour`;
      return await this.askGoogleAI( theQuestion )
    },
  }
}

export default mlFunctions;

