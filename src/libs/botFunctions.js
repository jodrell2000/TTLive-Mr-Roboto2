import roomDefaults from '../defaults/roomDefaults.js'
import botDefaults from '../defaults/botDefaults.js'
import musicDefaults from '../defaults/musicDefaults.js'
import { commandIdentifier } from '../defaults/chatDefaults.js'
import axios from 'axios'
import authModule from '../libs/auth.js'
import { ActionName } from "ttfm-socket";
import { spawn } from 'child_process';

let checkActivity = Date.now();
let skipOn = null; //if true causes the bot to skip every song it plays, toggled on and off by commands
let sayOnce = true; //makes it so that the queue timeout can only be used once per per person, stops the bot from spamming
let botStartTime = null; //the current time in milliseconds when the bot has started, used for the /uptime
let uptimeTime = null; //the current time in milliseconds when the /uptime is actually used
let messageCounter = 0; //this is for the array of messages, it lets it know which message it is currently on, resets to 0 after cycling through all of them
let netwatchdogTimer = null; // Used to detect internet connection dropping out
let attemptToReconnect = null; //used for reconnecting to the bots room if its not in there (only works if internet connection is working)
let returnToRoom = true; //used to toggle on and off the bot reconnecting to its room(it toggles off when theres no internet connection because it only works when its connected to turntable.fm)
let wserrorTimeout = null; //this is for the setTimeout in ws error
let autoDjingTimer = null; //governs the timer for the bot's auto djing
let readSongStats = roomDefaults.SONGSTATS;
let autoDJEnabled = botDefaults.autoDJEnabled; //autodjing(off by default)
let whenToGetOnStage = botDefaults.whenToGetOnStage; //when this many or less people djing the bot will get on stage(only if autodjing is enabled)
let whenToGetOffStage = botDefaults.whenToGetOffStage;
let checkVideoRegions = musicDefaults.alertIfRegionBlocked;
let refreshingEnabled = roomDefaults.refreshingEnabled;
let favouriteArtist = null; // what's Robos current favouurite Artist (requires verified info in the DB)

