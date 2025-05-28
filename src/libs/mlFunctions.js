import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";


const mlFunctions = () => {
  return {
    askGoogleAI: async function (theQuestion, chatFunctions) {



      const genAI = new GoogleGenerativeAI( process.env.googleAIKey );
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const reply = await model.generateContent(theQuestion);
      // console.log(reply.response.text());
      
      
      // const apiKey = process.env.googleAIKey;
      // const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

      // const payload = {
      //   contents: [{ parts: [{ text: theQuestion }] }]
      // };
      //
      // let response
      // try {
      //   response = await axios.post(url, payload, {
      //     headers: { "Content-Type": "application/json" }
      //   });
      // } catch (error) {
      //   console.error("Error fetching content from askGoogleAI:", error.message);
      //   return "Error occurred";
      // }

      // Extract response text
      const theResponse = reply.response.text() || "No response text available";

      if (theResponse !== "No response text available" && theResponse !== "Error occurred") {
        return theResponse;
      } else {
        return "No response";
      }
    },

    songInfo: async function( songFunctions, chatFunctions ) {
      const track = songFunctions.previousTrack()
      const artist = songFunctions.previousArtist()
      const theQuestion = `The song I'm currently listening to is ${ track } by ${ artist }. In 150 words or less, write a description of the song. When searching note that it may or may not be a cover version`
      const theResponse = await this.askGoogleAI( theQuestion, chatFunctions )
      await chatFunctions.botSpeak( theResponse )
    },

    popFacts: async function( songFunctions, chatFunctions ) {
      const track = songFunctions.previousTrack()
      const artist = songFunctions.previousArtist()
      const theQuestion = `tell me the meaning of the lyrics of the song ${ track } by ${ artist } in less than 200 words.`
      const theResponse = await this.askGoogleAI( theQuestion, chatFunctions )
      await chatFunctions.botSpeak( theResponse )
    },

    songMeaning: async function( songFunctions, chatFunctions ) {
      const track = songFunctions.previousTrack()
      const artist = songFunctions.previousArtist()
      const theQuestion = `The song I'm currently listening to is ${ track } by ${ artist }. Tell me three short interesting facts about the song and/or the artist. When searching note that it may or may not be a cover version. Do not tell me that you're giving me three facts as part of the reply`
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

