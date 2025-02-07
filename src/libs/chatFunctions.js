import botDefaults from '../defaults/botDefaults.js'
import roomDefaults from '../defaults/roomDefaults.js'
import userMessages from '../defaults/customGreetings.js'
import Storage from 'node-storage';
import { dirname } from 'path';

import { postMessage } from './cometchat.js'
import { logger } from "../utils/logging.js";

const chatDataFileName = process.env.CHATDATA; 
const room = process.env.ROOM_UUID;

const chatFunctions = ( ) => {
  return {

    data: async function ( data ) {
      console.log(`data: ${JSON.stringify(data, null, 2)}`);
    },

    botSpeak: async function ( message, publicChat, recipient ) {
      // let pmCommand;

      // if ( recipient === undefined && data !== null ) {
      //   if ( data.command === "pmmed" ) {
      //     pmCommand = true;
      //     recipient = data.senderid;
      //   }
      // }

      // if ( pmCommand === true && publicChat === undefined ) {
      //   await this.botPM( message, recipient );
      // } else {
      //   await this.botChat( message ).then();
      // }
      await this.botChat( message ).then();
    },

    botSpeakPicture: async function ( theMessage, theImage ) {
      return await postMessage( {
        room,
        message: theMessage,
        images: theImage
      } )
    },
    
    botChat: async function ( message ) {
      return await postMessage( {
        room,
        message: message
      } )
    },

    botPM: async function ( message, user ) {
      bot.pm( message, user );
    },

    buildUserToUserRandomMessage: async function ( userFunctions, senderID, theMessage, receiverID ) {
      const senderUsername = await userFunctions.getUsername( senderID );
      if ( senderUsername ) {
        theMessage = theMessage.replace( "@senderUsername", "@" + senderUsername );
      }

      const receiverUsername = await userFunctions.getUsername( receiverID );
      if ( receiverUsername ) {
        theMessage = theMessage.replace( "@receiverUsername", "@" + receiverUsername );
      }

      return theMessage
    },

    // ========================================================

    // ========================================================
    // Misc chat functions
    // ========================================================

    suggestFollow: async function( mlFunctions, songFunctions, roomFunctions ) {
      let replyJSON = await mlFunctions.suggestFollow( songFunctions.artist, songFunctions.song, roomFunctions );
      
      if (typeof replyJSON === "string") {
        try {
          // Remove Markdown-style backticks if present
          replyJSON = replyJSON.replace(/```json|```/g, "").trim();

          // Parse cleaned JSON
          replyJSON = JSON.parse(replyJSON);
        } catch (error) {
          console.error("Failed to parse replyJSON:", error);
          return;
        }
      }

      await this.botSpeak( `How about playing ${ replyJSON.song } by ${ replyJSON.artist }.`);
    },

    isThereADJ: async function ( userFunctions, data ) {
      const receiverID = await userFunctions.getCurrentDJID( data );
      const senderID = await userFunctions.whoSentTheCommand( data );

      if ( receiverID === null ) {
        await this.botSpeak( "@" + await userFunctions.getUsername( senderID ) + " you can't send the DJ a message if" +
          " there's no DJ?!?", true );
        return false;
      } else {
        return true;
      }
    },

    textMessageTheDJ: async function ( senderID, receiverID, messageArray, data, userFunctions ) {
      if ( await this.isThereADJ( userFunctions, data ) ) {
        const randomMessage = messageArray[ Math.floor( Math.random() * messageArray.length ) ];
        const thisMessage = await this.buildUserToUserRandomMessage( userFunctions, senderID, randomMessage, receiverID );

        await this.botSpeak( thisMessage, true );
      }
    },

    pictureMessageTheDJ: async function ( senderID, receiverID, messageArray, pictureArray, data, userFunctions ) {
      if ( await this.isThereADJ( userFunctions, data ) ) {
        const randomMessage = messageArray[ Math.floor( Math.random() * messageArray.length ) ];
        const randomPic = [pictureArray[ Math.floor( Math.random() * pictureArray.length ) ] ];
        const thisMessage = await this.buildUserToUserRandomMessage( userFunctions, senderID, randomMessage, receiverID );

        await this.botSpeakPicture( thisMessage, randomPic );
      }
    },

    dynamicChatCommand: async function ( data, userFunctions, theCommand, databaseFunctions ) {
      if ( await this.isThereADJ( userFunctions, data ) ) {
        const receiverID = await userFunctions.getCurrentDJID( data );
        const senderID = await userFunctions.whoSentTheCommand( data );

        let thePictures = await this.getDynamicChatPictures( theCommand );
        let theMessages = await this.getDynamicChatMessages( theCommand );
        if ( thePictures === undefined || thePictures.length === 0 ) {
          await this.textMessageTheDJ( senderID, receiverID, theMessages, data, userFunctions )
        } else {
          await this.pictureMessageTheDJ( senderID, receiverID, theMessages, thePictures, data, userFunctions )
        }

        this.countThisCommand( databaseFunctions, theCommand )
          .then( async ( countThisCommand ) => {
            if ( countThisCommand !== -1 && receiverID !== senderID ) {
              await userFunctions.updateCommandCount( receiverID, theCommand, databaseFunctions );
            }
          } )
      }
    },

    countThisCommand: function ( databaseFunctions, theCommand ) {
      return databaseFunctions.commandsToCount()
        .then( ( commands ) => {
          return commands.indexOf( theCommand );
        } )
    },

    getDynamicChatMessages: async function ( theCommand ) {
      const store = await this.getChatCommandData();
      return store.get( `chatMessages.${ theCommand }.messages` );
    },

    getDynamicChatPictures: async function ( theCommand ) {
      const store = await this.getChatCommandData();
      return store.get( `chatMessages.${ theCommand }.pictures` );
    },

    getDynamicChatCommands: async function () {
      const store = await this.getChatCommandData();
      return store.get( 'chatMessages' );
    },

    getChatCommandData: async function () {
      return this.returnStore( chatDataFileName );
    },

    returnStore: async function ( filename ) {
      const dataFilePath = `${ dirname( import.meta.url.replace( 'file://', '' ) ) }/../../data/${ filename }`;
      return new Storage( dataFilePath );
    },

    // ========================================================

    // ========================================================
    // Chat command functions
    // ========================================================

    multilineChatCommand: function ( data, messageVariable, pictureVariable ) {
      const sleep = ( delay ) => new Promise( ( resolve ) => setTimeout( resolve, delay ) )
      let randomMessageNumber = Math.ceil( Math.random() * messageVariable.length ) - 1;

      const readInOrder = async () => {
        for ( let messageLoop = 0; messageLoop < messageVariable[ randomMessageNumber ].length; messageLoop++ ) {
          await this.botSpeak( messageVariable[ randomMessageNumber ][ messageLoop ][ 0 ] );
          await sleep( messageVariable[ randomMessageNumber ][ messageLoop ][ 1 ] )
        }

        const randomPic = [ pictureVariable[ Math.floor( Math.random() * pictureVariable.length ) ] ];
        await this.botSpeakPicture( "",randomPic );
      }
      readInOrder().then( );
    },

    coinflip: async function ( data ) {
      const theUsername = data.senderName
      let randomNumber = Math.random();
      if ( randomNumber === 0.5 ) {
        await this.botSpeak( '@' + theUsername + ' I am flipping a coin. You got...an edge?!?', true );
      } else {
        let y = Math.ceil( randomNumber * 2 );
        switch ( y ) {
          case 1:
            await this.botSpeak( '@' + theUsername + ' I am flipping a coin. You got...heads', true );
            break;
          case 2:
            await this.botSpeak( '@' + theUsername + ' I am flipping a coin. You got...tails', true );
            break;
        }
      }
    },

    dice: async function ( data, args ) {
      if ( args.length < 2 ) {
        await this.botSpeak( `You didn't tell me how many dice to roll and how many sides they have. Check "/help dice" for more info` );
        return;
      }

      console.log(`data: ${JSON.stringify( data, null, 2 )};`)
      const theUsername = data.senderName;
      const diceCount = args[ 0 ];
      const diceType = args[ 1 ].split( "d" )[ 1 ];

      if ( !diceType ) {
        await this.botSpeak( `The 2nd number must have a "d" before it. Check "/help dice" for more info` );
        return;
      }

      if ( !+diceCount || !+diceType ) {
        await this.botSpeak( `Unable to read non-numeric values` );
        return;
      }

      if ( diceCount < 1 ) {
        await this.botSpeak( `You must roll at least 1 die` );
        return;
      }

      if ( diceCount > 100 ) {
        await this.botSpeak( `There's a max of 100 dice` );
        return;
      }

      if ( diceType < 3 ) {
        await this.botSpeak( `These dice need at least 3 sides, otherwise, use coinflip` );
        return;
      }

      if ( diceType > 100 ) {
        await this.botSpeak( `These dice have a max of 100 sides` );
        return;
      }

      let theMessage = "@" + theUsername + ", you rolled";
      let theCount = 0;
      let thisDice;

      for ( let diceLoop = 0; diceLoop < diceCount; diceLoop++ ) {
        thisDice = Math.ceil( Math.random() * diceType );
        theMessage = theMessage + " a " + thisDice + ", ";
        theCount = theCount + thisDice;
      }

      theMessage = theMessage.substring( 0, theMessage.length - 2 );
      theMessage = theMessage + " for a total of " + theCount;
      await this.botSpeak( theMessage );
    },

    ventriloquistCommand: async function ( data, args ) {
      let theMessage = '';
      for ( let wordLoop = 0; wordLoop < args.length; wordLoop++ ) {
        theMessage += args[ wordLoop ] + ' ';
      }
      theMessage = theMessage.substring( 0, theMessage.length - 1 );

      await this.botSpeak( theMessage, true );
    },

    // ========================================================

    userGreeting: async function ( userID, theUsername, roomFunctions, userFunctions, databaseFunctions ) {
      //console.log('user greeting')
      if ( theUsername !== "Guest" && !userFunctions.isThisTheBot( userID ) ) {
        const customGreeting = userMessages.userGreetings.find( ( { id } ) => id === userID );
        let theMessage;

        if ( customGreeting !== undefined ) {
          theMessage = customGreeting.message;
        } else {
          theMessage = roomFunctions.roomJoinMessage();
        }

        if ( roomFunctions.theme() !== false ) {
          theMessage += '\n\nThe theme is currently set to ' + roomFunctions.theme();
        }

        if ( !userFunctions.isUsersWelcomeTimerActive( userID ) ) {
          await userFunctions.activateUsersWelcomeTimer( userID, databaseFunctions );

          if ( roomDefaults.queueActive === true && userFunctions.howManyDJs() === 5 ) {
            theMessage += "\nThe queue is currently active. To add yourself to the queue type /addme. To remove yourself from the queue type /removeme.";
          }
          if ( !roomFunctions.isRulesTimerRunning() && roomFunctions.rulesMessageOn() ) {
            theMessage += "\n\n" + roomFunctions.additionalJoinMessage();
            roomFunctions.startRulesTimer();
          }

          theMessage = theMessage.replace( "@username", "@" + theUsername );
          theMessage = theMessage.replace( "@roomName", await roomFunctions.roomName() );

          // theMessage += "\n\nPlease note: Mr. Roboto is in the middle of a MAJOR rewrite for the new site. Things" +
          //   " are improving but we're not there yet. Please report any issues you notice to @jodrell";

          // Delay the execution of the greeting
          setTimeout( async () => {
            return await postMessage( {
              room,
              message: theMessage
            } )
          }, 2 * 1000 ); // seconds * 1000 to convert to milliseconds
        }
      }
    },

    readSongStats: async function ( videoID, songFunctions, botFunctions, databaseFunctions, userFunctions ) {
      try {
        let artistName = await songFunctions.getArtistName( videoID, databaseFunctions );
        if ( !artistName ) {
          artistName = songFunctions.previousArtist();
        }

        let trackName = await songFunctions.getTrackName( videoID, databaseFunctions );
        if ( !trackName ) {
          trackName = songFunctions.previousTrack();
        }
        
        if ( trackName !== null && artistName !== null) {
          if ( botFunctions.readSongStats() ) {
            let previousDJName
            if ( await userFunctions.getPreviousDJID() ) {
              previousDJName = await userFunctions.getUsername( await userFunctions.getPreviousDJID() )
            } else {
              previousDJName = "Just"
            }

            const message = `${ previousDJName } played...
          ${ trackName } by ${ artistName }
          Stats: 👍 ${ songFunctions.upVotes() } 👎 ${ songFunctions.downVotes() } ❤️ ${ songFunctions.snagCount() }`
            await this.botSpeak( message )
          }
        }
      } catch ( error ) {
        console.error( "Error reading song stats:", error );
      }
    },

    readPlaylistStats: async function ( data ) {
      if ( botDefaults.botPlaylist !== null ) {
        await this.botSpeak( 'There are currently ' + botDefaults.botPlaylist.length + ' songs in my playlist.' );
      }
    },

    overPlayLimit: async function ( data, username, playLimit ) {
      await this.botSpeak( '@' + username + ' the  playlimit is currently ' + playLimit + '. Time for another DJ.' );
    },

    eventMessageIterator: function ( botFunctions, userFunctions ) {
      if ( roomDefaults.EVENTMESSAGE === true && roomDefaults.eventMessages.length !== 0 ) {
        if ( botFunctions.messageCounter === roomDefaults.eventMessages.length ) {
          botFunctions.messageCounter = 0; //if end of event messages array reached, reset counter
        }

        if ( roomDefaults.eventMessageThroughPm === false ) //if set to send messages through chatbox, do so
        {
          bot.speak( roomDefaults.eventMessages[ botFunctions.messageCounter ] + "" );
        } else //else send message through pm
        {
          for ( let jio = 0; jio < userFunctions.userIDs.length; jio++ ) {
            bot.pm( roomDefaults.eventMessages[ botFunctions.messageCounter ] + "", userFunctions.userIDs[ jio ] );
          }
        }

        ++botFunctions.messageCounter; //increment message counter
      }
    },
  }
}

export default chatFunctions;