const botFunctions = () => {

  return {
    checkActivity: () => checkActivity,
    messageCounter: () => messageCounter,
    netwatchdogTimer: () => netwatchdogTimer,
    attemptToReconnect: () => attemptToReconnect,
    returnToRoom: () => returnToRoom,
    wserrorTimeout: () => wserrorTimeout,
    autoDjingTimer: () => autoDjingTimer,

    botStartTime: () => botStartTime,
    setBotStartTime: function () {
      botStartTime = Date.now()
    },

    skipOn: () => skipOn,
    setSkipOn: function ( value ) { skipOn = value; },

    sayOnce: () => sayOnce,
    setSayOnce: function ( value ) { sayOnce = value; },

    uptimeTime: () => uptimeTime,
    setUptimeTime: function ( value ) { uptimeTime = value; },

    // ========================================================
    // Memory Functions
    // ========================================================

    reloadMemory: async function ( databaseFunctions, roomFunctions ) {
      const theTheme = await databaseFunctions.retrieveMemory( "theme" )
      if ( theTheme !== null ) {
        await roomFunctions.setTheme( theTheme )
      }
    },

    // ========================================================

    // ========================================================
    // DJing Functions
    // ========================================================
    
    getFirstSongInQueue: async function () {
      const url = "https://playlists.prod.tt.fm/crate/special/queue/songs"
      const headers = {
        'accept': 'application/json',
        'Authorization': `Bearer ${ process.env.TTL_USER_TOKEN }`
      };

      try {
        const response = await axios.get( url, { headers } );
        const theQueue = response.data
        console.log( `queue: ${ theQueue }` );
        console.log( `queue JSON: ${ JSON.stringify( theQueue, null, 2) }` );
        return theQueue.songs[0];
      } catch ( error ) {
        console.error( `Error calling get api...error:${error}\nurl:${url}` );
        throw error;
      }
    },

    djUp: async function( socket ) {
      const firstSong = await this.getFirstSongInQueue()
      console.log( `firstSong: ${ JSON.stringify(firstSong, null, 2) }` );
      await socket.action( ActionName.addDj, {
        roomUuid: botDefaults.roomUuid,
        tokenRole: process.env.TTL_USER_TOKEN,
        userUuid: botDefaults.botUuid
      } );

      await socket.action( ActionName.updateNextSong, {
        roomUuid: botDefaults.roomUuid,
        song: firstSong,
        userUuid: botDefaults.botUuid
      } );
    },

    djDown: async function( socket ) {
      await socket.action( ActionName.removeDj, {
        roomUuid: botDefaults.roomUuid,
        userUuid: botDefaults.botUuid,
        djUuid: botDefaults.botUuid
      } );
    },

    // ========================================================

    // ========================================================
    // Bot Command Functions
    // ========================================================

    sarahConner: async function ( data, theMessage, userFunctions, chatFunctions ) {
      const sleep = ( delay ) => new Promise( ( resolve ) => setTimeout( resolve( "done" ), delay ) )

      const shutMeDown = async () => {
        await chatFunctions.botSpeak( "I'll be back...", true );
        await sleep( 100 )
        userFunctions.debugPrintTheUsersList();
        await sleep( 100 )
        await this.logCommandUsage( userFunctions, 'sarahConner', data, theMessage )
        process.exit( 1 );
      }
      await shutMeDown();
    },

    tonystark: async function ( data, theMessage, userFunctions, chatFunctions ) {
      const restartMe = async () => {
        await chatFunctions.botSpeak( "I'll just try switching it off and on again...", true );
        await this.logCommandUsage( userFunctions, 'tonystark', data, theMessage )
        const subprocess = spawn(process.argv[0], process.argv.slice(1), {
          detached: true,
          stdio: 'inherit',
        });
        subprocess.unref();
        process.exit(0);
      }
      await restartMe();
    },

    changeAvatar: function ( data, args, chatFunctions ) {
      const theID = args[ 0 ];
      if ( isNaN( theID ) ) {
        chatFunctions.botSpeak( "That's not a valid AvatarID...it needs to be a number" );
      } else {
        if ( theID === "8" || theID === "4" || theID === "227" || theID === "2022" ) {
          chatFunctions.botSpeak( "NOPE! No Gingers here..." );
        } else {
          chatFunctions.botSpeak( "Changing..." );
          bot.setAvatar( theID );
        }
      }
    },

    getUptime: function () {
      this.setUptimeTime( Date.now() );
      return this.uptimeTime() - this.botStartTime();
    },

    reportUptime: async function ( data, userFunctions, chatFunctions ) {
      let msecPerMinute = 1000 * 60;
      let msecPerHour = msecPerMinute * 60;
      let msecPerDay = msecPerHour * 24;
      let currentTime = this.getUptime();

      let days = Math.floor( currentTime / msecPerDay );
      currentTime = currentTime - ( days * msecPerDay );

      let hours = Math.floor( currentTime / msecPerHour );
      currentTime = currentTime - ( hours * msecPerHour );

      let minutes = Math.floor( currentTime / msecPerMinute );

      await chatFunctions.botSpeak( await userFunctions.getUsername( authModule.USERID ) + ' has been up for: ' + days + ' days, ' + hours + ' hours, ' + minutes + ' minutes' );
    },

    songStatsCommand: function ( data, chatFunctions ) {
      if ( this.readSongStats() ) {
        this.disableReadSongStats( data, chatFunctions );
      } else {
        this.enableReadSongStats( data, chatFunctions );
      }
    },

    autoDJCommand: async function ( data, chatFunctions ) {
      if ( this.autoDJEnabled() ) {
        await this.disableAutoDJ( data, chatFunctions );
      } else {
        await this.enableAutoDJ( data, chatFunctions );
      }
    },

    removeIdleDJsCommand: function ( data, userFunctions, chatFunctions ) {
      if ( userFunctions.removeIdleDJs() ) {
        userFunctions.disableDJIdle( data, chatFunctions );
      } else {
        userFunctions.enableDJIdle( data, chatFunctions );
      }
    },

    reportRoomStatus: function ( data, chatFunctions, userFunctions, videoFunctions ) {
      const sleep = ( delay ) => new Promise( ( resolve ) => setTimeout( resolve, delay ) )
      const doInOrder = async () => {
        await this.reportUptime( data, userFunctions, chatFunctions );
        await sleep( 100 );
        await this.reportAutoDJStatus( data, chatFunctions );
        await sleep( 100 );
        this.reportSongStats( data, chatFunctions );
        await sleep( 100 );
        await userFunctions.readQueue( data, chatFunctions );
        await sleep( 100 );
        await userFunctions.whatsPlayLimit( data, chatFunctions );
        await sleep( 100 );
        await userFunctions.reportDJIdleStatus( data, chatFunctions );
        await sleep( 100 );
        this.reportRefreshStatus( data, chatFunctions );
        await sleep( 100 );
        this.reportRegionCheckStatus( data, videoFunctions, chatFunctions );
        await sleep( 100 );
      }
      doInOrder();
    },

    checkVideoRegionsCommand: function ( data, videoFunctions, chatFunctions ) {
      if ( this.checkVideoRegions() ) {
        this.disablecheckVideoRegions( data, videoFunctions, chatFunctions );
      } else {
        this.enablecheckVideoRegions( data, videoFunctions, chatFunctions );
      }
    },

    addAlertRegionCommand: function ( data, args, videoFunctions, chatFunctions ) {
      const sleep = ( delay ) => new Promise( ( resolve ) => setTimeout( resolve, delay ) )
      const doInOrder = async () => {
        // console.log( "args:" + args );
        videoFunctions.addAlertRegion( data, args[ 0 ], chatFunctions );
        await sleep( 1000 )

        this.reportRegionCheckStatus( data, videoFunctions, chatFunctions );
        await sleep( 1000 )
      }
      doInOrder();
    },

    removeAlertRegionCommand: function ( data, args, videoFunctions, chatFunctions ) {
      const sleep = ( delay ) => new Promise( ( resolve ) => setTimeout( resolve, delay ) )
      const doInOrder = async () => {
        videoFunctions.removeAlertRegion( data, args[ 0 ], chatFunctions )
        await sleep( 1000 )

        this.reportRegionCheckStatus( data, videoFunctions, chatFunctions );
        await sleep( 1000 )
      }
      doInOrder();
    },

    stageDiveCommand: async function ( data, chatFunctions, userFunctions, messageVariable, socket ) {
      const userID = await userFunctions.whoSentTheCommand( data );
      const receiverID = await userFunctions.getCurrentDJID( data );

      if ( await userFunctions.isUserIDOnStage( userID ) ) {
        const randomMessage = messageVariable[ Math.floor( Math.random() * messageVariable.length ) ];
        const thisMessage = await chatFunctions.buildUserToUserRandomMessage( userFunctions, userID, randomMessage, receiverID );
        await chatFunctions.botSpeak( thisMessage );
        await userFunctions.removeDJ( userID, 'DJ used the /dive command', socket );
      } else {
        await chatFunctions.botSpeak( 'You can\'t leave the stage if you\'re not on stage...' )
      }
    },

    refreshOnCommand: async function ( data, chatFunctions ) {
      if ( this.refreshingEnabled() ) {
        await chatFunctions.botSpeak( 'The ' + commandIdentifier + 'refresh command is already enabled' );
      } else {
        await this.enableRefreshing( data, chatFunctions );
      }
    },

    refreshOffCommand: function ( data, chatFunctions ) {
      if ( !this.refreshingEnabled() ) {
        chatFunctions.botSpeak( 'The ' + commandIdentifier + 'refresh command is already disabled' );
      } else {
        this.disableRefreshing( data, chatFunctions );
      }
    },

    logCommandUsage: async function ( userFunctions, command, data, theMessage ) {
      console.group( command );
      console.info( 'The ' + command + ' command was issued by @' + await userFunctions.getUsername( await userFunctions.whoSentTheCommand( data ) ) + ' at ' + Date() );
      console.info( theMessage );
      console.groupEnd();
    },

    removeDJCommand: async function ( data, theMessage, userFunctions, chatFunctions, socket ) {
      const djID = await userFunctions.getCurrentDJID( data );

      if ( theMessage !== '' ) {
        const djName = userFunctions.getUsername( djID );
        theMessage = '@' + djName + ', ' + theMessage;

        await chatFunctions.botSpeak( theMessage, true );
        await this.logCommandUsage( userFunctions, 'removeDJ', data, theMessage )
      }
      await userFunctions.removeDJ( djID, 'The removeDJ command had been issued: ' + theMessage, socket );
    },

    informDJCommand: async function ( data, theMessage, userFunctions, chatFunctions ) {
      const djID = await userFunctions.getCurrentDJID( data );

      if ( theMessage !== '' ) {
        theMessage = '@' + await userFunctions.getUsername( djID ) + ', ' + theMessage
        await chatFunctions.botSpeak( theMessage, true );
        await this.logCommandUsage( userFunctions, 'informDJ', data, theMessage )
      } else {
        await chatFunctions.botSpeak( 'You didn\'t ask me to send the DJ any message?!?' );
      }
    },

    awesomeCommand: function () {
      bot.vote( 'up' );
    },

    lameCommand: function () {
      bot.vote( 'down' );
    },

    // ========================================================

    upVote: async function ( socket ) {
      await socket.action( ActionName.voteOnSong, {
        roomUuid: botDefaults.roomUuid,
        userUuid: botDefaults.botUuid,
        songVotes: { like: true }
      } );
    },
    
    downvote: async function ( socket ) {
      await socket.action( ActionName.voteOnSong, {
        roomUuid: botDefaults.roomUuid,
        userUuid: botDefaults.botUuid,
        songVotes: { like: false }
      } );
    },
    
    // ========================================================

    async readFavouriteArtist( data, chatFunctions, databaseFunctions ) {
      const favouriteArtist = await this.favouriteArtist( databaseFunctions );
      await chatFunctions.botSpeak( "This week, I have been mostly listening to " + favouriteArtist );
    },

    favouriteArtist: function ( databaseFunctions ) {
      if ( favouriteArtist !== null ) {
        return Promise.resolve( favouriteArtist );
      }

      return databaseFunctions.getRandomVerifiedArtist()
        .then( ( displayName ) => {
          return this.setFavouriteArtist( displayName );
        } );
    },

    setFavouriteArtist: function ( value ) {
      return new Promise( ( resolve, _ ) => {
        favouriteArtist = value;
        resolve( value );
      } )
    },

    async chooseNewFavourite( databaseFunctions ) {
      await databaseFunctions.getRandomVerifiedArtist()
        .then( ( displayName ) => {
          favouriteArtist = displayName;
        } )
    },

    async isFavouriteArtist( databaseFunctions, theArtist ) {
      const currentFavourite = await this.favouriteArtist( databaseFunctions );

      return new Promise( ( resolve, reject ) => {
        databaseFunctions.getVerifiedArtistsFromName( theArtist )
          .then( ( array ) => {
            for ( let i = 0; i < array.length; i++ ) {
              if ( array[ i ].displayName === currentFavourite ) {
                resolve( currentFavourite );
                return;
              }
            }
          } )
          .catch( ( error ) => {
            reject( error );
          } );
      } );
    },

    // ========================================================

    getFormattedDate: function () {
      var dateobj = new Date();
      var date = dateobj.getDate(), month = dateobj.getMonth() + 1, year = dateobj.getFullYear();
      return `${ date }/${ month }/${ year }`;
    },

    checkVideoRegions: () => checkVideoRegions,
    enablecheckVideoRegions: async function ( data, videoFunctions, chatFunctions ) {
      checkVideoRegions = true;
      await this.reportRegionCheckStatus( data, videoFunctions, chatFunctions );
    },
    disablecheckVideoRegions: async function ( data, videoFunctions, chatFunctions ) {
      checkVideoRegions = false;
      await this.reportRegionCheckStatus( data, videoFunctions, chatFunctions );
    },

    reportRegionCheckStatus: async function ( data, videoFunctions, chatFunctions ) {
      if ( this.checkVideoRegions() ) {
        videoFunctions.listAlertRegions( data, chatFunctions );
      } else {
        await chatFunctions.botSpeak( 'Video Region checking is disabled' );
      }
    },

    refreshingEnabled: () => refreshingEnabled,
    enableRefreshing: async function ( data, chatFunctions ) {
      refreshingEnabled = true;
      await this.reportRefreshStatus( data, chatFunctions );
    },
    disableRefreshing: async function ( data, chatFunctions ) {
      refreshingEnabled = false;
      await this.reportRefreshStatus( data, chatFunctions );
    },

    reportRefreshStatus: async function ( data, chatFunctions ) {
      if ( this.refreshingEnabled() ) {
        await chatFunctions.botSpeak( 'The ' + commandIdentifier + 'refresh command is enabled' );
      } else {
        await chatFunctions.botSpeak( 'The ' + commandIdentifier + 'refresh command is disabled' );
      }
    },

    autoDJEnabled: () => autoDJEnabled,
    enableAutoDJ: async function ( data, chatFunctions ) {
      autoDJEnabled = true;
      await this.reportAutoDJStatus( data, chatFunctions );
    },
    disableAutoDJ: async function ( data, chatFunctions ) {
      autoDJEnabled = false;
      await this.reportAutoDJStatus( data, chatFunctions );
    },

    whenToGetOnStage: () => whenToGetOnStage,
    setWhenToGetOnStage: async function ( data, args, chatFunctions ) {
      const numberOfDJs = args[ 0 ];
      if ( isNaN( numberOfDJs ) ) {
        await chatFunctions.botSpeak( 'Don\'t be silly. I can\'t set the auto-DJing start value to ' + numberOfDJs );
      } else {
        whenToGetOnStage = numberOfDJs;
        await this.reportAutoDJStatus( data, chatFunctions )
      }
    },

    whenToGetOffStage: () => whenToGetOffStage,
    setWhenToGetOffStage: async function ( data, args, chatFunctions ) {
      const numberOfDJs = args[ 0 ];
      if ( isNaN( numberOfDJs ) ) {
        await chatFunctions.botSpeak( 'Don\'t be silly. I can\'t set the auto-DJing stop value to ' + numberOfDJs );
      } else {
        whenToGetOffStage = numberOfDJs;
        await this.reportAutoDJStatus( data, chatFunctions )
      }
    },

    reportAutoDJStatus: async function ( data, chatFunctions ) {
      if ( this.autoDJEnabled() ) {
        await chatFunctions.botSpeak( 'Auto-DJing is enabled and will start at ' + this.whenToGetOnStage() + ' and' +
          ' stop at ' + this.whenToGetOffStage() );
      } else {
        await chatFunctions.botSpeak( 'Auto DJing is disabled' )
      }
    },

    readSongStats: () => readSongStats,
    enableReadSongStats: function ( data, chatFunctions ) {
      readSongStats = true;
      this.reportSongStats( data, chatFunctions );
    },
    disableReadSongStats: function ( data, chatFunctions ) {
      readSongStats = false;
      this.reportSongStats( data, chatFunctions );
    },
    reportSongStats: function ( data, chatFunctions ) {
      if ( this.readSongStats() ) {
        chatFunctions.botSpeak( 'Song stat reporting is enabled' );
      } else {
        chatFunctions.botSpeak( 'Song stats reporting is disabled' );
      }
    },

    checkIfConnected: function () {
      {
        if ( attemptToReconnect === null ) //if a reconnection attempt is already in progress, do not attempt it
        {
          if ( bot._isAuthenticated ) // if bot is actually connected to turntable use the speaking method
          {
            let currentActivity = ( Date.now() - checkActivity ) / 1000 / 60;

            if ( currentActivity > 30 ) //if greater than 30 minutes of no talking
            {
              bot.speak( 'ping', function ( callback ) //attempt to talk
              {
                if ( callback.success === false ) //if it fails
                {
                  return false;
                }
              } );
            }
          } else //else attempt to reconnect right away
          {
            return false;
          }
        }
      }
      return true;
    },

    reconnect: function () {
      console.group( 'botModule: reconnect' );
      attemptToReconnect = setInterval( function () {
        if ( bot._isAuthenticated ) {
          console.error( '+++++++++++++++++++++++++ BotModule Error: it looks like your bot is not in it\'s room. attempting to reconnect now....' );
        } else {
          console.error( '+++++++++++++++++++++++++ BotModule Error: connection with turntable lost, waiting for connection to come back...' );
        }

        bot.roomRegister( authModule.ROOMID, function ( data ) {
          if ( data.success === true ) {
            roomDefaults.errorMessage = null;
            clearInterval( attemptToReconnect );
            module.exports.attemptToReconnect = null;
            checkActivity = Date.now();
          } else {
            if ( roomDefaults.errorMessage === null && typeof data.err === 'string' ) {
              roomDefaults.errorMessage = data.err;
            }
          }
        } );
      }, 1000 * 10 );
      console.groupEnd()
    },

    recordActivity: function () {
      checkActivity = Date.now(); //update when someone says something
    },

    isBotOnStage: async function ( userFunctions ) {
      console.log(`isBotOnStage check`)
      const status = await userFunctions.isUserIDOnStage( authModule.USERID )
      console.log(`isBotOnStage status: ${status}`)
      return status;
    },
    
    shouldTheBotDJ: function ( userFunctions ) {
      console.group(`shouldTheBotDJ`)
      console.log(`userFunctions.howManyDJs(): ${userFunctions.howManyDJs()}`)
      console.log(`userFunctions.whenToGetOnStage(): ${this.whenToGetOnStage()}`)
      console.log(`userFunctions.queueList().length: ${userFunctions.queueList().length}`)
      console.log(`userFunctions.vipList.length: ${userFunctions.vipList.length}`)
      console.log(`userFunctions.refreshDJCount(): ${userFunctions.refreshDJCount()}`)
      console.groupEnd()
      return userFunctions.howManyDJs() >= 1 && // is there at least one DJ on stage
        userFunctions.howManyDJs() <= this.whenToGetOnStage() && // are there fewer than the limit of DJs on stage
        userFunctions.queueList().length === 0 && // is the queue empty
        userFunctions.vipList.length === 0 && // there no VIPs
        userFunctions.refreshDJCount() === 0; // is there someone currently using the refresh command
    },

    startBotDJing: function () {
      //console.log( "Start DJing" );
      bot.addDj(); // start the Bot DJing
    },

    shouldStopBotDJing: async function ( userFunctions ) {
      return userFunctions.howManyDJs() >= this.whenToGetOffStage() && // are there enough DJs onstage
        ( await userFunctions.getCurrentDJID() ) !== authModule.USERID; // check the Bot isn't currently DJing
    },
    
    checkAutoDJing: async function ( userFunctions, socket ) {
      console.group(`checkAutoDJing`)
      console.log(`Checking...`)
      if ( autoDjingTimer != null ) {
        clearTimeout( autoDjingTimer );
        autoDjingTimer = null;
      }

      if ( this.autoDJEnabled() === true ) {
        console.log(`autoDJEnabled...`)

        autoDjingTimer = setTimeout(async () => {
          if ( ! await this.isBotOnStage(userFunctions) ) {
            if ( this.shouldTheBotDJ(userFunctions) ) {
              await this.djUp( socket );
            }
          } else {
            if ( await this.shouldStopBotDJing(userFunctions) ) {
              await this.djDown( socket );
            }
          }
        }, 1000 * 10);
      }
      console.groupEnd()
    },

    isSongInBotPlaylist: function ( thisSong ) {
      let foundSong = false;
      for ( let listLoop = 0; listLoop < botDefaults.botPlaylist.length; listLoop++ ) {
        if ( botDefaults.botPlaylist[ listLoop ]._id === thisSong ) {
          foundSong = true;
        }
      }

      return foundSong;
    },

    getPlaylistCount: function () {
      return botDefaults.botPlaylist.length;
    },

    addToBotPlaylist: function ( thisSong ) {
      bot.playlistAdd( thisSong, -1 ); //add song to the end of the playlist
      botDefaults.botPlaylist.push( thisSong );

      if ( botDefaults.feart ) { //whether the bot will show the heart animation or not
        bot.snag();
      }
    },

    checkAndAddToPlaylist: function ( songFunctions ) {
      const thisSong = songFunctions.getSong();

      if ( botDefaults.botPlaylist !== null && thisSong !== null ) {
        if ( !this.isSongInBotPlaylist( thisSong ) ) {
          this.addToBotPlaylist( thisSong );
        }
      }
    },

    isBotCurrentDJ: function ( userFunctions ) {
      return userFunctions.getCurrentDJID() === authModule.USERID;
    },

    deleteCurrentTrackFromBotPlaylist: function ( data, userFunctions, chatFunctions, songFunctions ) {
      if ( this.isBotCurrentDJ( userFunctions ) !== true ) {
        chatFunctions.botSpeak( "I can't delete anything if I'm not playing anything?!?", true );
      } else {
        chatFunctions.botSpeak( "OK, I'll delete that", true );

        const senderID = userFunctions.whoSentTheCommand( data );
        const senderUsername = userFunctions.getUsername( senderID );
        const currentDateTime = require( 'moment' );

        console.group( '! delete track ===============================' );
        console.log( "The deletetrack command was issued by " + senderUsername + " at " + currentDateTime().format( 'DD/MM/yyyy HH:mm:ss' ) );
        console.log( "The track removed was " + songFunctions.song() + " by " + songFunctions.artist() );
        console.log( '========================================' );
        console.groupEnd();

        bot.playlistRemove( this.getPlaylistCount() - 1 );
        bot.skip();
      }
    },

    clearAllTimers: async function ( userFunctions, roomFunctions, songFunctions, chatFunctions ) {
      await userFunctions.clearInformTimer( roomFunctions, chatFunctions );
      await roomFunctions.clearSongLimitTimer( userFunctions, roomFunctions, chatFunctions );
      songFunctions.clearWatchDogTimer();
      await songFunctions.clearTakedownTimer( userFunctions, roomFunctions, chatFunctions );
    },

    checkOnNewSong: async function ( data, roomFunctions, songFunctions, userFunctions, chatFunctions, socket ) {
      const length = data.nowPlaying.song.duration
      const theDJID = data.djs[ 0 ].uuid
      const masterIndex = userFunctions.masterIds().indexOf( theDJID ); //used to tell whether current dj is on the master id's list or not
      const djName = userFunctions.getUsername( theDJID );

      //clears timers if previously set
      await this.clearAllTimers( userFunctions, roomFunctions, songFunctions, chatFunctions, socket );

      songFunctions.startSongWatchdog( data, userFunctions, socket );

      //this removes the user from the stage if their song is over the length limit and they don't skip
      let theTimeout = 60;
      if ( ( length / theTimeout ) >= musicDefaults.songLengthLimit ) {
        if ( theDJID === authModule.USERID || masterIndex === -1 ) //if dj is the bot or not a master
        {
          if ( musicDefaults.songLengthLimitOn === true ) {
            const nextDJName = userFunctions.getUsername( userFunctions.getNextDJ() );
            bot.speak( `@${ djName }, your song is over ${ musicDefaults.songLengthLimit } mins long, you have ${ theTimeout } seconds to skip before being removed.` );
            bot.speak( `@${ nextDJName }, make sure you've got something ready ;-)` );

            // start the timer
            roomFunctions.songLimitTimer = setTimeout( function () {
              roomFunctions.songLimitTimer = null;
              userFunctions.removeDJ( theDJID, `DJ @${ djName } was removed because their song was over the length limit`, socket ); // Remove Saved DJ from last newsong call
            }, theTimeout * 1000 ); // Current DJ has 20 seconds to skip before they are removed
          }
        }
      }
    },

    // ========================================================
    // ML Chat Functions
    // ========================================================

    async askBardCommand( data, theQuestion, chatFunctions, mlFunctions ) {
      const answer = await mlFunctions.askBard( theQuestion );
      chatFunctions.botSpeak( answer );
    },

    async askChatGPTCommand( data, theQuestion, chatFunctions, mlFunctions ) {
      const answer = await mlFunctions.askChatGPT( theQuestion );
      chatFunctions.botSpeak( answer );
    },

  }
}

export default botFunctions;