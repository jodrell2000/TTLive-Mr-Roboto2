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
          await chatFunctions.botSpeak( theResponse )
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
      await this.askGoogleAI( theQuestion, chatFunctions )
    },

    whatYear: async function( songFunctions, chatFunctions ) {
      const track = songFunctions.previousTrack()
      const artist = songFunctions.previousArtist()
      const theQuestion = `In what year was the song ${ track } by ${ artist } released?`
      await this.askGoogleAI( theQuestion, chatFunctions )
    }
  }
}

export default mlFunctions;
