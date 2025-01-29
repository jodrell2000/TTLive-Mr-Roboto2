import axios from 'axios';

const mlFunctions = () => {
  return {
    askGoogleAI: async function( theQuestion, chatFunctions ) {
      // const theQuestion = `In 100 words or less, tell me something interesting about ${ track } byt ${ artist }`;
      // console.log(theQuestion)
      const apiKey = process.env.googleAIKey;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

      // Prepare the payload
      const payload = {
        contents: [
          {
            parts: [
              {
                text: theQuestion
              }
            ]
          }
        ]
      };

      try {
        const response = await axios.post(url, payload, {
          headers: { 'Content-Type': 'application/json' }
        });

        // Extract the text from the response
        const theResponse = response.data.candidates[0]?.content?.parts[0]?.text || 'No response text available';
        if ( theResponse !== 'No response text available' ) {
          return theResponse;
        } else {
          await chatFunctions.botSpeak( 'Nope, I got nothing...sorry' )
        }

      } catch (error) {
        console.error('Error fetching content:', error.message);
        return 'Error occurred';
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
      const theQuestion = `If I were DJing, tell me one song to follow "${ playingTrack }", by "${ playingArtist }". Return your answer as JSON with two elements called artist and song. If you can't find anything return the JSON with two null values`
      return await this.askGoogleAI( theQuestion )
    },
  }
}

export default mlFunctions;

