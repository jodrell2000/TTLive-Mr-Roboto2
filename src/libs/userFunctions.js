import musicDefaults from '../defaults/musicDefaults.js'
import roomDefaults from '../defaults/roomDefaults.js'
import moment from 'moment';
import { commandIdentifier } from '../defaults/chatDefaults.js'

import authModule from '../libs/auth.js';
import auth from '../libs/auth.js';
import countryLookup from 'country-code-lookup';
import axios from "axios";
import { ActionName } from "ttfm-socket";
import botDefaults from "../defaults/botDefaults.js";

let theUsersList = []; // object array of everyone in the room
let afkPeople = []; //holds the userid of everyone who has used the /afk command
let modPM = []; //holds the userid's of everyone in the /modpm feature
let djList = []; //holds the userid of all the dj's who are on stage currently
let notifyThisDJ = null; // holds the ID of the DJ being told they're next in the queue
let superDJs = []; // list of users not removed by exceeding the playcount and who don't have to queue

/* Previously banned users
 *
 */

let bannedUsers = [ { id: "6040548a3f4bfc001be4c174", name: "bacon_cheeseburger" }, {
  id: "60d14bf5cd1ec800127fb964",
  name: "outlaw"
}, { id: "625a5dd088b736001f4160c3", name: "MustardX" }, {
  id: "636e831117f5ac001d2331c7",
  name: "wub the fuzzizzle"
}, { id: "6041125b3f4bfc001b27de48", name: "Eggman" }, {
  id: "617a2526d1a3d9001c8cd086",
  name: "Eggman"
}, { id: "62b94b7388b736001dfd42da", name: "Eggman" }, {
  id: "61b457a8d1a3d9001ce3b8b0",
  name: "Eggman"
}, { id: "604cfaa047c69b001b52cea5", name: "Eggman" }, {
  id: "61b460d8261cf0001dd4a8c6",
  name: "Eggman"
}, { id: "61837c92caf438001c80d56a", name: "Eggman" } ]; //banned users list, put userids in string form here for permanent banning(put their name after their userid to tell who is banned).
let permanentStageBan = [ { id: "60417796c2dbd9001be7573f" }, { id: "6046b7f947b5e3001be33745" } ]; //put userids in here to ban from djing permanently(put their name after their userid to tell who is banned)
// 6046b7f947b5e3001be33745 MC Swelter for repeated AFK Djing
// 60abaaa6eaab840012280b78 RealAlexJones TROLL!
let vipList = [];
/* this is the vip list, it accepts userids as input, this is for when you have a special guest or guests in your room and you only
   want to hear them dj, leave this empty unless you want everyone other than the people whos userids are in the vip list to be automatically kicked from stage. */

let masterIds = [ '6040a0333f4bfc001be4cf39', '604068d23f4bfc001be4c698' ]; //example (clear this before using) 
// jodrell: 6040a0333f4bfc001be4cf39
// Kelsi: 604068d23f4bfc001be4c698
/*  This is the master id list, userid's that are put in here will not be affected by the song length limit, artist / song banning, the /skip command, or the dj afk limit.
    This is meant to explicitly give extra privileges to yourself and anyone else you want to put in here. It takes userid's as input in string format separated by commas.
    You can put the person's name in the array either before or after a userid to tell who it belongs to, it will not affect its ability to function. */

let index = null; //the index returned when using unban commands
let informTimer = null; //holds the timeout for the /inform command, null lets it know that it hasn't already been set
let warnme = []; //holds the userid's of everyone using the /warnme feature

let queueList = []; //holds the userid of everyone in the queue

let DJPlaysLimited = musicDefaults.DJPlaysLimited; //song play limit, this is for the playLimit variable up above(off by default)
let DJsPlayLimit = musicDefaults.DJsPlayLimit; //set the playlimit here (default 4 songs)
let removeIdleDJs = roomDefaults.removeIdleDJs;
let djIdleLimit = roomDefaults.djIdleLimitThresholds[ 0 ]; // how long can DJs be idle before being removed
let idleFirstWarningTime = roomDefaults.djIdleLimitThresholds[ 1 ];
let idleSecondWarningTime = roomDefaults.djIdleLimitThresholds[ 2 ];

let previousDJID = null;

let functionStore = []; // store give RoboCoin callback functions

const addRCOperation = ( before, coins ) => ( before || 0 ) + coins;
const subtractRCOperation = ( before, coins ) => ( before || 0 ) - coins;

