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

    botSpeak: async function ( message, publicChat, recipient ) {
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

    suggestFollow: async function( mlFunctions, songFunctions, roomFunctions, databaseFunctions ) {
      const previousPlays = await databaseFunctions.getPreviousPlays()
      let replyJSON = await mlFunctions.suggestFollow( songFunctions.artist, songFunctions.song, roomFunctions, previousPlays );
      
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

      // Store reference to 'this' to maintain context
      const self = this;

      const readInOrder = async () => {
        // Get the last message (note: array indices are 0-based, so last element is at length-1)
        let lastMessage = "";
        if (messageVariable[randomMessageNumber] && messageVariable[randomMessageNumber].length > 0) {
          const lastIndex = messageVariable[randomMessageNumber].length - 1;
          lastMessage = messageVariable[randomMessageNumber][lastIndex][0];
        } else {
          lastMessage = ".";
        }

        // Loop through all messages except the last one
        for ( let messageLoop = 0; messageLoop < messageVariable[ randomMessageNumber ].length - 1; messageLoop++ ) {
          await this.botSpeak( messageVariable[ randomMessageNumber ][ messageLoop ][ 0 ] );
          await sleep( messageVariable[ randomMessageNumber ][ messageLoop ][ 1 ] )
        }

        const randomPic = [ pictureVariable[ Math.floor( Math.random() * pictureVariable.length ) ] ];
        try {
          await self.botSpeakPicture( lastMessage, randomPic );
        } catch (error) {
          console.error(`Error calling botSpeakPicture: ${error.message}`);
        }
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

    // 
    // ========================================================

    // ========================================================
    // Fruit machine functions
    // ========================================================

    symbols: () => [
      { symbol: "🍒", payout: 2, probability: 0.7368 },  // ~40% full line
      { symbol: "🍋", payout: 3, probability: 0.3162 },  // ~30% full line
      { symbol: "🍇", payout: 4, probability: 0.2611 },  // ~20% full line
      { symbol: "🍉", payout: 5, probability: 0.2154 },  // ~10% full line
      { symbol: "⭐", payout: 10, probability: 0.1700 }   // ~5% full line
    ],

    getRandomSymbol: async function () {
      const rand = Math.random();
      let cumulative = 0;
      for (const item of this.symbols()) {
        cumulative += item.probability;
        if (rand < cumulative) {
          return item;
        }
      }
      return this.symbols[this.symbols.length - 1];
    },
    
    fruitMachine: async function ( data, args, userFunctions, databaseFunctions, chatFunctions ) {
      let [ bet, ...restArgs ] = args;
      bet = Number(bet); // Convert bet to a number

      const userPlaying = await userFunctions.whoSentTheCommand( data );
      try {
        await this.validateBet(bet, userPlaying, userFunctions, data, chatFunctions);
        if ( await userFunctions.canUserAffordToSpendThisMuch( userPlaying, bet, chatFunctions, data ) ) {
          await userFunctions.updateRoboCoins( userPlaying, await userFunctions.getRoboCoins( userPlaying ) - bet, databaseFunctions )
          await this.playGame( userPlaying, bet, databaseFunctions, userFunctions );
        }
      } catch (error) {
        console.error(error.message);
      }
    },

    validateBet: async function ( numCoins, sendingUserID, userFunctions, data, chatFunctions ) {
      if (numCoins === undefined || isNaN(numCoins)) {
        await this.botSpeak(`@${await userFunctions.getUsername(sendingUserID)} you must provide a number of coins to bet, eg. /fruitmachine 2`);
        throw new Error("Invalid number of coins");
      }
      if (numCoins < 1 || numCoins > 10 || !Number.isInteger(numCoins)) {
        await this.botSpeak(`@${await userFunctions.getUsername(sendingUserID)} you can only bet a whole number of RC between 1 and 10.`);
        throw new Error("Bet out of range");
      }
      
      if ( ! await userFunctions.canUserAffordToSpendThisMuch( sendingUserID, numCoins, chatFunctions, data )) {
        await this.botSpeak(`Sorry @${await userFunctions.getUsername(sendingUserID)}, you can't afford to bet that much.`);
        throw new Error("User can't afford the bet");
      }
      return true;
    },

    spin: async function (userID, betAmount, databaseFunctions, userFunctions ) {
      const result = [ await this.getRandomSymbol(), await this.getRandomSymbol(), await this.getRandomSymbol() ];
      await this.botSpeak( `Spun: ${ result.map( s => s.symbol ).join( " | " ) }` )
      if ( result[ 0 ].symbol === result[ 1 ].symbol && result[ 1 ].symbol === result[ 2 ].symbol ) {
        const payout = result[ 0 ].payout;
        await this.botSpeak( `JACKPOT! You win ${ payout }:1!` )
        await userFunctions.updateRoboCoins( userID, await userFunctions.getRoboCoins( userID ) + ( payout * betAmount ), databaseFunctions )
        await databaseFunctions.fruitMachineAuditEntry( userID, betAmount, result, payout, databaseFunctions)
        return payout;
      } else {
        await this.botSpeak( "No win, try again!" )
        await databaseFunctions.fruitMachineAuditEntry( userID, betAmount, result, 0, databaseFunctions)
        return 0;
      }
    },

    playGame: async function ( userID, betAmount, databaseFunctions, userFunctions ) {
      await this.botSpeak( "Spinning..." )
      const multiplier = await this.spin( userID, betAmount, databaseFunctions, userFunctions );
      const winnings = betAmount * multiplier;
      await this.botSpeak( `You bet ${ betAmount }, and won ${ winnings }!` )
    },

    odds: async function () {
      await this.botSpeak("Here are the odds for each symbol:");
      for (const item of this.symbols()) {
        const lineProbability = Math.pow(item.probability, 3) * 100;
        await this.botSpeak(`${item.symbol}: ${(item.probability * 100).toFixed(2)}% chance per reel, ${lineProbability.toFixed(2)}% chance for a full line, Payout: ${item.payout}:1`);
      }
    },

    fruitMachineUserResults: async function ( data, userFunctions, databaseFunctions ) {
      const userID = await userFunctions.whoSentTheCommand( data );
      const results = await databaseFunctions.fruitMachineUserResults( userID ) 
      const username = await userFunctions.getUsername( userID );
      
      await this.botSpeak(`@${ username } you have spent ${ results[0].Bets }RC on the Fruit Machine. You've won ${ results[0].Winnings }RC giving you a win percentage of ${ results[0].payout }%`)
    },

    fruitMachineReelResults: async function ( databaseFunctions ) {
      const results = await databaseFunctions.fruitMachineReelResults( )
      const symbolOrder = ["Cherries", "Lemons", "Grapes", "Melons", "Stars"];
      const sortedResults = results.sort((a, b) => symbolOrder.indexOf(a.symbol) - symbolOrder.indexOf(b.symbol));
      const reelSummaries = sortedResults.map(result =>
        `${result.symbol}: Reel 1 - ${result.reelOne_Percentage}%, Reel 2 - ${result.reelTwo_Percentage}%, Reel 3 - ${result.reelThree_Percentage}%`
      ).join("\n");

      await this.botSpeak(`Symbol Distribution:\n${reelSummaries}` );
    },

    // ========================================================

    userGreeting: async function ( userID, theUsername, roomFunctions, userFunctions, databaseFunctions, userProfile ) {
      //console.log('user greeting')
      if ( theUsername !== "Guest" && !userFunctions.isThisTheBot( userID ) ) {
        const customGreeting = userMessages.userGreetings.find( ( { id } ) => id === userID );
        let theMessage;

        if ( customGreeting !== undefined ) {
          theMessage = customGreeting.message;
        } else if ( userProfile.avatarId !== "ghost" && theUsername && !( await databaseFunctions.hasUserHadInitialRoboCoinGift( userID ) ) ) {
          await userFunctions.giveInitialRoboCoinGift( userID, databaseFunctions );
          theMessage = `Welcome to the ${await roomFunctions.roomName()} room @${await userFunctions.getUsername( userID )}. Have a gift of 100 RoboCoins!`
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