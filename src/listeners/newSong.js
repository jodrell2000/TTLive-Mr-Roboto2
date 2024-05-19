bot.on( 'newsong', function ( data ) {
  //resets counters and array for vote skipping
  songFunctions.resetVoteCountSkip();
  songFunctions.resetVotesLeft( roomDefaults.HowManyVotesToSkip );
  songFunctions.resetUpVotes();
  songFunctions.resetDownVotes();
  songFunctions.resetSnagCount();
  songFunctions.resetVoteSnagging();
  botFunctions.clearAllTimers( userFunctions, roomFunctions, songFunctions );

  //procedure for getting song tags
  //console.info( "data.room.metadata.current_song:" + JSON.stringify( data.room.metadata.current_song ) );
  songFunctions.getSongTags( data.room.metadata.current_song )
  databaseFunctions.saveLastSongStats( songFunctions );

  //set information
  roomFunctions.setDJCount( data.room.metadata.djs.length ); //the number of djs on stage
  roomDefaults.detail = data.room.description; //set room description again in case it was changed

  // set user as current DJ
  let djID = data.room.metadata.current_dj;
  userFunctions.setCurrentDJ( djID, databaseFunctions );

  if ( songFunctions.ytid() !== undefined ) {
    videoFunctions.checkVideoRegionAlert( data, songFunctions.ytid(), userFunctions, chatFunctions, botFunctions );
  }

  //adds a song to the end of your bots queue
  if ( songFunctions.snagSong() === true ) {
    botFunctions.checkAndAddToPlaylist( songFunctions );
  }

  //if true causes the bot to start bopping to the currently playing song
  if ( botDefaults.autoBop === true ) {
    bot.bop();
  }

  //check to see if conditions are met for bots autodjing feature
  botFunctions.checkAutoDJing( userFunctions );

  //if the bot is the only one on stage, and they are skipping their songs
  //they will stop skipping
  if ( roomFunctions.djCount() === 1 && userFunctions.getCurrentDJID() === authModule.USERID && botFunctions.skipOn === true ) {
    botFunctions.setSkipOn( false );
  }

  //used to have the bot skip its song if it's the current player and skipOn command was used
  if ( authModule.USERID === userFunctions.getCurrentDJID() && botFunctions.skipOn() === true ) {
    bot.skip();
  }

  //this is for /warnme
  userFunctions.warnMeCall( roomFunctions );

  botFunctions.isFavouriteArtist( databaseFunctions, data.room.metadata.current_song.metadata.artist )
    .then( ( result ) => {
      if ( result !== false ) {
        chatFunctions.botSpeak( "/props", data );
        chatFunctions.botSpeak( "Awesome play..." + result + " is my favourite!", data );
      }
    } )
    .then( () => {
      chatFunctions.botSpeak( "Have 10 RoboCoin as a thank you", data );
      userFunctions.addRoboCoins( djID, 10, "Played Robo's favourite artist", 3, databaseFunctions );
    } )
    .then( () => {
      botFunctions.chooseNewFavourite( databaseFunctions );
    } )
    .catch( ( error ) => {
      console.error( error );
    } );


  //removes current dj from stage if they play a banned song or artist.
  if ( musicDefaults.bannedArtists.length !== 0 && typeof songFunctions.artist() !== 'undefined' && typeof songFunctions.song() !== 'undefined' ) {
    const djCheck = userFunctions.getCurrentDJID();
    let checkIfAdmin = userFunctions.masterIds().indexOf( djCheck ); //is user an exempt admin?

    if ( checkIfAdmin === -1 ) {
      //if matching is enabled for both songs and artists
      if ( musicDefaults.matchArtists && musicDefaults.matchSongs ) {
        if ( songFunctions.artist().match( roomFunctions.bannedArtistsMatcher() ) || songFunctions.song().match( roomFunctions.bannedArtistsMatcher() ) ) {
          userFunctions.removeDJ( djCheck, 'DJ has played a banned song or artist' );

          if ( typeof userFunctions.getUsername( djCheck ) !== 'undefined' ) {
            bot.speak( '@' + userFunctions.getUsername( djCheck ) + ' you have played a banned track or artist.' );
          } else {
            bot.speak( 'current dj, you have played a banned track or artist.' );
          }
        }
      } else if ( musicDefaults.matchArtists ) //if just artist matching is enabled
      {
        if ( songFunctions.artist().match( roomFunctions.bannedArtistsMatcher() ) ) {
          userFunctions.removeDJ( djCheck, 'DJ has played a banned song or artist' );

          if ( typeof userFunctions.getUsername( djCheck ) !== 'undefined' ) {
            bot.speak( '@' + userFunctions.getUsername( djCheck ) + ' you have played a banned artist.' );
          } else {
            bot.speak( 'current dj, you have played a banned artist.' );
          }
        }
      } else if ( musicDefaults.matchSongs ) //if just song matching is enabled
      {
        if ( songFunctions.song().match( roomFunctions.bannedArtistsMatcher() ) ) {
          userFunctions.removeDJ( djCheck, 'DJ has played a banned song or artist' );

          if ( typeof userFunctions.getUsername( djCheck ) !== 'undefined' ) {
            bot.speak( '@' + userFunctions.getUsername( djCheck ) + ' you have played a banned track.' );
          } else {
            bot.speak( 'current dj, you have played a banned track.' );
          }
        }
      }
    }
  }

  //look at function above, /inform, song length limit,stuck song detection
  botFunctions.checkOnNewSong( data, roomFunctions, songFunctions, userFunctions );

  //quality control check, if current djs information is somehow wrong because
  //of some event not firing, remake currentDjs array
  // data.room.metadata.djs.length is index 0 so add 1 to compare
  if ( data.room.metadata.djs.length !== userFunctions.howManyDJs() ) {
    console.warn( botFunctions.getFormattedDate() + ' The DJ counts don\'t match...resetting them. Count from data is ' + data.room.metadata.djs.length + ', count from Bot is ' + userFunctions.howManyDJs() );
    userFunctions.resetDJs( data ); //reset current djs array
  }

  if ( roomFunctions.themeRandomizerEnabled() === true && userFunctions.lastDJPlaying() ) {
    roomFunctions.announceNewRandomThene( data, chatFunctions );
  }

  databaseFunctions.saveTrackData( djID, data.room.metadata.current_song );
} );
