import roomDefaults from '../defaults/roomDefaults.js'
import botDefaults from '../defaults/botDefaults.js'
import musicDefaults from '../defaults/musicDefaults.js'

let song = null; // info for the currently playing song, so default to null
let previousSong = null; // info for the currently playing song, so default to null
let album = null; // info for the currently playing song, so default to null
let genre = null; // info for the currently playing song, so default to null
let artist = null; // info for the currently playing song, so default to null
let previousArtist = null; // info for the currently playing song, so default to null
let previousDJID = null;
let getSong = null; // info for the currently playing song, so default to null
let dj = null; // info for the currently playing song, so default to null
let songID = null; // youTube ID of the video, used to check the regions

let snagSong = false; //if true causes the bot to add every song that plays to its queue

let upVotes = [];
let downVotes = [];
let snags = [];
let jumps = [];
let voteCountSkip = 0;
let previousSongStats = []; // grab the ending song votes before they're reset
let ALLREADYCALLED = false; //resets votesnagging so that it can be called again
let curSongWatchdog = null; //used to hold the timer for stuck songs
let takedownTimer = null; //used to hold the timer that fires after curSongWatchDog which represents the time a person with a stuck song has left to skip their song
let votesLeft = roomDefaults.HowManyVotesToSkip;
const fixTrackPayments = 0.1;