const userFunctions = () => {

  function formatSeconds( seconds ) {
    return ( Math.floor( seconds / 60 ) ).toString() + ' minutes';
  }

  function formatHours( seconds ) {
    const theHours = Math.floor( seconds / ( 60 * 60 ) );
    const theMinutes = Math.floor( ( ( seconds / ( 60 * 60 ) ) - theHours ) * 60 );
    return ( theHours ).toString() + ' hours ' + ( theMinutes ).toString() + ' minutes';
  }

  function formatDays( seconds ) {
    const oneDaySeconds = 60 * 60 * 24;
    const oneHourSeconds = 60 * 60;
    const oneMinuteSeconds = 60;
    let remaining;

    const theDays = Math.floor( seconds / oneDaySeconds );
    remaining = seconds - ( theDays * oneDaySeconds );

    const theHours = Math.floor( ( remaining / oneHourSeconds ) );
    remaining = remaining - ( theHours * oneHourSeconds );

    const theMinutes = Math.floor( remaining / oneMinuteSeconds );

    return ( theDays ).toString() + ' days, ' + ( theHours ).toString() + ' hours and ' + ( theMinutes ).toString() + ' minutes';
  }

  function formatRelativeTime( seconds ) {
    if ( isNaN( seconds ) ) {
      return false
    } else if ( seconds < 60 * 60 ) {
      return formatSeconds( seconds );
    } else if ( seconds < 60 * 60 * 24 ) {
      return formatHours( seconds );
    } else {
      return formatDays( seconds );
    }
  }

  return {
    getPreviousDJID: async () => previousDJID,
    setPreviousDJID: async ( uuid ) => { previousDJID = uuid; },

    debugPrintTheUsersList: function () {
      console.info( "Full theUsersList: " + JSON.stringify( theUsersList ) );
    },

    theUsersList: () => theUsersList,
    modPM: () => modPM,

    bannedUsers: () => bannedUsers,
    permanentStageBan: () => permanentStageBan,

    masterIds: () => masterIds,

    index: () => index,
    informTimer: () => informTimer,
    warnme: () => warnme,

    resetModPM: function () {
      modPM = []
    },

    botStartReset: function ( botFunctions, songFunctions ) {
      // clear everything from memory in case there's any chuff
      this.resetQueueList();
      this.resetAFKPeople();
      this.resetModPM();
      this.clearDJList();

      songFunctions.loadPlaylist();

      const theStartTime = botFunctions.botStartTime();
      if ( !theStartTime ) {
        botFunctions.setBotStartTime();
      }
    },

    isPMerInRoom: function ( userID ) {
      let isInRoom = theUsersList.indexOf( userID );
      isInRoom = isInRoom !== -1;
      return isInRoom;
    },

    // ========================================================
    // API Functions
    // ========================================================

    apiGet: async function ( url ) {
      const headers = {
        'accept': 'application/json',
        'Authorization': `Bearer ${ process.env.TTL_USER_TOKEN }`
      };

      try {
        return await axios.get( url, { headers } );
      } catch ( error ) {
        console.error( `Error calling get api...error:${error}\nurl:${url}` );
        throw error;
      }
    },

    apiPost: async function ( url, payload ) {
      const headers = {
        'accept': 'application/json',
        'Authorization': `Bearer ${ process.env.TTL_USER_TOKEN }`
      };

      try {
        return await axios.post(url, payload, { headers })
      } catch ( error ) {
        console.error( `Error calling post api...error:${error}\nurl:${url}\npayload:${payload}` );
        throw error;
      }
    },

    
    // ========================================================


    // ========================================================
    // User Storage Functions
    // ========================================================

    storeUserData: async function ( userID, key, value, databaseFunctions ) {
      if ( await this.userExists( userID ) && await this.getUsername( userID ) !== "Guest" ) {
        try {
          const userPosition = this.getPositionOnUsersList( userID );
          theUsersList[ userPosition ][ key ] = value;
          await databaseFunctions.storeUserData( theUsersList[ userPosition ] );
        } catch ( error ) {
          console.error( "Error storing user data:", error.message );
          throw error;
        }
      }
    },

    deleteUserData: async function ( databaseFunctions, userID, key ) {
      if ( await this.userExists( userID ) ) {
        delete theUsersList[ this.getPositionOnUsersList( userID ) ][ key ];
        databaseFunctions.storeUserData( theUsersList[ this.getPositionOnUsersList( userID ) ] );
      }
    },

    // ========================================================

    // ========================================================
    // Basic User Functions
    // ========================================================

    isThisTheBot: function ( userID ) {
      return userID === auth.USERID;
    },

    userExists: async function ( userID ) {
      return theUsersList[ this.getPositionOnUsersList( userID ) ] !== undefined;
    },

    getUserProfileFromAPI: async function ( uuid ) {
      console.log(`getUserProfileFromAPI uuid:${uuid}`)
      if ( uuid !== undefined ) {
        const url = `https://gateway.prod.tt.fm/api/user-service/users/profiles?users=${ uuid }`;
        try {
          const response = await this.apiGet( url )
          return response.data[ 0 ]?.userProfile;
        } catch ( error ) {
          console.error( 'Error fetching user profile:', error );
          throw error;
        }
      }
    },

    updateUserFromProfile: async function ( userProfile, databaseFunctions ) {
      const username = userProfile.nickname
      const uuid = userProfile.uuid
      const createdAt = Date.parse(userProfile.createdAt)
      await this.storeUserData( uuid, "username", username, databaseFunctions );
      await this.storeUserData( uuid, "joinTime", createdAt, databaseFunctions );
    },

    getUsername: async function ( userID ) {
      if ( await this.userExists( userID ) ) {
        let theUser = theUsersList.find( ( { id } ) => id === userID );
        return theUser.username;
      } else {
        const userProfile = await this.getUserProfileFromAPI( userID )

        if ( userProfile && userProfile.nickname ) {
          return userProfile.nickname;
        }
      }
    },

    setEmailAddress: async function ( data, args, chatFunctions, databaseFunctions ) {
      try {
        const username = args.slice( 0, args.length - 1 ).join( " " );
        const userID = await this.getUserIDFromUsername( username );
        const email = args[ args.length - 1 ];

        await this.storeUserData( userID, "email", email, databaseFunctions );
        await chatFunctions.botSpeak( 'Email address for ' + username + ' set to ' + email );
      } catch ( error ) {
        console.error( 'Error setting email address:', error );
        throw error;
      }
    },

    verifyUsersEmail: async function ( userID, givenEmail, databaseFunctions ) {
      try {
        const returnedEmail = await databaseFunctions.getUsersEmailAddress( userID );
        return returnedEmail === givenEmail;
      } catch ( error ) {
        console.error( 'Error in verifyUsersEmail:', error );
        return false;
      }
    },

    findNewUserUUID: async function ( payload ) {
      const userUUIDs = new Set( this.theUsersList().map( user => user.id ) );
      const payloadUUIDs = await this.getUUIDsFromPayload( payload )

      // Find UUIDs that are in payload but not in theUsersList
      const missingUUIDs = [];
      payloadUUIDs.forEach( uuid => {
        if ( !userUUIDs.has( uuid ) ) {
          missingUUIDs.push( uuid );
        }
      } );
      return missingUUIDs;
    },

    findLeftUserUUID: async function ( payload ) {
      const userUUIDs = new Set( this.theUsersList().map( user => user.id ) );
      const payloadUUIDs = new Set( await this.getUUIDsFromPayload( payload ) )

      const leftUUIDs = [];
      userUUIDs.forEach(uuid => {
        if (!payloadUUIDs.has(uuid)) {
          leftUUIDs.push(uuid);
        }
      });
      return leftUUIDs;
    },

    getUUIDsFromPayload: async function (payload) {
      const payloadUUIDs = new Set();
      let theUUIDArray = payload.allUsers;

      theUUIDArray.forEach(user => {
        if (user.uuid) {
          payloadUUIDs.add(user.uuid);
        }
      });
      return Array.from(payloadUUIDs);
    },
    
    getUserIDFromData: function ( data ) {
      return data.userid;
    },

    getUserIDFromUsername: async function ( theUsername ) {
      console.log(`getUserIDFromUsername theUserList:${JSON.stringify(theUsersList,null,2)}`)
      for ( let userLoop = 0; userLoop < theUsersList.length; userLoop++ ) {
        if ( theUsersList[ userLoop ].username.toLowerCase() === theUsername.toLowerCase() ) {
          return theUsersList[ userLoop ].id;
        }
      }
      
    },

    enableEscortMe: async function ( data, chatFunctions, databaseFunctions ) {
      console.group( `enableEscortMe` )
      const theUserID = await this.whoSentTheCommand( data );
      console.log( `theUserID:${ theUserID }` )
      let theError = '';
      if ( await this.escortMeIsEnabled( theUserID ) ) {
        theError += ", you've already enabled Escort Me...";
      }
      if ( !await this.isUserIDOnStage( theUserID ) ) {
        theError += ", you're not on stage...";
      }

      if ( theError === '' ) {
        await this.addEscortMeToUser( theUserID, databaseFunctions );
        await chatFunctions.botSpeak( '@' + await this.getUsername( theUserID ) + ' you will be escorted after you play' +
          ' your song' );
      } else {
        await chatFunctions.botSpeak( '@' + await this.getUsername( theUserID ) + theError );
      }
      console.groupEnd()
    },

    disableEscortMe: async function ( data, chatFunctions, databaseFunctions ) {
      const theUserID = await this.whoSentTheCommand( data );
      let theError = '';
      if ( !await this.escortMeIsEnabled( theUserID ) ) {
        theError += ", you haven't enabled Escort Me..."
      }
      if ( !await this.isUserIDOnStage( theUserID ) ) {
        theError += ", you're not on stage..."
      }

      if ( theError === '' ) {
        await this.removeEscortMeFromUser( theUserID, databaseFunctions );
        await chatFunctions.botSpeak( '@' + await this.getUsername( theUserID ) + ' you will no longer be escorted' +
          ' after' +
          ' you play your song' );
      } else {
        await chatFunctions.botSpeak( '@' + await this.getUsername( theUserID ) + theError );
      }
    },

    whoSentTheCommand: async function ( data ) {
      return data.sender;
    },

    // ========================================================

    // ========================================================
    // User Region Functions
    // ========================================================

    checkUsersHaveRegions: async function ( data, chatFunctions ) {
      let userID;

      for ( let userCount = 0; userCount < data.users.length; userCount++ ) {
        if ( typeof data.users[ userCount ] !== 'undefined' ) {
          userID = data.users[ userCount ].userid;
          if ( await this.userExists( userID ) ) {
            this.askUserToSetRegion( userID, chatFunctions );
          }
        }
      }
    },

    askUserToSetRegion: async function ( userID, chatFunctions ) {
      if ( !await this.getUserRegion( userID ) && !this.userWantsNoRegion( userID ) ) {
        await chatFunctions.botPM( "If you'd like me to check that videos are playable in your region, please set it using the command '" + commandIdentifier + "myRegion XX'. Replace XX with a valid 2 letter country code https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2 If you want to not be asked this again please user the command '" + commandIdentifier + "noRegion'", userID );
      }
    },

    getUserRegion: async function ( userID ) {
      if ( await this.userExists( userID ) ) {
        const userPosition = this.getPositionOnUsersList( userID );
        const userRegion = theUsersList[ userPosition ][ 'region' ];

        // Check if 'region' is defined
        if ( userRegion !== undefined ) {
          return userRegion;
        }
      }
    },

    myRegionCommand: async function ( data, args, chatFunctions, videoFunctions, databaseFunctions ) {
      const userID = this.whoSentTheCommand( data );

      if ( args[ 0 ] === undefined ) {
        await chatFunctions.botSpeak( `@${ await this.getUsername( userID ) } you must give a region code, e.g., \`/myregion GB\`. Please use one of the 2 character ISO country codes, [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)` );
        return;
      }

      const theRegion = args[ 0 ].toUpperCase();
      const isValidRegion = theRegion.length === 2 && countryLookup.byIso( theRegion ) !== null;

      if ( !isValidRegion ) {
        await chatFunctions.botSpeak( `@${ await this.getUsername( userID ) } that region is not recognized. Please use one of the 2 character ISO country codes, [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2)` );
      } else {
        console.log( "this.getUserRegion( userID ): " + this.getUserRegion( userID ) );
        if ( !this.getUserRegion( userID ) ) {
          this.storeUserRegion( data, userID, theRegion, chatFunctions, videoFunctions, databaseFunctions );
        } else {
          await this.chargeMe( 50, data, chatFunctions, databaseFunctions, () =>
            this.storeUserRegion( data, userID, theRegion, chatFunctions, videoFunctions, databaseFunctions, "to change your region" )
          );
        }
      }
    },

    userWantsNoRegion: function ( userID ) {
      return theUsersList[ this.getPositionOnUsersList( userID ) ][ 'noregion' ];
    },

    storeUserRegion: async function ( data, userID, region, chatFunctions, videoFunctions, databaseFunctions ) {
      await this.deleteUserWantsNoRegion( userID, data, videoFunctions, chatFunctions, databaseFunctions );
      await this.storeUserData( userID, "region", region, databaseFunctions );

      await chatFunctions.botSpeak( "@" + await this.getUsername( userID ) + " the region " + countryLookup.byIso( region ).country + " has been added to your user" );
      this.updateRegionAlertsFromUsers( data, videoFunctions, chatFunctions );
    },

    deleteUserRegion: async function ( userID, data, videoFunctions, chatFunctions, databaseFunctions ) {
      await this.deleteUserData( databaseFunctions, userID, "region" );
      this.updateRegionAlertsFromUsers( data, videoFunctions, chatFunctions );
    },

    storeNoRegion: async function ( data, chatFunctions, videoFunctions, databaseFunctions ) {
      const userID = this.whoSentTheCommand( data );

      await this.deleteUserRegion( userID, data, videoFunctions, chatFunctions, databaseFunctions );
      await this.storeUserData( userID, "noregion", true, databaseFunctions );

      await chatFunctions.botSpeak( "You won't be asked again to set a region" );
      this.updateRegionAlertsFromUsers( data, videoFunctions, chatFunctions );
    },

    deleteUserWantsNoRegion: async function ( userID, data, videoFunctions, chatFunctions, databaseFunctions ) {
      await this.deleteUserData( databaseFunctions, userID, "noregion" );
    },

    updateRegionAlertsFromUsers: function ( data, videoFunctions, chatFunctions ) {
      videoFunctions.resetAlertRegions();
      const userRegionsArray = this.getUniqueRegionsFromUsersInTheRoom( data );
      let thisRegion;

      // add regions that users have set that aren't being checked
      if ( userRegionsArray !== undefined ) {
        for ( let userRegionLoop = 0; userRegionLoop < userRegionsArray.length; userRegionLoop++ ) {
          thisRegion = userRegionsArray[ userRegionLoop ];
          if ( Object.keys( thisRegion ).length > 0 ) {
            videoFunctions.addAlertRegion( data, thisRegion, chatFunctions, false );
          }
        }
      }
    },

    getUniqueRegionsFromUsersInTheRoom: function () {
      let regionsArray = [];
      let userRegion;
      let userHere;

      for ( let userLoop = 0; userLoop < theUsersList.length; userLoop++ ) {
        userRegion = this.getUserRegion( theUsersList[ userLoop ][ "id" ] );
        userHere = this.isUserHere( theUsersList[ userLoop ][ "id" ] );
        if ( userHere && userRegion !== undefined ) {
          regionsArray.push( this.getUserRegion( theUsersList[ userLoop ][ "id" ] ) );
        }
      }
      console.log( "Regions array:" + regionsArray.filter( ( v, i, a ) => a.indexOf( v ) === i ) );
      return regionsArray.filter( ( v, i, a ) => a.indexOf( v ) === i );
    },

    // ========================================================

    // ========================================================
    // Super User Functions
    // ========================================================

    superDJs: () => superDJs,

    addSuperDJ: async function ( username, data, chatFunctions ) {
      const userID = await this.getUserIDFromUsername( username );
      this.isSuperDJ( userID )
        .then( ( isSuperDJ ) => {
          if ( !isSuperDJ ) {
            superDJs.push( userID );
            chatFunctions.botSpeak( this.getUsername( userID ) + " is now a SuperDJ" );
          } else {
            chatFunctions.botSpeak( this.getUsername( userID ) + " is already a SuperDJ" );
          }
        } );
    },

    removeSuperDJ: async function ( username, data, chatFunctions ) {
      const userID = await this.getUserIDFromUsername( username );
      this.isSuperDJ( userID )
        .then( ( isSuperDJ ) => {
          if ( !isSuperDJ ) {
            chatFunctions.botSpeak( this.getUsername( userID ) + " is not a SuperDJ??" );
          } else {
            superDJs.splice( superDJs.indexOf( userID ), 1 )
            chatFunctions.botSpeak( this.getUsername( userID ) + " is no longer a SuperDJ" );
          }
        } );
    },

    isSuperDJ: function ( userID ) {
      return new Promise( ( resolve ) => {
        if ( superDJs.includes( userID ) ) {
          resolve( true );
        } else {
          resolve( false );
        }
      } );
    },

    clearSuperDJs: async function ( data, chatFunctions ) {
      superDJs = [];
      await this.readSuperDJs( data, chatFunctions );
    },

    readSuperDJs: async function ( data, chatFunctions ) {
      if ( superDJs.length === 0 ) {
        await chatFunctions.botSpeak( "There are currently no SuperDJs" );
      } else {
        let usernameArray = [];
        for ( let i = 0; i < superDJs.length; i++ ) {
          let username = this.getUsername( superDJs[ i ] );
          usernameArray.push( username );
        }
        let usernameList = usernameArray.join( ', ' );

        await chatFunctions.botSpeak( "The current SuperDJs are " + usernameList );
      }
    },

    // ========================================================

    readSingleUserStatus: async function ( data, chatFunctions, roomFunctions ) {
      let username = [];
      username.push( this.getUsername( this.whoSentTheCommand( data ) ) );

      await this.readUserStatus( data, username, chatFunctions, roomFunctions );
    },

    readUserStatus: async function ( data, args, chatFunctions, roomFunctions ) {
      let theUsername = '';
      for ( let userLoop = 0; userLoop < args.length; userLoop++ ) {
        theUsername += args[ userLoop ] + ' ';
      }
      theUsername = theUsername.substring( 0, theUsername.length - 1 );

      const theUserID = await this.getUserIDFromUsername( theUsername );
      const roomJoined = formatRelativeTime( ( Date.now() - await this.getUserJoinedRoom( theUserID ) ) / 1000 );
      let modText = '';
      if ( await this.isUserModerator( theUserID, roomFunctions ) !== true ) {
        modText = 'not '
      }
      const lastSpoke = formatRelativeTime( ( Date.now() - await this.getUserLastSpoke( theUserID ) ) / 1000 );
      const lastVoted = formatRelativeTime( ( Date.now() - await this.getUserLastVoted( theUserID ) ) / 1000 );
      const lastSnagged = formatRelativeTime( ( Date.now() - await this.getUserLastSnagged( theUserID ) ) / 1000 );
      const joinedStage = formatRelativeTime( ( Date.now() - await this.getUserJoinedStage( theUserID ) ) / 1000 );
      const spamCount = await this.getUserSpamCount( theUserID );
      const currentPlayCount = await this.getDJCurrentPlayCount( theUserID );
      const totalPlayCount = await this.getDJTotalPlayCount( theUserID );

      if ( theUserID !== undefined ) {
        const theMessage = `User info for ${theUsername}\n
        - userID is ${theUserID}\n
        - joined the room ${roomJoined} ago\n
        - is ${modText} a Moderator\n
        - spoke ${lastSpoke} ago\n
        - voted ${lastVoted} ago\n
        - snagged ${lastSnagged} ago\n
        - DJd ${joinedStage} ago\n
        - SPAM count=${spamCount}\n
        - current playcount=${currentPlayCount}\n
        - total playcount=${totalPlayCount}`
        await chatFunctions.botSpeak( theMessage );
      } else {
        await chatFunctions.botSpeak( 'I couldn\'t find the details for that user. Please check the spelling, and capitalisation' );
      }
    },

    getUserJoinedRoom: async function ( userID ) {
      if ( await this.userExists( userID ) ) {
        let userPosition = this.getPositionOnUsersList( userID );
        return theUsersList[ userPosition ][ 'joinTime' ];
      }
    },

    getUserLastVoted: async function ( userID ) {
      if ( await this.userExists( userID ) ) {
        let userPosition = this.getPositionOnUsersList( userID );
        return theUsersList[ userPosition ][ 'lastVoted' ];
      }
    },

    getUserLastSpoke: async function ( userID ) {
      if ( await this.userExists( userID ) ) {
        let userPosition = this.getPositionOnUsersList( userID );
        return theUsersList[ userPosition ][ 'lastSpoke' ];
      }
    },

    getUserLastSnagged: async function ( userID ) {
      if ( await this.userExists( userID ) ) {
        let userPosition = this.getPositionOnUsersList( userID );
        return theUsersList[ userPosition ][ 'lastSnagged' ];
      }
    },

    getUserJoinedStage: async function ( userID ) {
      if ( await this.userExists( userID ) ) {
        let userPosition = this.getPositionOnUsersList( userID );
        return theUsersList[ userPosition ][ 'joinedStage' ];
      }
    },

    // "songCount":0

    // ========================================================

    // ========================================================
    // Moderator Management Functions
    // ========================================================

    resetModerators: async function ( data, databaseFunctions ) {
      let userID;
      if ( data.room !== undefined ) {
        for ( let modLoop = 0; modLoop < data.room.metadata.moderator_id.length; modLoop++ ) {
          userID = data.room.metadata.moderator_id[ modLoop ];
          if ( await this.userExists( userID ) ) {
            await this.storeUserData( userID, 'moderator', true, databaseFunctions );
          }
        }
      }
    },

    updateModeratorsFromRoomData: async function ( roomFunctions, databaseFunctions ) {
      const roomData = await roomFunctions.getRoomData()
      const roomRoles = roomData.roomRoles

      for ( const role of roomRoles ) {
        if ( role.role === "moderator" || role.role === "owner" || role.role === "coOwner" ) {
          await this.addModerator( role.userUuid, databaseFunctions );
        }
      }
    },

    updateModeratorStatus: async function ( uuid, roomFunctions ) {
      const roomData = await roomFunctions.getRoomData()
    },

    addModerator: async function ( userID, databaseFunctions ) {
      await this.storeUserData( userID, 'moderator', true, databaseFunctions );
    },

    removeModerator: async function ( userID, databaseFunctions ) {
      await this.storeUserData( userID, 'moderator', false, databaseFunctions );
    },

    isUserModerator: async function ( theUserID, roomFunctions ) {
      const roomData = await roomFunctions.getRoomData( process.env.ROOM_UUID )
      return roomData.roomRoles.some( role =>
        role.userUuid === theUserID &&
        ( role.role === 'owner' || role.role === 'coOwner' || role.role === 'moderator' )
      );
    },

    // ========================================================

    // ========================================================
    // Command Count Functions
    // ========================================================

    getCommandCount: async function ( receiverID, theCommand ) {
      if ( await this.userExists( receiverID ) ) {
        return theUsersList[ this.getPositionOnUsersList( receiverID ) ][ theCommand + 'Count' ];
      }
    },

    updateCommandCount: async function ( receiverID, theCommand, databaseFunctions ) {
      let commandCount = await this.getCommandCount( receiverID, theCommand );
      if ( commandCount === undefined ) {
        commandCount = 0
      }
      await this.storeUserData( receiverID, theCommand + 'Count', commandCount + 1, databaseFunctions );
      await databaseFunctions.incrementCommandCountForCurrentTrack( theCommand );
    },

    // ========================================================

    // ========================================================
    // VIP Functions
    // ========================================================

    vipList: () => vipList,

    isUserVIP: function ( userID ) {
      return this.vipList().indexOf( userID ) !== -1;
    },

    // ========================================================

    // ========================================================
    // User SPAM Functions
    // ========================================================

    resetAllSpamCounts: function () {
      //sets everyones spam count to zero
      //puts people on the global afk list when it joins the room
      for ( let userLoop = 0; userLoop < theUsersList.length; userLoop++ ) {
        theUsersList[ userLoop ][ 'spamCount' ] = 0;
      }
    },

    incrementSpamCounter: async function ( userID, databaseFunctions ) {
      if ( await this.userExists( userID ) ) {
        const key = "spamCount";
        const value = this.getUserSpamCount( userID );
        await this.storeUserData( userID, key, value, databaseFunctions )

        if ( theUsersList[ this.getPositionOnUsersList( userID ) ][ 'spamTimer' ] !== null ) {
          clearTimeout( theUsersList[ this.getPositionOnUsersList( userID ) ][ 'spamTimer' ] );
          await this.resetUserSpamTimer( userID, databaseFunctions );
        }

        theUsersList[ this.getPositionOnUsersList( userID ) ][ 'spamTimer' ] = setTimeout( async function ( userID ) {
          await this.resetUsersSpamCount( userID, databaseFunctions );
        }.bind( this ), 10 * 1000 );
      }
    },

    resetUserSpamTimer: async function ( userID, databaseFunctions ) {
      await this.storeUserData( userID, "spamTimer", null, databaseFunctions )
    },

    resetUsersSpamCount: async function ( userID, databaseFunctions ) {
      await this.storeUserData( userID, "spamCount", 0, databaseFunctions );
    },

    getUserSpamCount: async function ( userID ) {
      if ( await this.userExists( userID ) ) {
        return theUsersList[ this.getPositionOnUsersList( userID ) ][ 'spamCount' ];
      }
    },

    // ========================================================

    // ========================================================
    // Refresh Functions
    // ========================================================

    refreshCommand: async function ( data, chatFunctions, botFunctions, databaseFunctions ) {
      const theUserID = this.whoSentTheCommand( data );
      let [ , theMessage ] = this.addRefreshToUser( theUserID, botFunctions, databaseFunctions );

      await chatFunctions.botSpeak( theMessage );
    },

    addRefreshToUser: async function ( userID, botFunctions, databaseFunctions ) {
      if ( botFunctions.refreshingEnabled() ) {
        if ( await this.isUserInUsersList( userID ) ) {
          if ( await this.isUserIDOnStage( userID ) ) {
            if ( !this.isUserInRefreshList( userID ) ) {
              const listPosition = this.getPositionOnUsersList( userID );
              await this.storeUserData( userID, 'RefreshStart', Date.now(), databaseFunctions );
              await this.storeUserData( userID, 'RefreshCount', this.getUsersRefreshCount() + 1, databaseFunctions );
              await this.storeUserData( userID, 'RefreshCurrentPlayCount', this.getDJCurrentPlayCount( userID ), databaseFunctions );
              await this.storeUserData( userID, 'RefreshTotalPlayCount', this.getDJTotalPlayCount( userID ), databaseFunctions );

              theUsersList[ listPosition ][ 'RefreshTimer' ] = setTimeout( async function () {
                await this.removeRefreshFromUser( userID, databaseFunctions );
              }.bind( this ), roomDefaults.amountOfTimeToRefresh * 1000 );

              let message = '@' + await this.getUsername( userID ) + ' I\'ll hold your spot on stage for the next ' + roomDefaults.amountOfTimeToRefresh / 60 + ' minutes';
              return [ true, message ]
            } else {
              return [ false, "You're already using the refresh command" ];
            }
          } else {
            return [ false, "You're not currently DJing...so you don't need the refresh command" ];
          }
        } else {
          return [ false, "You seem not to exist. Please tell a Moderator! (err: userFunctions.addRefreshToUser)" ];
        }
      } else {
        return [ false, "Use of the /refresh command is currently disabled" ]
      }
    },

    getUsersRefreshCount: async function ( userID ) {
      if ( await this.userExists( userID ) ) {
        return theUsersList[ this.getPositionOnUsersList( userID ) ][ 'RefreshCount' ];
      }
    },

    removeRefreshFromUser: async function ( userID, databaseFunctions ) {
      await this.deleteUserData( databaseFunctions, userID, "RefreshStart" );
      await this.deleteUserData( databaseFunctions, userID, "RefreshCurrentPlayCount" );
      await this.deleteUserData( databaseFunctions, userID, "RefreshTotalPlayCount" );
      await this.deleteUserData( databaseFunctions, userID, "RefreshTimer" );
    },

    // ========================================================

    // ========================================================
    // Refresh Helper Functions
    // ========================================================

    isUserInRefreshList: async function ( userID ) {
      if ( await this.userExists( userID ) ) {
        return theUsersList[ this.getPositionOnUsersList( userID ) ][ 'RefreshStart' ] !== undefined;
      }
    },

    getUsersRefreshCurrentPlayCount: async function ( userID ) {
      if ( await this.userExists( userID ) ) {
        let listPosition = this.getPositionOnUsersList( userID );
        if ( theUsersList[ listPosition ][ 'RefreshCurrentPlayCount' ] !== undefined ) {
          return theUsersList[ listPosition ][ 'RefreshCurrentPlayCount' ];
        } else {
          return 0;
        }
      }
    },

    getUsersRefreshTotalPlayCount: async function ( userID ) {
      if ( await this.userExists( userID ) ) {
        let listPosition = this.getPositionOnUsersList( userID );
        if ( theUsersList[ listPosition ][ 'RefreshTotalPlayCount' ] !== undefined ) {
          return theUsersList[ listPosition ][ 'RefreshTotalPlayCount' ];
        }
      }
    },

    refreshDJCount: function () {
      let theCount = 0;
      for ( let userLoop = 0; userLoop < theUsersList.length; userLoop++ ) {
        if ( theUsersList[ userLoop ][ 'RefreshStart' ] !== undefined ) {
          theCount++;
        }
      }
      return theCount;
    },

    whosRefreshingCommand: function ( data, chatFunctions ) {
      let userList = '';
      for ( let userLoop = 0; userLoop < theUsersList.length; userLoop++ ) {
        if ( theUsersList[ userLoop ][ 'RefreshStart' ] !== undefined ) {
          userList += theUsersList[ userLoop ].username + ', ';
        }
      }

      userList = userList.substring( 0, userList.length - 2 );
      const lastComma = userList.lastIndexOf( ',' );
      if ( lastComma !== -1 ) {
        userList = userList.substring( 0, lastComma ) + ' and' + userList.substring( lastComma + 1 )
      }

      if ( userList === '' ) {
        chatFunctions.botSpeak( 'No users are currently refreshing.' );
      } else {
        chatFunctions.botSpeak( 'The following users are currently refreshing. ' + userList );
      }
    },

    // ========================================================

    // ========================================================
    // Idle Functions (have people just gone away)
    // ========================================================

    roomIdle: () => roomDefaults.roomIdle,
    enableRoomIdle: function () {
      roomDefaults.roomIdle = true;
    },
    disableRoomIdle: function () {
      roomDefaults.roomIdle = false;
    },

    djIdleLimit: () => djIdleLimit,

    removeIdleDJs: () => removeIdleDJs,
    enableDJIdle: function ( data, chatFunctions ) {
      removeIdleDJs = true;
      this.reportDJIdleStatus( data, chatFunctions );
    },
    disableDJIdle: function ( data, chatFunctions ) {
      removeIdleDJs = false;
      this.reportDJIdleStatus( data, chatFunctions );
    },
    reportDJIdleStatus: async function ( data, chatFunctions ) {
      if ( this.removeIdleDJs() ) {
        await chatFunctions.botSpeak( 'DJs who have been idle for longer than ' + this.djIdleLimit() + ' will be removed from the decks' )
      } else {
        await chatFunctions.botSpeak( 'Automatic removal of idle DJs is disabled' )
      }
    },

    idleFirstWarningTime: () => idleFirstWarningTime,
    setIdleFirstWarningTime: async function ( data, args, chatFunctions ) {
      const newWarningTime = args[ 0 ];
      if ( isNaN( newWarningTime ) ) {
        await chatFunctions.botSpeak( 'I can\'t set the First Idle Warning time to ' + newWarningTime + ' minutes' );
      } else {
        idleFirstWarningTime = newWarningTime;
        await chatFunctions.botSpeak( 'DJs will now be given their first Idle warning after ' + newWarningTime + ' minutes' );
      }
    },

    idleSecondWarningTime: () => idleSecondWarningTime,
    setIdleSecondWarningTime: async function ( data, args, chatFunctions ) {
      const newWarningTime = args[ 0 ];
      if ( isNaN( newWarningTime ) ) {
        await chatFunctions.botSpeak( 'I can\'t set the Second Idle Warning time to ' + newWarningTime + ' minutes' );
      } else {
        idleSecondWarningTime = newWarningTime;
        await chatFunctions.botSpeak( 'DJs will now be given their Second Idle Warning after ' + newWarningTime + ' minutes' );
      }
    },

    updateUserLastSpoke: async function ( userID, databaseFunctions ) {
      await this.storeUserData( userID, "lastSpoke", Date.now(), databaseFunctions )
    },

    updateUserLastVoted: async function ( userID, databaseFunctions ) {
      await this.storeUserData( userID, "lastVoted", Date.now(), databaseFunctions )
    },

    updateUserLastSnagged: async function ( userID, databaseFunctions ) {
      await this.storeUserData( userID, "lastSnagged", Date.now(), databaseFunctions )
    },

    updateUserJoinedStage: async function ( userID, databaseFunctions ) {
      await this.storeUserData( userID, "joinedStage", Date.now(), databaseFunctions )
      await this.storeUserData( userID, "currentPlayCount", 0, databaseFunctions )
    },

    getIdleTime: async function ( userID ) {
      let userLastActive = await this.getUserJoinedRoom( userID );

      if ( roomDefaults.voteMeansActive ) {
        let lastVoted = await this.getUserLastVoted( userID );
        if ( lastVoted > userLastActive ) {
          userLastActive = lastVoted;
        }
      }

      if ( roomDefaults.speechMeansActive ) {
        let lastSpoke = await this.getUserLastSpoke( userID );
        if ( lastSpoke > userLastActive ) {
          userLastActive = lastSpoke;
        }
      }

      if ( roomDefaults.snagMeansActive ) {
        let lastSnagged = await this.getUserLastSnagged( userID );
        if ( lastSnagged > userLastActive ) {
          userLastActive = lastSnagged;
        }
      }

      if ( roomDefaults.djingMeansActive ) {
        let joinedStage = await this.getUserJoinedStage( userID );
        if ( joinedStage > userLastActive ) {
          userLastActive = joinedStage;
        }
      }

      return ( Date.now() - userLastActive ) / 1000; // return usersAFK time in seconds
    },

    idleWarning: async function ( userID, threshold, chatFunctions ) {
      let theMessage;
      let theActions = '';
      let idleLimit = this.djIdleLimit();
      let minutesRemaining = idleLimit - threshold;

      if ( minutesRemaining !== 0 ) {
        theMessage = 'You have less than ' + minutesRemaining + ' minutes of idle left.';
        if ( roomDefaults.voteMeansActive === true ) {
          theActions += ' Awesome,';
        }
        if ( roomDefaults.speechMeansActive === true ) {
          theActions += ' Chat,';
        }
        if ( roomDefaults.snagMeansActive === true ) {
          theActions += ' Grab a song,';
        }
        theActions = theActions.substring( 0, theActions.length - 1 );
        const lastComma = theActions.lastIndexOf( ',' );
        if ( lastComma !== -1 ) {
          theActions = theActions.substring( 0, lastComma ) + ' or' + theActions.substring( lastComma + 1 )
        }

        theActions += ' to show that you\'re awake';
        theMessage += theActions;
      } else {
        theMessage = 'You are over the idle limit of ' + idleLimit + ' minutes.';
      }

      await chatFunctions.botSpeak( '@' + await this.getUsername( userID ) + ' ' + theMessage, roomDefaults.warnIdlePublic, userID );
    },

    checkHasUserIdledOut: function ( userID, threshold ) {
      let totalIdleAllowed = this.djIdleLimit();
      return this.getIdleTime( userID ) / 60 > ( totalIdleAllowed - threshold );
    },

    //removes idle dj's after roomDefaultsModule.djIdleLimit is up.
    idledOutDJCheck: async function ( roomDefaults, chatFunctions, databaseFunctions, socket ) {
      let totalIdleAllowed = this.djIdleLimit();
      let firstWarning = this.idleFirstWarningTime();
      let finalWarning = this.idleSecondWarningTime();
      let userID;

      for ( let djLoop = 0; djLoop < djList.length; djLoop++ ) {
        userID = djList[ djLoop ]; //Pick a DJ
        if ( userID !== authModule.USERID ) {
          let idleTImeInMinutes = await this.getIdleTime( userID ) / 60;
          if ( idleTImeInMinutes > totalIdleAllowed ) {
            await this.idleWarning( userID, djIdleLimit, chatFunctions );
            await this.removeDJ( userID, 'DJ has idled out', socket ); //remove them
            await chatFunctions.botChat( 'The user ' + '@' + await this.getUsername( userID ) + ' was removed for' +
              ' being' +
              ' over' +
              ' the ' + totalIdleAllowed + ' minute idle limit.' );
          } else if ( ( idleTImeInMinutes > finalWarning ) && !await this.hasDJHadSecondIdleWarning( userID ) ) {
            await this.setDJSecondIdleWarning( userID, databaseFunctions );
            await this.idleWarning( userID, finalWarning, chatFunctions );
          } else if ( ( idleTImeInMinutes > firstWarning ) && !await this.hasDJHadFirstIdleWarning( userID ) ) {
            await this.setDJFirstIdleWarning( userID, databaseFunctions );
            await this.idleWarning( userID, firstWarning, chatFunctions );
          } else if ( idleTImeInMinutes < firstWarning && ( await this.hasDJHadFirstIdleWarning( userID ) || await this.hasDJHadSecondIdleWarning( userID ) ) ) {
            await this.resetDJIdleWarnings( userID, databaseFunctions );
          }
        }
      }
    },

    setDJFirstIdleWarning: async function ( userID, databaseFunctions ) {
      if ( await this.userExists( userID ) ) {
        await this.storeUserData( userID, "firstIdleWarning", true, databaseFunctions );
      }
    },

    hasDJHadFirstIdleWarning: async function ( userID ) {
      if ( await this.userExists( userID ) ) {
        return theUsersList[ this.getPositionOnUsersList( userID ) ][ 'firstIdleWarning' ];
      }
    },

    setDJSecondIdleWarning: async function ( userID, databaseFunctions ) {
      if ( await this.userExists( userID ) ) {
        await this.storeUserData( userID, "secondIdleWarning", true, databaseFunctions );
      }
    },

    hasDJHadSecondIdleWarning: async function ( userID ) {
      if ( await this.userExists( userID ) ) {
        return theUsersList[ this.getPositionOnUsersList( userID ) ][ 'secondIdleWarning' ];
      }
    },

    resetDJIdleWarnings: async function ( userID, databaseFunctions ) {
      await this.clearDJFirstIdleWarning( userID, databaseFunctions );
      await this.clearDJSecondIdleWarning( userID, databaseFunctions );
    },

    clearDJFirstIdleWarning: async function ( userID, databaseFunctions ) {
      if ( await this.userExists( userID ) ) {
        await this.storeUserData( userID, "firstIdleWarning", false, databaseFunctions );
      }
    },

    clearDJSecondIdleWarning: async function ( userID, databaseFunctions ) {
      if ( await this.userExists( userID ) ) {
        await this.storeUserData( userID, "secondIdleWarning", false, databaseFunctions );
      }
    },

    //this removes people on the floor, not the djs
    roomIdleCheck: async function ( roomDefaults, chatFunctions ) {
      if ( roomDefaults.roomIdle === true ) {
        let theUserID;
        for ( let userLoop = 0; userLoop < theUsersList.length; userLoop++ ) {
          theUserID = theUsersList[ userLoop ].id;

          if ( theUserID !== authModule.USERID ) {
            if ( this.checkHasUserIdledOut( theUserID, roomDefaults.roomIdleLimit, 0 ) ) {
              await this.idleWarning( theUserID, 0, roomDefaults.roomIdleLimit, chatFunctions )
              bot.boot( theUserID, 'you are over the idle limit' );
            } else if ( this.checkHasUserIdledOut( theUserID, roomDefaults.roomIdleLimit, 1 ) ) {
              await this.idleWarning( theUserID, 1, roomDefaults.roomIdleLimit, chatFunctions )
            } else if ( this.checkHasUserIdledOut( theUserID, roomDefaults.roomIdleLimit, 5 ) ) {
              await this.idleWarning( theUserID, 5, roomDefaults.roomIdleLimit, chatFunctions )
            }
          }
        }
      }
    },

    // ========================================================

    // ========================================================
    // User Timer functions
    // ========================================================

    isUsersWelcomeTimerActive: function ( userID ) {
      return theUsersList[ this.getPositionOnUsersList( userID ) ][ 'welcomeTimer' ] === true;
    },

    activateUsersWelcomeTimer: async function ( userID, databaseFunctions ) {
      await this.storeUserData( userID, "welcomeTimer", true, databaseFunctions );

      setTimeout( async function () {
        await this.clearUsersWelcomeTimer( userID, databaseFunctions );
      }.bind( this ), 5 * 60 * 1000 );
    },

    clearUsersWelcomeTimer: async function ( userID, databaseFunctions ) {
      await this.storeUserData( userID, "welcomeTimer", false, databaseFunctions );
    },

    // ========================================================

    // ========================================================
    // AFK Functions (for the afk command)
    // ========================================================

    afkPeople: () => afkPeople,
    resetAFKPeople: function () {
      afkPeople = []
    },

    whosAFK: async function ( data, chatFunctions ) {
      let userList = '';
      let afkCount = 0;
      for ( let userLoop = 0; userLoop < this.afkPeople().length; userLoop++ ) {
        afkCount++;
        userList += await this.getUsername( this.afkPeople()[ userLoop ] ) + ', ';
      }

      userList = userList.substring( 0, userList.length - 2 );
      const lastComma = userList.lastIndexOf( ',' );
      if ( lastComma !== -1 ) {
        userList = userList.substring( 0, lastComma ) + ' and' + userList.substring( lastComma + 1 )
      }

      if ( afkCount > 0 ) {
        if ( afkCount === 1 ) {
          userList += ' is';
        } else {
          userList += ' are';
        }
        userList += ' marked as AFK';
        await chatFunctions.botSpeak( userList )
      } else {
        await chatFunctions.botSpeak( "No one...everyone's here :-)" )
      }
    },

    isUserAFK: function ( userID ) {
      let isAlreadyAfk = afkPeople.indexOf( userID );
      return isAlreadyAfk !== -1;
    },

    switchUserAFK: async function ( data, chatFunctions ) {
      const theUserID = this.whoSentTheCommand( data );
      if ( this.isUserAFK( theUserID ) === true ) {
        await this.removeUserFromAFKList( data, chatFunctions );
      } else {
        await this.addToAFKList( data, chatFunctions );
      }
    },

    addToAFKList: async function ( data, chatFunctions ) {
      const theUserID = this.whoSentTheCommand( data );

      afkPeople.push( theUserID );
      await chatFunctions.botSpeak( '@' + await this.getUsername( theUserID ) + ' you are marked as afk' )
    },

    removeUserFromAFKList: async function ( data, chatFunctions ) {
      const theUserID = this.whoSentTheCommand( data );
      await this.removeUserIDFromAFKArray( theUserID );
      await chatFunctions.botSpeak( '@' + await this.getUsername( theUserID ) + ' you are no longer afk' )
    },

    removeUserIDFromAFKArray: async function ( theUserID ) {
      const listPosition = afkPeople.indexOf( theUserID );
      afkPeople.splice( listPosition, 1 );
    },

    howManyAFKUsers: function () {
      return afkPeople.length;
    },

    sendUserIsAFKMessage: async function ( data, userID, chatFunctions ) {
      await chatFunctions.botSpeak( '@' + await this.getUsername( userID ) + ' is currently AFK, sorry' )
    },

    // ========================================================

    // ========================================================
    // DJ Core Functions
    // ========================================================

    djList: () => djList,

    clearDJList: function () {
      djList = []
    },

    addDJToList: function ( userID ) {
      djList.push( userID );
    },

    removeDJFromList: async function ( userID, databaseFunctions ) {
      await this.storeUserData( userID, "currentDJ", false, databaseFunctions );
      const listPosition = djList.indexOf( userID )
      if ( listPosition !== -1 ) {
        djList.splice( listPosition, 1 );
      }
    },

    howManyDJs: function () {
      return djList.length;
    },

    clearCurrentDJFlags: async function ( databaseFunctions ) {
      for ( let userLoop = 0; userLoop < theUsersList.length; userLoop++ ) {
        await this.storeUserData( theUsersList[ userLoop ][ 'id' ], "currentDJ", false, databaseFunctions );
      }
    },

    setCurrentDJID: async function ( userID, databaseFunctions ) {
      await this.clearCurrentDJFlags( databaseFunctions )
      if ( await this.userExists( userID ) ) {
        await this.storeUserData( userID, "currentDJ", true, databaseFunctions );
      }
    },

    getCurrentDJID: async function ( ) {
      for ( let userLoop = 0; userLoop < theUsersList.length; userLoop++ ) {
        if ( theUsersList[ userLoop ][ 'currentDJ' ] === true ) {
          return theUsersList[ userLoop ][ 'id' ];
        }
      }
      return null;
    },

    getLastDJID: function () {
      return djList[ this.howManyDJs() - 1 ];
    },

    lastDJPlaying: async function () {
      return await this.getCurrentDJID() === this.getLastDJID();
    },

    getNextDJ: function () {
      let nextDJID;
      const currentDJID = this.getCurrentDJID();
      const currentDJPosition = djList.indexOf( currentDJID );

      nextDJID = djList[ currentDJPosition + 1 ];

      if ( nextDJID + 1 > this.howManyDJs() || nextDJID === undefined ) {
        nextDJID = djList[ 0 ];
      }

      return nextDJID;
    },

    // ========================================================

    // ========================================================
    // DJ Helper Functions
    // ========================================================

    isUserIDStageBanned: function ( userID ) {
      const stageBanned = permanentStageBan.findIndex( ( { id } ) => id === userID );
      return stageBanned !== -1;
    },

    isUserBannedFromRoom: function ( userID ) {
      return bannedUsers.some( ( { id } ) => id === userID );
    },

    isUserIDOnStage: async function ( userID ) {
      const onStage = djList.indexOf( userID );
      return onStage !== -1;
    },

    isCurrentDJ: function ( data, userID ) {
      const currentDJ = data.room.metadata.current_dj
      return userID === currentDJ;
    },

    resetDJs: function ( data ) {
      this.clearDJList();

      for (const item of data) {
        if (item.uuid) {
          if ( typeof item.uuid !== 'undefined' ) {
            this.addDJToList( item.uuid );
          }
        }
      }
    },

    checkOKToDJ: async function ( theUserID, roomFunctions ) {
      if ( theUserID === authModule.USERID ) {
        return [ true, '' ];
      }

      if ( superDJs.includes( theUserID ) ) {
        return [ true, '' ];
      }

      if ( !this.isUserVIP( theUserID ) && roomDefaults.vipsOnly ) {
        return [ false, "The VIP list is active...and you're not on the list. Sorry!" ];
      }

      if ( roomDefaults.queueActive ) {
        if ( await this.isUserInRefreshList( theUserID ) ) {
          return [ true, '' ];
        }

        if ( this.isUserIDInQueue( theUserID ) ) {
          if ( theUserID !== this.headOfQueue() ) {
            return [ false, '@' + await this.getUsername( theUserID ) + ', sorry, but you are not first in queue.' +
            ' please' +
            ' wait your turn.' ];
          } else {
            return [ true, '' ];
          }
        } else {
          return [ false, '@' + await this.getUsername( theUserID ) + ', the queue is currently active. To add' +
          ' yourself' +
          ' to' +
          ' the queue type ' + commandIdentifier + 'addme. To remove yourself from the queue type' +
          ' ' + commandIdentifier + 'removeme.' ];
        }
      }

      if ( this.refreshDJCount() + this.djList().length >= roomFunctions.maxDJs() ) {
        return [ false, '@' + await this.getUsername( theUserID ) + ', sorry, but I\'m holding that spot for someone' +
        ' in' +
        ' the refresh list' ];
      }

      for ( let banLoop = 0; banLoop < roomFunctions.tempBanList().length; banLoop++ ) {
        if ( theUserID === roomFunctions.tempBanList()[ banLoop ] ) {
          return [ false, '@' + await this.getUsername( theUserID ) + ', you are banned from djing. Please speak to a' +
          ' Mod' +
          ' to find out why' ];
        }
      }

      if ( this.isUserIDStageBanned( theUserID ) ) {
        return [ false, '@' + await this.getUsername( theUserID ) + ', you are banned from djing. Please speak to a' +
        ' Mod' +
        ' to find out why' ];
      }

      if ( await this.getUserSpamCount( theUserID ) >= roomDefaults.spamLimit ) {
        return [ false, '@' + await this.getUsername( theUserID ) + ', you\'ve been SPAMming too much...please want a' +
        ' few' +
        ' minutes before trying again' ];
      }

      return [ true, '' ];
    },

    resetDJFlags: async function ( userID, databaseFunctions ) {
      if ( await this.userExists( ( userID ) ) ) {
        await this.resetDJCurrentPlayCount( userID, databaseFunctions );
        await this.clearDJFirstIdleWarning( userID, databaseFunctions );
        await this.clearDJSecondIdleWarning( userID, databaseFunctions );
      }
    },

    removeDJ: async function ( djID, message, socket ) {
      console.group( '! removeDJ ===============================' );
      console.log( '========================================' );

      console.log( 'DJ removed at ' + moment().format( 'DD/MM/yyyy HH:mm:ss' ) );
      console.log( 'The DJ ' + await this.getUsername( djID ) + ' with ID ' + djID + ' is being removed from the' +
        ' decks' );
      console.log( 'Reason: ' + message );

      await socket.action( ActionName.removeDj, {
        roomUuid: botDefaults.roomUuid,
        userUuid: botDefaults.botUuid,
        djUuid: djID
      } );

      console.log( '========================================' );
      console.groupEnd();
    },

    // ========================================================

    // ========================================================
    // DJ Play Limit Functions
    // ========================================================

    removeDJsOverPlaylimit: async function ( data, chatFunctions, userID, socket ) {
      if ( this.DJPlaysLimited() === true && !superDJs.includes( userID ) ) {

        if ( userID !== authModule.USERID && this.isCurrentDJ( data, userID ) && await this.getDJCurrentPlayCount( userID ) >= this.DJsPlayLimit() ) {
          if ( await this.userExists( userID ) ) {
            await chatFunctions.overPlayLimit( data, this.getUsername( userID ), this.DJsPlayLimit() );

            await this.removeDJ( userID, 'DJ is over play limit', socket );
          }
        }
      }
    },

    DJPlaysLimited: () => DJPlaysLimited,
    enablePlayLimit: function () {
      DJPlaysLimited = true;
    },
    disablePlayLimit: function () {
      DJPlaysLimited = false;
    },

    DJsPlayLimit: () => DJsPlayLimit,
    setDJsPlayLimit: function ( value ) {
      DJsPlayLimit = value;
    },

    playLimitOnCommand: async function ( data, args, chatFunctions ) {
      let theNewPlayLimit = args[ 0 ];
      if ( isNaN( theNewPlayLimit ) ) {
        theNewPlayLimit = musicDefaults.DJsPlayLimit
      }
      this.enablePlayLimit();
      this.setDJsPlayLimit( theNewPlayLimit );
      await chatFunctions.botSpeak( 'The play limit is now set to ' + this.DJsPlayLimit() );
    },

    playLimitOffCommand: async function ( data, chatFunctions ) {
      this.disablePlayLimit();
      await chatFunctions.botSpeak( 'The play limit is now disabled' );
    },

    whatsPlayLimit: async function ( data, chatFunctions ) {
      if ( this.DJPlaysLimited() ) {
        await chatFunctions.botSpeak( 'The DJ play limit is currently set to ' + this.DJsPlayLimit() );
      } else {
        await chatFunctions.botSpeak( 'The DJ play limit is not currently active' );
      }
    },

    // ========================================================

    // ========================================================
    // DJ Play Count Functions
    // ========================================================

    deleteAllDJsPlayCounts: async function ( databaseFunctions ) {
      for ( let userLoop = 0; userLoop < theUsersList.length; userLoop++ ) {
        await this.deleteAllDJPlayCounts( theUsersList[ userLoop ][ 'id' ], databaseFunctions );
      }
    },

    initialiseAllDJPlayCounts: async function ( userID, databaseFunctions ) {
      if ( await this.isUserInUsersList( userID ) ) {
        this.setDJCurrentPlayCount( userID, 0, databaseFunctions );
        await this.setDJTotalPlayCount( userID, 0, databaseFunctions );
      }
    },

    incrementDJPlayCount: async function ( userID, databaseFunctions ) {
      if ( await this.userExists( userID ) ) {
        if ( isNaN( theUsersList[ this.getPositionOnUsersList( userID ) ][ 'currentPlayCount' ] ) ) {
          this.setDJCurrentPlayCount( userID, 1, databaseFunctions );
        } else {
          await this.storeUserData( userID, "currentPlayCount", await this.getDJCurrentPlayCount( userID ) + 1, databaseFunctions );
        }

        if ( isNaN( theUsersList[ this.getPositionOnUsersList( userID ) ][ 'totalPlayCount' ] ) ) {
          await this.setDJTotalPlayCount( userID, 1, databaseFunctions );
        } else {
          await this.storeUserData( userID, "totalPlayCount", await this.getDJTotalPlayCount( userID ) + 1, databaseFunctions );
        }
      }
    },

    decrementDJCurrentPlayCount: async function ( userID, databaseFunctions ) {
      await this.storeUserData( userID, "currentPlayCount", await this.getDJCurrentPlayCount( userID ) - 1, databaseFunctions );
    },

    resetDJCurrentPlayCount: async function ( userID, databaseFunctions ) {
      if ( await this.userExists( userID ) ) {
        this.setDJCurrentPlayCount( userID, 0, databaseFunctions );
      }
    },

    setDJCurrentPlaycountCommand: async function ( data, theCount, theUsername, chatFunctions, databaseFunctions ) {
      if ( theCount === undefined || isNaN( theCount ) ) {
        await chatFunctions.botSpeak( "The new playcount doesn't seem to be a number. Check the command help for an" +
          " example" )
      } else if ( theUsername === '' || theUsername === undefined ) {
        await chatFunctions.botSpeak( "I can't see a username there. Check the command help for an example" )
      } else {
        await chatFunctions.botSpeak( "Setting the Current playcount for @" + theUsername + " to " + theCount )
        this.setDJCurrentPlayCount( await this.getUserIDFromUsername( theUsername ), theCount, databaseFunctions );
      }
    },

    setDJCurrentPlayCount: function ( userID, theCount, databaseFunctions ) {
      if ( theCount === undefined ) {
        theCount = 0
      }
      this.storeUserData( userID, "currentPlayCount", theCount, databaseFunctions )
    },

    resetDJTotalPlayCount: async function ( userID, databaseFunctions ) {
      if ( await this.userExists( userID ) ) {
        await this.setDJTotalPlayCount( userID, 0, databaseFunctions );
      }
    },

    setDJTotalPlayCount: async function ( userID, theCount, databaseFunctions ) {
      if ( theCount === undefined ) {
        theCount = 0
      }

      if ( await this.userExists( userID ) ) {
        await this.storeUserData( userID, "totalPlayCount", theCount, databaseFunctions )
      }
    },

    deleteAllDJPlayCounts: async function ( userID, databaseFunctions ) {
      await this.deleteUserData( databaseFunctions, userID, 'currentPlayCount' );
      await this.deleteUserData( databaseFunctions, userID, 'totalPlayCount' );
    },

    getDJCurrentPlayCount: async function ( userID ) {
      if ( await this.userExists( userID ) ) {
        return theUsersList[ this.getPositionOnUsersList( userID ) ][ 'currentPlayCount' ];
      }
    },

    getDJTotalPlayCount: async function ( userID ) {
      if ( await this.userExists( userID ) ) {
        return theUsersList[ this.getPositionOnUsersList( userID ) ][ 'totalPlayCount' ];
      }
    },

    djPlaysCommand: async function ( data, chatFunctions ) {
      await chatFunctions.botSpeak( this.buildDJPlaysMessage() );
    },

    buildDJPlaysMessage: function () {
      if ( this.djList().length === 0 ) {
        return 'There are no dj\'s on stage.';
      } else {
        let theMessage = '';
        let theUserID;
        let theUserPosition;
        let theUsername;
        let theCurrentPlayCount;
        let theTotalPlayCount;

        for ( let djLoop = 0; djLoop < this.djList().length; djLoop++ ) {
          theUserID = this.djList()[ djLoop ];
          theUsername = this.getUsername( theUserID );
          theUserPosition = this.getPositionOnUsersList( theUserID );
          theCurrentPlayCount = theUsersList[ theUserPosition ][ 'currentPlayCount' ];
          theTotalPlayCount = theUsersList[ theUserPosition ][ 'totalPlayCount' ];

          theMessage += theUsername + ': ' + theCurrentPlayCount;
          if ( theCurrentPlayCount !== theTotalPlayCount && theTotalPlayCount !== undefined ) {
            theMessage += '(' + theTotalPlayCount + '), ';
          } else {
            theMessage += ', ';
          }
        }

        theMessage = 'The play counts are now ' + theMessage.substring( 0, theMessage.length - 2 );
        return theMessage;
      }
    },

    // ========================================================

    // ========================================================
    // DJ Queue Core Functions
    // ========================================================

    queueList: () => queueList,

    resetQueueList: function () {
      queueList = []
    },

    addUserToQueue: function ( userID ) {
      if ( !roomDefaults.queueActive ) {
        return [ false, "the queue is disabled." ];
      }

      if ( this.isUserIDInQueue( userID ) === true ) {
        return [ false, "you are already in the queue." ];
      }

      if ( this.isUserIDOnStage( userID ) === true ) {
        return [ false, "you are already on stage!" ];
      }

      if ( this.isUserIDStageBanned( userID ) === true ) {
        return [ false, "sorry, you are banned from the stage." ];
      }

      queueList.push( userID );
      return [ true, '' ];
    },

    removeUserFromQueue: function ( userID, botFunctions ) {
      botFunctions.setSayOnce( true );
      if ( !this.isUserIDInQueue( userID ) ) {
        return [ true, "not in queue" ];
      } else {
        const queuePosition = queueList.indexOf( userID );
        queueList.splice( queuePosition, 1 );
        return [ false, '' ];
      }
    },

    isUserIDInQueue: function ( userID ) {
      const inQueue = queueList.indexOf( userID );
      return inQueue !== -1;
    },

    changeUsersQueuePosition: async function ( data, args, chatFunctions, botFunctions ) {
      const username = args[ 0 ];
      const userID = await this.getUserIDFromUsername( username );
      const newPosition = args[ 1 ] - 1;
      const [ err, ] = this.removeUserFromQueue( userID, botFunctions );

      if ( err !== true ) {
        queueList.splice( newPosition, 0, userID );
      } else {
        await chatFunctions.botSpeak( "The user " + await this.getUsername( userID ) + " is not currently in the" +
          " queue" );
      }
      this.readQueue( data, chatFunctions );
    },

    moveUserToHeadOfQueue: async function ( data, args, chatFunctions, botFunctions ) {
      args[ 1 ] = 1;
      await this.changeUsersQueuePosition( data, args, chatFunctions, botFunctions );
    },

    // ========================================================

    // ========================================================
    // DJ Queue Helper Functions
    // ========================================================

    headOfQueue: function () {
      return queueList[ 0 ];
    },

    notifyThisDJ: () => notifyThisDJ,

    setDJToNotify: function ( userID ) {
      notifyThisDJ = userID;
    },

    clearDJToNotify: function () {
      notifyThisDJ = null;
    },

    whatsMyQueuePosition: async function ( data, chatFunctions ) {
      const userID = this.whoSentTheCommand( data );

      if ( !roomDefaults.queueActive ) {
        await chatFunctions.botSpeak( '@' + await this.getUsername( userID ) + ', the queue is currently disabled' );
      } else {
        const queuePosition = queueList.findIndex( ( { id } ) => id === userID ) + 1;
        if ( queuePosition !== -1 ) {
          await chatFunctions.botSpeak( '@' + await this.getUsername( userID ) + ', you are currently at position ' + queuePosition + ' in the queue' );
        } else {
          await chatFunctions.botSpeak( '@' + await this.getUsername( userID ) + ', you are not currently in the' +
            ' queue' );
        }
      }
    },

    addme: function ( data, chatFunctions ) {
      const userID = this.whoSentTheCommand( data );

      const [ added, theMessage ] = this.addUserToQueue( userID );

      if ( added === true ) {
        this.readQueue( data, chatFunctions )
      } else {
        chatFunctions.botSpeak( theMessage );
      }
    },

    removeNotifyDJFromQueue: async function ( botFunctions, userFunctions ) {
      await chatFunctions.botSpeak( 'Sorry @' + await userFunctions.getUsername( this.notifyThisDJ().toString() ) + ' you' +
        ' have run out of time.' );
      this.removeUserFromQueue( this.notifyThisDJ(), botFunctions );
      this.clearDJToNotify();
      botFunctions.setSayOnce( true );
    },

    removeme: async function ( data, chatFunctions, botFunctions ) {
      const userID = this.whoSentTheCommand( data );
      if ( this.isUserIDInQueue( userID ) ) {
        this.removeUserFromQueue( userID, botFunctions )
        await chatFunctions.botSpeak( "@" + await this.getUsername( userID ) + ', I\'ve removed you from the queue' );
      } else {
        await chatFunctions.botSpeak( "@" + await this.getUsername( userID ) + ', you\'re not currently in the queue.' +
          ' Use' +
          ' the' +
          ' ' + commandIdentifier + 'addme command to join' );
      }
      await this.readQueue( data, chatFunctions )
    },

    enableQueue: async function ( data, chatFunctions ) {
      if ( roomDefaults.queueActive === true ) {
        await chatFunctions.botSpeak( "The queue is already enabled" );
      } else {
        roomDefaults.queueActive = true;
        await chatFunctions.botSpeak( "The queue is now on" );
      }
    },

    disableQueue: async function ( data, chatFunctions ) {
      if ( roomDefaults.queueActive !== true ) {
        await chatFunctions.botSpeak( "The queue is already disabled" );
      } else {
        roomDefaults.queueActive = false;
        await chatFunctions.botSpeak( "The queue is now off" );
      }
    },

    readQueue: async function ( data, chatFunctions ) {
      if ( roomDefaults.queueActive === true ) {
        await chatFunctions.botSpeak( this.buildQueueMessage() );
      } else {
        await chatFunctions.botSpeak( "The DJ queue is not active" );
      }
    },

    buildQueueMessage: async function () {
      let listOfUsers = '';
      let message;
      let thisQueuePosition = 1;

      queueList.forEach( async function ( userID ) {
        if ( listOfUsers === '' ) {
          listOfUsers = '[' + thisQueuePosition + '] ' + await this.getUsername( userID );
        } else {
          listOfUsers = listOfUsers + ', [' + thisQueuePosition + '] ' + await this.getUsername( userID );

        }
        thisQueuePosition++;
      }.bind( this ) );

      if ( listOfUsers !== '' ) {
        message = "The DJ queue is currently: " + listOfUsers;
      } else {
        message = "The DJ queue is empty...";
      }

      return message;
    },

    // ========================================================

    // ========================================================
    // User Object Functions
    // ========================================================

    resetUsersList: function () {
      theUsersList.splice( 0, theUsersList.length );
    },

    updatedUserData: async function ( jsonData, databaseFunctions ) {
      // Parse the JSON data if it's a string
      const data = typeof jsonData === 'string' ? JSON.parse( jsonData ) : jsonData;

      // Check if the data has the statePatch array
      if ( data.statePatch && Array.isArray( data.statePatch ) ) {
        // Iterate through the statePatch array
        for ( const patch of data.statePatch ) {
          // Check if the patch operation is "add" and it has a value
          if ( patch.op === 'add' && patch.value && patch.value.userProfile ) {
            const userProfile = patch.value.userProfile;
            const user = {
              name: userProfile.nickname,
              userid: userProfile.uuid
            };

            try {
              await this.updateUser( user, databaseFunctions );
            } catch ( error ) {
              console.error( `Failed to update user ${ userProfile.nickname } (${ userProfile.uuid }):`, error );
            }
          }
        }
      } else {
        console.error( 'Invalid data format' );
      }
    },

    updateUser: async function ( data, databaseFunctions ) {
      if ( typeof data.name === 'string' ) {
        let oldname = ''; // holds users old name if exists
        let queueNamePosition;
        let queueListPosition;
        let afkPeoplePosition;

        // when person updates their profile
        // and their name is not found in the users list then they must have changed
        // their name
        if ( theUsersList.indexOf( data.name ) === -1 ) {
          let nameIndex = theUsersList.indexOf( data.userid );
          if ( nameIndex !== -1 ) // if their userid was found in theUsersList
          {
            oldname = theUsersList[ nameIndex + 1 ];
            await this.storeUserData( data.userid, "username", data.name, databaseFunctions );

            if ( typeof oldname !== 'undefined' ) {
              queueNamePosition = userFunctions.queueName().indexOf( oldname );
              queueListPosition = userFunctions.queueList().indexOf( oldname );
              afkPeoplePosition = afkPeople.indexOf( oldname );

              if ( queueNamePosition !== -1 ) //if they were in the queue when they changed their name, then replace their name
              {
                userFunctions.queueName()[ queueNamePosition ] = data.name;
              }

              if ( queueListPosition !== -1 ) //this is also for the queue
              {
                userFunctions.queueList()[ queueListPosition ] = data.name;
              }

              if ( afkPeoplePosition !== -1 ) //this checks the afk list
              {
                afkPeople[ afkPeoplePosition ] = data.name;
              }
            }
          } else {
            await this.userJoinsRoom( roomFunctions, databaseFunctions )
          }
        }
      }
    },

    deregisterUser: async function ( userID, databaseFunctions ) {
      //double check to make sure that if someone is on stage and they disconnect, that they are being removed
      //from the current Dj's array
      let checkIfStillInDjArray = djList.indexOf( userID );
      if ( checkIfStillInDjArray !== -1 ) {
        djList.splice( checkIfStillInDjArray, 1 );
      }

      if ( this.isUserAFK( userID ) ) {
        await this.removeUserIDFromAFKArray( userID );
      }

      //removes people leaving the room in modpm still
      if ( modPM.length !== 0 ) {
        let areTheyStillInModpm = modPM.indexOf( userID );

        if ( areTheyStillInModpm !== -1 ) {
          let whatIsTheirName = theUsersList.indexOf( userID );
          modPM.splice( areTheyStillInModpm, 1 );

          if ( whatIsTheirName !== -1 ) {
            for ( let hg = 0; hg < modPM.length; hg++ ) {
              if ( typeof modPM[ hg ] !== 'undefined' && modPM[ hg ] !== userID ) {
                bot.pm( theUsersList[ whatIsTheirName + 1 ] + ' has left the modpm chat', modPM[ hg ] );
              }
            }
          }
        }
      }

      await this.removeUserIsHere( userID, databaseFunctions );
      await this.removeUserFromUsersList( userID )
    },

    bootNewUserCheck: function ( userID, username ) {
      let bootUser = false;
      let bootMessage = null;

      if ( roomDefaults.kickTTSTAT === true && username === "@ttstat" ) {
        bootUser = true;
      }

      //checks to see if user is on the blacklist, if they are they are booted from the room.
      for ( let i = 0; i < roomDefaults.blackList.length; i++ ) {
        if ( userID === roomDefaults.blackList[ i ] ) {
          bootUser = true;
          bootMessage = 'You are on the user banned list.';
          break;
        }
      }

      //checks if user is on the banned list
      const thisUserIsBanned = this.isUserBannedFromRoom( userID );
      if ( thisUserIsBanned ) {
        bootUser = true;
        bootMessage = 'You are on the banned user list.';
      }

      // don't let the bot boot itself!
      if ( userID === authModule.USERID ) {
        bootUser = false;
      }
      return [ bootUser, bootMessage ];
    },

    bootThisUser: async function ( userID, bootMessage ) {

      const bootPayload = `{ "userUuid": "${userID}" }`
      const url = "https://api.prod.tt.fm/users/kick"
      console.group( "! bootThisUser ===============================" );
      console.log( '========================================' );
      console.log( "Booting userID:" + userID );

      await this.apiPost( url, bootPayload )

      // need to figure out PMs to do this bit
      // if ( bootMessage == null ) {
      // } else {
      //   console.log( "Booting userID:" + userID + " with message:" + bootMessage );
      //   bot.bootUser( userID, bootMessage );
      // }
      console.groupEnd();
    },

    greetNewuser: function ( userID, username, roomFunctions ) {
      //gets newest user and prints greeting, does not greet the bot or the ttstats bot, or banned users
      if ( roomFunctions.greet() === true && userID !== authModule.USERID && !username.match( '@ttstat' ) ) {
        const greetingTimers = roomFunctions.greetingTimer();

        // if there's a timeout function waiting to be called for
        // this user, cancel it.
        if ( greetingTimers[ userID ] !== null ) {
          clearTimeout( greetingTimers[ userID ] );
          delete greetingTimers[ userID ];
        }

        return true;
      }
    },

    addUserJoinedTime: async function ( userID, databaseFunctions ) {
      if ( await this.userExists( userID ) && !await this.getUserJoinedRoom( userID ) ) {
        await this.storeUserData( userID, "joinTime", Date.now(), databaseFunctions )
      }
    },

    getPositionOnUsersList: function ( userID ) {
      return theUsersList.findIndex( ( { id } ) => id === userID )
    },

    userJoinsRoom: async function ( userProfile, roomFunctions, databaseFunctions ) {
      const userID = userProfile.uuid
      const username = userProfile.nickname
      console.log( `userJoinsRoom: ${ username } joined` )

      const userFromDatabase = await databaseFunctions.loadUserFromDatabase( userID )
      if ( userFromDatabase !== undefined ) {
        theUsersList.push( userFromDatabase );
      }

      //adds users who join the room to the user list if their not already on the list
      await this.addUserToTheUsersList( userID, username, databaseFunctions );

      // if they've previously been in the room as a guest we won't have their name
      // best update it from the raw data that was passed into this function to be sure
      await this.updateUsername( userID, username, databaseFunctions );

      //starts time for everyone that joins the room
      await this.addUserJoinedTime( userID, databaseFunctions );

      //sets new persons spam count to zero
      await this.resetUsersSpamCount( userID, databaseFunctions );

      // remove the user from afk, just in case it was hanging around from a previous visit
      if ( this.isUserAFK( userID ) ) {
        await this.removeUserIDFromAFKArray( userID );
      }

      await this.updateModeratorStatus( userID, roomFunctions )

      await this.addUserIsHere( userID, databaseFunctions );
    },
    
    userLeavesRoom: async function( uuid, roomFunctions, databaseFunctions ) {
      console.log(`${ uuid } left...`)
    },

    updateUsername: async function ( userID, username, databaseFunctions ) {
      if ( await this.userExists( userID ) ) {
        await this.storeUserData( userID, "username", username, databaseFunctions );
      }
    },

    isUserHere: function ( userID ) {
      if ( this.userExists( userID ) ) {
        return theUsersList[ this.getPositionOnUsersList( userID ) ][ 'here' ];
      }
    },

    addUserIsHere: async function ( userID, databaseFunctions ) {
      if ( this.userExists( userID ) ) {
        await this.storeUserData( userID, "here", true, databaseFunctions );
      }
    },

    removeUserIsHere: async function ( userID, databaseFunctions ) {
      if ( await this.userExists( userID ) ) {
        await this.deleteUserData( databaseFunctions, userID, "here" );
      }
    },

    checkForEmptyUsersList: async function ( data, databaseFunctions ) {
      if ( theUsersList.length === 0 ) {
        await this.rebuildUserList( data, databaseFunctions );
      }
    },

    isUserInUsersList: async function ( userID ) {
      return theUsersList.find( ( { id } ) => id === userID ) !== undefined;
    },

    addUserToTheUsersList: async function ( userID, userProfile ) {
      console.log(`addUserToTheUsersList userID:${userID}`)
      if ( !await this.isUserInUsersList( userID ) ) {
        theUsersList.push( { id: userID, username: userProfile.username } );
      }
    },
    
    removeUserFromUsersList: async function( userID ) {
      if (await this.isUserInUsersList(userID)) {
        const userIndex = theUsersList.findIndex(user => user.id === userID);

        if (userIndex !== -1) {
          theUsersList.splice(userIndex, 1);
        }
      }
    },

    rebuildUserList: async function ( data, databaseFunctions ) {
      console.log(`rebuildUserList here`)
      let userID

      console.log(`rebuildUserList data.allUsers.length:${data.allUsers.length}`)
      for ( let i = 0; i < data.allUsers.length; i++ ) {
        if ( typeof data.allUsers[ i ] !== 'undefined' ) {
          userID = data.allUsers[ i ].uuid
          console.log(`rebuildUserList userID:${userID}`)

          const userProfile = await this.getUserProfileFromAPI( userID )
          console.log(`rebuildUserList userProfile:${JSON.stringify(userProfile, null, 2)}`)

          const userFromDatabase = await databaseFunctions.loadUserFromDatabase( userID )
          console.log(`rebuildUserList userFromDatabase:${JSON.stringify(userFromDatabase, null, 2)}`)

          if ( userFromDatabase !== undefined ) {
            theUsersList.push( userFromDatabase );
          }

          if ( userProfile !== undefined ) {
            if ( !await this.userExists( userID ) ) {
              await this.addUserToTheUsersList( userID, userProfile )
            }
          }

          if ( userProfile !== undefined && userFromDatabase !== undefined ) {
            await this.updateUserFromProfile( userProfile, databaseFunctions )
          }
        }
      }
    },

    startAllUserTimers: async function ( databaseFunctions ) {
      //starts time in room for everyone currently in the room
      for ( let userLoop = 0; userLoop < theUsersList.length; userLoop++ ) {
        if ( typeof theUsersList[ userLoop ].id !== 'undefined' ) {
          await this.addUserJoinedTime( theUsersList[ userLoop ].id, databaseFunctions );
        }
      }
    },

    // ========================================================

    // ========================================================
    // Other User Functions
    // ========================================================

    checkTextForUsernames: function ( theText ) {
      let loopUsername;
      let mentions = [];

      if ( theText.indexOf( '@' ) !== -1 ) {
        for ( let afkPeopleLoop = 0; afkPeopleLoop < afkPeople.length; afkPeopleLoop++ ) {
          loopUsername = this.getUsername( afkPeople[ afkPeopleLoop ] );
          if ( theText.indexOf( '@' + loopUsername ) !== -1 ) {
            mentions.push( loopUsername );
          }
        }
      }

      return mentions;
    },

    // ========================================================

    // ========================================================
    // Inform Functions
    // ========================================================

    clearInformTimer: async function ( roomFunctions, chatFunctions ) {
      //this is for the /inform command
      if ( informTimer !== null ) {
        clearTimeout( informTimer );
        informTimer = null;

        if ( typeof theUsersList[ theUsersList.indexOf( roomFunctions.lastdj() ) + 1 ] !== 'undefined' ) {
          await chatFunctions.botSpeak( "@" + theUsersList[ theUsersList.indexOf( roomFunctions.lastdj() ) + 1 ] + ", Thanks buddy ;-)" );
        } else {
          await chatFunctions.botSpeak( 'Thanks buddy ;-)' );
        }
      }
    },

    // ========================================================

    // ========================================================
    // Warn Me Functions
    // ========================================================

    warnMeCall: function ( roomFunctions ) {
      if ( warnme.length !== 0 ) //is there anyone in the warnme?
      {
        let whatIsPosition = djList.indexOf( roomFunctions.checkWhoIsDj() ); //what position are they

        if ( whatIsPosition === djList.length - 1 ) //if 5th dj is playing, check guy on the left
        {
          let areTheyNext = warnme.indexOf( djList[ 0 ] );
          if ( areTheyNext !== -1 ) //is the next dj up in the warnme?
          {
            bot.pm( 'your song is up next!', djList[ 0 ] );
            warnme.splice( areTheyNext, 1 );

          }
        } else {
          let areTheyNext = warnme.indexOf( djList[ whatIsPosition + 1 ] );
          if ( areTheyNext !== -1 ) //is the next dj up in the warnme?
          {
            bot.pm( 'your song is up next!', djList[ whatIsPosition + 1 ] );
            warnme.splice( areTheyNext, 1 );

          }
        }
      }
    },

    resetAllWarnMe: function ( data, databaseFunctions ) {
      let theUserID;
      if ( data.room !== undefined ) {
        for ( let userLoop = 0; userLoop < data.users.length; userLoop++ ) {
          theUserID = data.users[ userLoop ];
          if ( typeof theUserID !== 'undefined' ) {
            this.removeWarnMeFromUser( theUserID, databaseFunctions );
          }
        }
      }
    },

    addWarnMeToUser( userID, databaseFunctions ) {
      if ( this.isUserInUsersList( userID ) ) {
        this.storeUserData( userID, "WarnMe", true, databaseFunctions );
      }
    },

    removeWarnMeFromUser( userID, databaseFunctions ) {
      if ( this.isUserInUsersList( userID ) ) {
        this.deleteUserData( databaseFunctions, userID, "WarnMe" );
      }
    },

    // ========================================================

    // ========================================================
    // Escort Me Functions
    // ========================================================

    resetAllEscortMe: async function ( data, databaseFunctions ) {
      let theUserID;
      if ( data.room !== undefined ) {
        for ( let userLoop = 0; userLoop < data.users.length; userLoop++ ) {
          theUserID = data.users[ userLoop ];
          if ( typeof theUserID !== 'undefined' ) {
            await this.removeEscortMeFromUser( theUserID, databaseFunctions );
          }
        }
      }
    },

    addEscortMeToUser: async function ( userID, databaseFunctions ) {
      if ( await this.isUserInUsersList( userID ) ) {
        await this.storeUserData( userID, "EscortMe", true, databaseFunctions );
      }
    },

    removeEscortMeFromUser: async function ( userID, databaseFunctions ) {
      if ( await this.isUserInUsersList( userID ) ) {
        await this.deleteUserData( databaseFunctions, userID, "EscortMe" );
      }
    },

    escortMeIsEnabled: async function ( userID ) {
      if ( await this.isUserInUsersList( userID ) ) {
        return theUsersList[ this.getPositionOnUsersList( userID ) ][ 'EscortMe' ] === true;
      }
    },

    // ========================================================

    // ========================================================
    // Special Functions
    // ========================================================

    bbUserID: async function () {
      return "da447bd2-5dbb-45f7-a591-c3756a8c4a84";
    },

    bbBoot: async function ( data, chatFunctions, databaseFunctions ) {
      console.group('bbBoot')
      const bootingUserID = await this.whoSentTheCommand( data );
      console.log(`bootingUserID:${bootingUserID}`)
      const bbID = await this.bbUserID()
      console.log(`bbID:${bbID}`)
      const bbUsername = await this.getUsername( bbID )
      console.log(`bbUsername:${bbUsername}`)

      if ( bootingUserID === bbID ) {
        await chatFunctions.botSpeak( `You can't boot yourself @${bbUsername}, you ain't that flexible!` );
      } else if ( bootingUserID === authModule.USERID ) {
        // you can't use the bot to speak the boot command
        await chatFunctions.botSpeak( "Yeah, nope..." );
      } else {
        if ( await this.isBBHere() ) {
          if ( await this.canBBBoot( bootingUserID ) ) {
            if ( await this.canBBBeBooted() ) {
              const bootMessage = "Sorry @${bbUsername}, you got booted by @" + await this.getUsername( bootingUserID ) + ". They win 5 RoboCoins!!!";
              await this.bbBootSomeone( data, bbID, bootingUserID, bootMessage, chatFunctions, databaseFunctions );
            } else {
              const bootMessage = "Sorry " + await this.getUsername( bootingUserID ) + ", you lose. @${bbUsername} was booted" +
                " within the last 24Hrs. @${bbUsername} wins 1 RoboCoin!";
              await this.bbBootSomeone( data, bootingUserID, bootingUserID, bootMessage, chatFunctions, databaseFunctions );
            }
          } else {
            const bbbootedTimestamp = await this.getBBBootedTimestamp( bootingUserID );
            console.log(`bbbootedTimestamp:${bbbootedTimestamp}`)
            const msSinceLastBoot = Date.now() - bbbootedTimestamp;
            console.log(`msSinceLastBoot:${msSinceLastBoot}`)
            const formattedLastBBBooted = formatRelativeTime( msSinceLastBoot / 1000 );
            console.log(`formattedLastBBBooted:${formattedLastBBBooted}`)
            await chatFunctions.botSpeak( 'Sorry @' + await this.getUsername( bootingUserID ) + ", you can't play" +
              " BBBoot  again  yet. You last played " + formattedLastBBBooted + " ago" );
          }
        } else {
          await chatFunctions.botSpeak( 'Sorry @' + await this.getUsername( bootingUserID ) + ", but I can't boot BB" +
            " if they're not here!" );
        }
      }
    console.groupEnd()
    },

    getBBBootedTimestamp: async function ( userID ) {
      if ( await this.userExists( userID ) ) {
        return theUsersList[ this.getPositionOnUsersList( userID ) ][ 'BBBootTimestamp' ];
      }
    },

    updateBBBootedTimestamp: async function ( userID, databaseFunctions ) {
      await this.storeUserData( userID, "BBBootTimestamp", Date.now(), databaseFunctions );
    },

    isBBHere: async function () {
      return this.isUserHere( await this.bbUserID() );
    },

    canBBBeBooted: async function () {
      return this.withinBBBootTime( await this.bbUserID(), 24 );
    },

    canBBBoot: async function ( userID ) {
      const hours = 24 + ( Math.floor( Math.random() * 12 ) );
      return await this.withinBBBootTime( userID, hours );
    },

    withinBBBootTime: async function ( userID, hours ) {
      let bbbootedTimestamp 
      bbbootedTimestamp = await this.getBBBootedTimestamp( userID )
      if ( bbbootedTimestamp === 0 ) {
        return true
      } else {
        return Date.now() - bbbootedTimestamp >= 3600000 * hours;
      }
    },

    bbBootSomeone: async function ( data, bootedUserID, bootingUserID, bootMessage, chatFunctions, databaseFunctions ) {
      const sleep = ( delay ) => new Promise( ( resolve ) => setTimeout( resolve, delay ) )

      const performInOrder = async () => {
        await chatFunctions.botSpeak( "Nah Nah Nah Nah..." );
        await sleep( 2000 )

        await chatFunctions.botSpeak( "Nah Nah Nah Nah..." );
        await sleep( 2000 )

        await chatFunctions.botSpeak( "Hey Hey Hey..." );
        await sleep( 2000 )

        await chatFunctions.botSpeak( "Goodbye @" + await this.getUsername( bootedUserID ) );
        await sleep( 5000 )

        await this.bootThisUser( bootedUserID, bootMessage )
        //chatFunctions.botSpeak( bootMessage, data );
        await sleep( 100 )

        await this.updateBBBootedTimestamp( bootedUserID, databaseFunctions );
        await sleep( 100 )
      }
      await performInOrder();

      if ( bootedUserID === await this.bbUserID() ) {
        await this.updateRoboCoins( bootingUserID, await this.getRoboCoins( bootingUserID ) + 5, databaseFunctions )
      } else {
        await this.updateRoboCoins( this.bbUserID(), await this.getRoboCoins( this.bbUserID() ) + 1, databaseFunctions )
      }
    },

    // ========================================================

    // ========================================================
    // Username Functions
    // ========================================================

    returnUsernameFromMessageAfterArguments: function ( theMessage ) {
      const regex = /^\/giverc (\d+) (.+)$/;

      // Use the regular expression to match the message
      const match = theMessage.match( regex );

      // If there is a match, return the username (captured in the second group)
      // Otherwise, return null or an empty string based on your preference
      return match ? match[ 2 ] : null;
    },

    // ========================================================

    // ========================================================
    // RoboCoin Functions
    // ========================================================

    getRoboCoins: async function ( userID ) {
      return new Promise( ( resolve, reject ) => {
        if ( this.userExists( userID ) ) {
          const position = this.getPositionOnUsersList( userID );
          let theCoins = parseFloat( theUsersList[ position ][ 'RoboCoins' ] );
          if ( isNaN( theCoins ) ) {
            theCoins = 0;
          }

          resolve( theCoins );
        } else {
          reject( new Error( 'User does not exist' ) );
        }
      } );
    },

    canUserAffordToSpendThisMuch: async function ( userID, numCoins, chatFunctions, data ) {
      try {
        const userRoboCoins = await this.getRoboCoins( userID );

        if ( userRoboCoins >= numCoins ) {
          return true;
        } else {
          await chatFunctions.botSpeak( "Sorry @" + await this.getUsername( userID ) + " you can't afford " + numCoins + " RoboCoins for that" );
          throw new Error( 'Insufficient funds' );
        }
      } catch ( error ) {
        // Handle any errors that may occur in getRoboCoins or due to insufficient funds
        throw new Error( 'Error checking user affordability' );
      }
    },

    subtractRoboCoins: async function ( userID, numCoins, changeReason, changeID, databaseFunctions ) {
      try {
        const coins = parseFloat( numCoins );
        await this.processRoboCoins( userID, coins, changeReason, changeID, subtractRCOperation, databaseFunctions );
      } catch ( error ) {
        console.error( 'Error in subtractRoboCoins:', error.message );
        // Handle the error as needed
      }
    },

    addRoboCoins: async function ( userID, numCoins, changeReason, changeID, databaseFunctions ) {
      try {
        const coins = parseFloat( numCoins );
        await this.processRoboCoins( userID, coins, changeReason, changeID, addRCOperation, databaseFunctions );
      } catch ( error ) {
        console.error( 'Error in addRoboCoins:', error.message );
        // Handle the error as needed
      }
    },

    processRoboCoins: async function ( userID, numCoins, changeReason, changeID, operation, databaseFunctions ) {
      console.log(`processRoboCoins userID:${userID}`)
      console.log(`processRoboCoins numCoins:${numCoins}`)
      console.log(`processRoboCoins changeReason:${changeReason}`)
      console.log(`processRoboCoins changeID:${changeID}`)
      console.log(`processRoboCoins operation:${operation}`)
      try {
        const before = await this.getRoboCoins( userID );
        const updatedCoins = await operation( before, numCoins );
        await this.updateRoboCoins( userID, updatedCoins, databaseFunctions );
        const after = await this.getRoboCoins( userID );

        // Pass positive or negative numCoins to auditRoboCoin based on the type of operation
        await this.auditRoboCoin( userID, before, after, operation === addRCOperation ? numCoins : -numCoins, changeReason, changeID, databaseFunctions );
      } catch ( error ) {
        console.error( `Error in ${ operation.name }:`, error.message );
        throw error;
      }
    },

    updateRoboCoins: async function ( userID, coins, databaseFunctions ) {
      try {
        await this.storeUserData( userID, "RoboCoins", coins, databaseFunctions );
        // Resolve the promise without value (implicit)
      } catch ( error ) {
        throw new Error( 'User does not exist' ); // Reject the promise
      }
    },

    auditRoboCoin: async function ( userID, before, after, numCoins, changeReason, changeID, databaseFunctions ) {
      try {
        await databaseFunctions.saveRoboCoinAudit( userID, before, after, numCoins, changeReason, changeID );
      } catch ( error ) {
        console.error( 'Query failed:', error );
      }
    },

    validateNumCoins: async function ( numCoins, sendingUserID, chatFunctions, data ) {
      if ( numCoins === undefined || isNaN( numCoins ) ) {
        await chatFunctions.botSpeak( '@' + await this.getUsername( sendingUserID ) + ' you must give a number of coins to send, e.g. giverc 10 username' );
        throw new Error( 'Invalid number of coins' );
      }
      return true;
    },

    validateReceivingUser: async function ( args, receivingUserID, sendingUserID, chatFunctions, data ) {
      if ( args[ 1 ] === undefined ) {
        await chatFunctions.botSpeak( '@' + await this.getUsername( sendingUserID ) + ' you must give the name of the user to send RoboCoins to, e.g. giverc 10 username' );
        throw new Error( 'No receiving user specified' );
      }
      if ( receivingUserID === undefined ) {
        await chatFunctions.botSpeak( '@' + await this.getUsername( sendingUserID ) + " I can't find that username" );
        throw new Error( 'User not found' );
      }
      return true;
    },

    handleError: async function ( error ) {
      console.error( 'RoboCoin error:', JSON.stringify( error ) );
    },

    giveInitialRoboCoinGift: async function ( data, userID, databaseFunctions, chatFunctions, roomFunctions ) {
      const numCoins = 100;
      const changeReason = "Welcome gift";
      const changeID = 1;
      await this.addRoboCoins( userID, numCoins, changeReason, changeID, databaseFunctions );
      setTimeout( () => {
        chatFunctions.botSpeak( "@" + this.getUsername( userID ) + " welcome to the " + roomFunctions.roomName() + " room. Have a gift of 100 RoboCoins!" );
      }, 3 * 1000 );
    },

    // ========================================================

    // ========================================================
    // RoboCoin Commands
    // ========================================================

    readMyRoboCoin: async function ( data, chatFunctions ) {
      try {
        const userID = await this.whoSentTheCommand( data );
        const theCoins = await this.getRoboCoins( userID );
        await chatFunctions.botSpeak( '@' + await this.getUsername( userID ) + " you currently have " + parseFloat( theCoins ).toFixed( 2 ) + " RoboCoins" );
      } catch ( error ) {
        console.error( "Error reading RoboCoins:", error.message );
        // Handle the error as needed
      }
    },

    giveRoboCoinCommand: async function ( data, args, chatFunctions, databaseFunctions ) {
      const sendingUserID = await this.whoSentTheCommand( data );
      const [ numCoins, ...restArgs ] = args;
      const username = restArgs.join( " " );
      const receivingUserID = await this.getUserIDFromUsername( username );

      try {
        await this.validateNumCoins( numCoins, sendingUserID, chatFunctions, data );
        await this.validateReceivingUser( args, receivingUserID, sendingUserID, chatFunctions, data );
        await this.canUserAffordToSpendThisMuch( sendingUserID, numCoins, chatFunctions, data );

        functionStore[ sendingUserID + "function" ] = () => {
          return new Promise( async ( innerResolve, innerReject ) => {
            await this.giveRoboCoinAction( sendingUserID, receivingUserID, numCoins, "Give RoboCoin", 2, chatFunctions, databaseFunctions, data )
              .then( () => innerResolve() )
              .catch( ( error ) => innerReject( error ) );
          } );
        };

        functionStore[ sendingUserID + "timeout" ] = setTimeout( () => {
          functionStore[ sendingUserID + "function" ] = null;
          chatFunctions.botSpeak( "@" + this.getUsername( sendingUserID ) + " give RoboCoins command timed out" );
        }, 60 * 1000 );

        await chatFunctions.botSpeak( "@" + await this.getUsername( sendingUserID ) + " please send the command /confirm to confirm you want to spend " + numCoins + " RoboCoins" );
      } catch ( error ) {
        if ( error instanceof Error ) {
          // If it's an instance of Error, pass the error object with its details
          await this.handleError( error, chatFunctions, data );
        } else {
          // If it's not an instance of Error, create a new error object with the message
          await this.handleError( new Error( error ), chatFunctions, data );
        }
      }
    },

    confirmCommand: async function ( data, chatFunctions ) {
      const sendingUserID = await this.whoSentTheCommand( data );
      if ( functionStore && functionStore[ sendingUserID + "function" ] && typeof functionStore[ sendingUserID + "function" ] === 'function' ) {
        functionStore[ sendingUserID + "function" ]()
          .then( () => {
            clearTimeout( functionStore[ sendingUserID + "timeout" ] );
          } )
          .then( () => {
            functionStore[ sendingUserID + "function" ] = null;
            functionStore[ sendingUserID + "timeout" ] = null;
          } )
          .catch( ( error ) => {
            console.error( 'Error confirming command:', error );
          } );
      } else {
        await chatFunctions.botSpeak( "@" + await this.getUsername( sendingUserID ) + " there's nothing to confirm??" );
      }
    },

    giveRoboCoinAction: async function ( sendingUserID, receivingUserID, numCoins, changeReason, changeID, chatFunctions, databaseFunctions, data ) {
      try {
        await this.subtractRoboCoins( sendingUserID, numCoins, changeReason + " to " + await this.getUsername( receivingUserID ), changeID, databaseFunctions );
        await this.addRoboCoins( receivingUserID, numCoins, changeReason + " from " + await this.getUsername( sendingUserID ), changeID, databaseFunctions );

        await chatFunctions.botSpeak( "@" + await this.getUsername( sendingUserID ) + " gave " + numCoins + " to @" + await this.getUsername( receivingUserID ) );
        return Promise.resolve(); // Resolve the promise after successful execution
      } catch ( error ) {
        await this.handleError( error, chatFunctions, data );
        throw error; // Rethrow the error to propagate the rejection
      }
    },

    // ========================================================

    // ========================================================
    // Testing Generalised Chargeable Commands
    // ========================================================

    wibble: async function ( data, chatFunctions ) {
      await chatFunctions.botSpeak( "wibble" );
    },

    chargeMe: async function ( callCost, data, chatFunctions, databaseFunctions, functionCall, description = "" ) {
      const sendingUserID = this.whoSentTheCommand( data );

      try {
        await this.canUserAffordToSpendThisMuch( sendingUserID, callCost, chatFunctions, data );

        functionStore[ sendingUserID + "function" ] = () => {
          return new Promise( ( innerResolve, innerReject ) => {
            this.runCommandAndChargeForIt( sendingUserID, callCost, functionCall, databaseFunctions, description )
              .then( () => innerResolve() )
              .catch( ( error ) => innerReject( error ) );
          } );
        };

        functionStore[ sendingUserID + "timeout" ] = setTimeout( async () => {
          functionStore[ sendingUserID + "function" ] = null;
          await chatFunctions.botSpeak( "@" + await this.getUsername( sendingUserID ) + " command timed out" );
        }, 60 * 1000 );

        await chatFunctions.botSpeak( "@" + await this.getUsername( sendingUserID ) + " please send the command" +
          " /confirm" +
          " to" +
          " confirm you want to spend " + callCost + " RoboCoins " + description );

      } catch ( error ) {
        if ( error instanceof Error ) {
          // If it's an instance of Error, pass the error object with its details
          await this.handleError( error, chatFunctions, data );
        } else {
          // If it's not an instance of Error, create a new error object with the message
          await this.handleError( new Error( error ), chatFunctions, data );
        }
      }
    },

    runCommandAndChargeForIt: async function ( sendingUserID, callCost, functionCall, databaseFunctions, description ) {
      if ( description === "" ) {
        description = "Chargeable command";
      }
      const changeID = 4;
      await this.subtractRoboCoins( sendingUserID, callCost, description, changeID, databaseFunctions );
      functionCall();
    }
  }
}

export default userFunctions;