const songFunctions = () => {
  return {
    song: () => song,
    album: () => album,
    genre: () => genre,
    artist: () => artist,
    getSong: () => getSong,
    dj: () => dj,
    
    setSongTags: async function ( thisSong ) {
      console.log(`data: ${JSON.stringify(thisSong, null, 2)}`);
      this.song = thisSong.trackName;
      this.genre = thisSong.genre;
      this.artist = thisSong.artistName;
      this.songID = thisSong.songID;
    },


    upVotes: () => upVotes.length,
    downVotes: () => downVotes.length,
    voteCountSkip: () => voteCountSkip,
    ALLREADYCALLED: () => ALLREADYCALLED,

    votesLeft: () => votesLeft,
    setVotesLeft: function ( value ) { votesLeft = value; },
    decrementVotesLeft: function () { --votesLeft; },

    fixTrackPayments: () => fixTrackPayments,

    // ========================================================
    // Playlist Functions
    // ========================================================

    loadPlaylist: function () {
      bot.playlistAll( function ( callback ) {
        botDefaults.botPlaylist = callback.list;
      } );
    },

    randomisePlaylist: function () {
      let ez = 0;
      bot.speak( "Reorder initiated." );
      let reorder = setInterval( function () {
        if ( ez <= botDefaults.botPlaylist.length ) {
          let nextId = Math.ceil( Math.random() * botDefaults.botPlaylist.length );
          bot.playlistReorder( ez, nextId );
          console.log( "Song " + ez + " changed." );
          ez++;
        } else {
          clearInterval( reorder );
          console.log( "Reorder Ended" );
          bot.speak( "Reorder completed." );
        }
      }, 1000 );
    },

    // ========================================================

    // ========================================================
    // Length Functions
    // ========================================================

    switchLengthLimit: function ( data, songLength, chatFunctions ) {
      let theMessage = "";
      const theSongLength = songLength[ 0 ];

      if ( theSongLength === undefined ) {
        this.swapSongLengthLimit( data, chatFunctions );
      } else if ( isNaN( theSongLength ) ) {
        theMessage = "The max song length must be a number"
        chatFunctions.botSpeak( theMessage )
      } else {
        musicDefaults.songLengthLimitOn = true;
        musicDefaults.songLengthLimit = theSongLength;

        this.announceSongLengthLimit( data, chatFunctions );
      }
    },

    swapSongLengthLimit: function ( data, chatFunctions ) {
      if ( musicDefaults.songLengthLimitOn === true ) {
        musicDefaults.songLengthLimitOn = false;
      } else {
        musicDefaults.songLengthLimitOn = true;
        if ( musicDefaults.songLengthLimit === undefined ) {
          musicDefaults.songLengthLimit = 10;
        }
      }

      this.announceSongLengthLimit( data, chatFunctions );
    },

    announceSongLengthLimit: function ( data, chatFunctions ) {
      let theMessage = "The song length limit is now";
      if ( musicDefaults.songLengthLimitOn ) {
        theMessage += " active, and the length limit is " + musicDefaults.songLengthLimit + " minutes";
      } else {
        theMessage += " inactive";
      }
      chatFunctions.botSpeak( theMessage, true )
    },

    // ========================================================

    // ========================================================
    // Snagging Functions
    // ========================================================

    snagCount: () => snags.length,

    recordSnag: async function(uuid) {
      if (!snags.includes(uuid)) {
        snags.push(uuid);
      }
    },

    resetSnagCount: async function () {
      snags = [];
    },

    // ========================================================

    // ========================================================
    // Jump Functions
    // ========================================================

    jumpCount: () => jumps.length,

    recordJump: async function(uuid) {
      if (!jumps.includes(uuid)) {
        jumps.push(uuid);
      }
    },

    resetJumpCount: async function () {
      jumps = [];
    },

    // ========================================================

    // ========================================================
    // Verified DB info
    // ========================================================

    getArtistName: async function ( videoID, databaseFunctions ) {
      const array = await databaseFunctions.getVerifiedArtistFromID( videoID );
      if ( array.length > 0 ) {
        return array[ 0 ].artistDisplayName;
      } else {
        return false;
      }
    },

    getTrackName: async function ( youtube_id, databaseFunctions ) {
      const array = await databaseFunctions.getVerifiedTrackFromID( youtube_id );
      if ( array.length > 0 ) {
        return array[ 0 ].trackDisplayName;
      } else {
        return false;
      }
    },

    // ========================================================

    // ========================================================
    // Song Stats Functions
    // ========================================================

    previousUpVotes: () => previousSongStats[ 'upvotes' ],
    previousDownVotes: () => previousSongStats[ 'downvotes' ],
    previousSnags: () => previousSongStats[ 'snags' ],
    previousJumps: () => previousSongStats[ 'jumps' ],
    previousArtist: () => previousArtist,
    previousTrack: () => previousSong,
    previousDJID: () => previousDJID,
    setPreviousArtist: (artist) => { previousArtist = artist; },
    setPreviousTrack: (track) => { previousSong = track; },

    grabSongStats: async function () {
      previousSongStats[ 'upvotes' ] = upVotes.length;
      previousSongStats[ 'downvotes' ] = downVotes.length;
      previousSongStats[ 'snags' ] = this.snagCount();
      previousSongStats[ 'jumps' ] = this.jumpCount();
    },

    // ========================================================

    recordUpVotes: async function(uuid) {
      if (!upVotes.includes(uuid)) {
        upVotes.push(uuid);
      }
    },

    recordDownVotes: async function(uuid) {
      if (!downVotes.includes(uuid)) {
        downVotes.push(uuid);
      }
    },

    resetUpVotes: async function () {
      upVotes = [];
    },

    resetDownVotes: async function () {
      downVotes = [];
    },

    resetVoteCountSkip: async function () {
      voteCountSkip = 0;
    },

    addToVoteCountSkip: function () {
      voteCountSkip += 1;
    },

    resetVotesLeft: async function ( votesToSkip ) {
      votesLeft = votesToSkip;
    },

    resetVoteSnagging: async function () {
      ALLREADYCALLED = false; //resets votesnagging so that it can be called again
    },

    songSnagged: function () {
      ALLREADYCALLED = true; //this makes it so that it can only be called once per song
    },

    clearWatchDogTimer() {
      // If watch dog has been previously set,
      // clear since we've made it to the next song
      if ( curSongWatchdog !== null ) {
        clearTimeout( curSongWatchdog );
        curSongWatchdog = null;
      }
    },

    async clearTakedownTimer( userFunctions, roomFunctions, chatFunctions ) {
      // If takedown Timer has been set, clear since we've made it to the next song
      if ( takedownTimer !== null && roomFunctions.lastdj() !== undefined ) {
        clearTimeout( takedownTimer );
        takedownTimer = null;

        if ( typeof userFunctions.theUsersList()[ userFunctions.theUsersList().indexOf( roomFunctions.lastdj() ) + 1 ] !== 'undefined' ) {
          await chatFunctions.botSpeak( "@" + userFunctions.theUsersList()[ userFunctions.theUsersList().indexOf( roomFunctions.lastdj() ) + 1 ] + ", Thanks buddy ;-)" );
        } else {
          await chatFunctions.botSpeak( 'Thanks buddy ;-)' );
        }
      }
    },

    startSongWatchdog( data, userFunctions, socket ) {
      const length = data.nowPlaying.song.duration;
      const watchedDJ = userFunctions.getCurrentDJID( data );

      // Set a new watchdog timer for the current song.
      curSongWatchdog = setTimeout( function () {
        curSongWatchdog = null;

        if ( watchedDJ !== undefined ) {
          if ( userFunctions.userExists( watchedDJ ) !== 'undefined' ) {
            bot.speak( "@" + userFunctions.getUsername( watchedDJ ) + ", you have 20 seconds to skip your stuck song before you are removed" );
          } else {
            bot.speak( "current dj, you have 20 seconds to skip your stuck song before you are removed" );
          }
        }

        //START THE 20 SEC TIMER
        takedownTimer = setTimeout( async function () {
          takedownTimer = null;
          await userFunctions.removeDJ( watchedDJ, 'DJ removed because of a stuck song issue', socket ); // Remove Saved
          // DJ from last newsong call
        }, 20 * 1000 ); // Current DJ has 20 seconds to skip before they are removed
      }, ( length + 10 ) * 1000 ); //Timer expires 10 seconds after the end of the song, if not cleared by a newsong
    },

    // ========================================================

    // ========================================================
    // Song Info Functions
    // ========================================================

    songID: async () => await songID,

    songInfoCommand: async function ( data, databaseFunctions, chatFunctions ) {
      console.log('this:', this); // Logs the value of `this`
      console.log(`this.songID: ${JSON.stringify( await this.songID(), null, 2)}`);
      // if ( await databaseFunctions.checkVideoDataExists( this.ytid() ) ) {
      //   await databaseFunctions.getSongInfoData( this.ytid() )
      //     .then( ( songInfo ) => {
      //       chatFunctions.botSpeak( "The song " + songInfo.trackName + " by " + songInfo.artistName + " has been played " + songInfo.playCount + " times by " + songInfo.djCount + " different DJs, and was first played on " + songInfo.firstPlay );
      //     } )
      // } else {
      //   chatFunctions.botSpeak( "I can't find a confirmed listing for this track" );
      // }
    },

    searchSpotifyCommand( data, databaseFunctions, mlFunctions, chatFunctions ) {
      let verifiedSong;
      let verifiedArtist;

      const getVerifiedTracks = databaseFunctions.getVerifiedTracksFromName( song )
        .then( ( array ) => {
          verifiedSong = array[ 0 ].displayName;
        } );

      const getVerifiedArtists = databaseFunctions.getVerifiedArtistsFromName( artist )
        .then( ( array ) => {
          verifiedArtist = array[ 0 ].displayName;
        } );

      Promise.all( [ getVerifiedTracks, getVerifiedArtists ] )
        .then( () => {
          if ( verifiedSong && verifiedArtist ) {
            mlFunctions.searchSpotify( verifiedSong, verifiedArtist )
              .then( ( returned ) => {
                console.log( "Got this:" + returned );
                // chatFunctions.botSpeak( "This is " + verifiedSong + " by " + verifiedArtist, data );
                // chatFunctions.botSpeak( returned.thumbnail, data );
                // chatFunctions.botSpeak( "Released in " + returned.releaseCountry + " in " + returned.releaseYear, data );
                // chatFunctions.botSpeak( "More info can be found here: " + returned.discogsUrl, data );

                //console.log( "tracklist:" + returned.tracklist );
              } )
              .catch( () => {
                chatFunctions.botSpeak( "Sorry, I couldn't find that online: " + verifiedSong + " by " + verifiedArtist );
              } )
          } else {
            chatFunctions.botSpeak( "Sorry, I couldn't find that in my Database" );
          }
        } )
        .catch( ( error ) => {
          console.log( "Error:", error );
        } );

    },

    searchMusicBrainzCommand( data, databaseFunctions, mlFunctions, chatFunctions ) {
      let verifiedSong;
      let verifiedArtist;

      const getVerifiedTracks = databaseFunctions.getVerifiedTracksFromName( song )
        .then( ( array ) => {
          verifiedSong = array[ 0 ].displayName;
        } );

      const getVerifiedArtists = databaseFunctions.getVerifiedArtistsFromName( artist )
        .then( ( array ) => {
          verifiedArtist = array[ 0 ].displayName;
        } );

      Promise.all( [ getVerifiedTracks, getVerifiedArtists ] )
        .then( () => {
          if ( verifiedSong && verifiedArtist ) {
            mlFunctions.searchMusicBrainz( verifiedSong, verifiedArtist )
              .then( ( returned ) => {
                console.log( "Got this:" + returned );
                // chatFunctions.botSpeak( "This is " + verifiedSong + " by " + verifiedArtist, data );
                // chatFunctions.botSpeak( returned.thumbnail, data );
                // chatFunctions.botSpeak( "Released in " + returned.releaseCountry + " in " + returned.releaseYear, data );
                // chatFunctions.botSpeak( "More info can be found here: " + returned.discogsUrl, data );

                //console.log( "tracklist:" + returned.tracklist );
              } )
              .catch( () => {
                chatFunctions.botSpeak( "Sorry, I couldn't find that online: " + verifiedSong + " by " + verifiedArtist );
              } )
          } else {
            chatFunctions.botSpeak( "Sorry, I couldn't find that in my Database" );
          }
        } )
        .catch( ( error ) => {
          console.log( "Error:", error );
        } );

    },

    // ========================================================
  }
}

export default songFunctions;
