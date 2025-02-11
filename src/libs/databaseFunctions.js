import pool from '../libs/dbConnectionPool.js'
import { logger } from "../utils/logging.js";

const databaseFunctions = () => {

  return {

    // ========================================================
    // Database Functions
    // ========================================================

    runQuery: async function ( query, values ) {
      return new Promise( ( resolve, reject ) => {
        pool.getConnection( ( ex, connection ) => {
          if ( ex ) {
            console.error( `Error acquiring connection from pool: ${ ex }` );
            reject( new Error( 'Error acquiring connection from pool' ) );
          } else {
            connection.query( query, values, ( ex, results, fields ) => {
              connection.release();
              if ( ex ) {
                console.error( `Query execution failed: ${ ex }\nQuery: ${ query }` );
                reject( new Error( `Query execution failed: ${ ex }` ) );
              } else {
                resolve( results );
              }
            } );
          }
        } );
      } ).catch( error => {
        console.error( 'Promise rejection with reason:', error );
        throw error; // Rethrow the error for further investigation
      } );
    },

    buildSaveUserQuery: async function ( userObject ) {
      const id = userObject[ "id" ];
      const username = encodeURIComponent( userObject[ "username" ] )

      let moderator = "False";
      let joinTime = 0;
      let currentDJ = "False";
      let lastVoted = 0;
      let lastSpoke = 0;
      let currentPlayCount = 0;
      let totalPlayCount = 0;
      let joinedStage = 0;
      let firstIdleWarning = "False";
      let secondIdleWarning = "False";
      let spamCount = 0;
      let lastSnagged = 0;
      let region = "";
      let BBBootTimestamp = 0;
      let BBBootedTimestamp = 0;
      let noiceCount = 0;
      let propsCount = 0;
      let RoboCoins = 0;
      let here = "";
      let email = "";
      let password_hash = "NULL";

      if ( userObject[ "moderator" ] !== undefined ) { moderator = userObject[ "moderator" ] }
      if ( userObject[ "joinTime" ] !== undefined ) { joinTime = userObject[ "joinTime" ] }
      if ( userObject[ "currentDJ" ] !== undefined ) { currentDJ = userObject[ "currentDJ" ] }
      if ( userObject[ "lastVoted" ] !== undefined ) { lastVoted = userObject[ "lastVoted" ] }
      if ( userObject[ "lastSpoke" ] !== undefined ) { lastSpoke = userObject[ "lastSpoke" ] }
      if ( userObject[ "currentPlayCount" ] !== undefined ) { currentPlayCount = userObject[ "currentPlayCount" ] }
      if ( userObject[ "totalPlayCount" ] !== undefined ) { totalPlayCount = userObject[ "totalPlayCount" ] }
      if ( userObject[ "joinedStage" ] !== undefined ) { joinedStage = userObject[ "joinedStage" ] }
      if ( userObject[ "firstIdleWarning" ] !== undefined ) { firstIdleWarning = userObject[ "firstIdleWarning" ] }
      if ( userObject[ "secondIdleWarning" ] !== undefined ) { secondIdleWarning = userObject[ "secondIdleWarning" ] }
      if ( userObject[ "spamCount" ] !== undefined ) { spamCount = userObject[ "spamCount" ] }
      if ( userObject[ "lastSnagged" ] !== undefined ) { lastSnagged = userObject[ "lastSnagged" ] }
      if ( userObject[ "region" ] !== undefined ) { region = userObject[ "region" ] }
      if ( userObject[ "BBBootTimestamp" ] !== undefined ) { BBBootTimestamp = userObject[ "BBBootTimestamp" ] }
      if ( userObject[ "BBBootedTimestamp" ] !== undefined ) { BBBootedTimestamp = userObject[ "BBBootedTimestamp" ] }
      if ( userObject[ "noiceCount" ] !== undefined ) { noiceCount = userObject[ "noiceCount" ] }
      if ( userObject[ "propsCount" ] !== undefined ) { propsCount = userObject[ "propsCount" ] }
      if ( userObject[ "RoboCoins" ] !== undefined ) { RoboCoins = userObject[ "RoboCoins" ] }
      if ( userObject[ "here" ] !== undefined ) { here = userObject[ "here" ] }
      if ( userObject[ "email" ] !== undefined ) { email = userObject[ "email" ] }
      if ( userObject[ "password_hash" ] !== undefined ) { password_hash = userObject[ "password_hash" ] }

      return `REPLACE
                  INTO users (id, username, moderator, joinTime, currentDJ, lastVoted, lastSpoke,
                              currentPlayCount, totalPlayCount, joinedStage, firstIdleWarning,
                              secondIdleWarning, spamCount, lastSnagged, region, BBBootTimestamp, BBBootedTimestamp,
                              noiceCount, propsCount, RoboCoins, here, password_hash, email)
              VALUES ("${ id }", "${ username }",
                      ${ moderator },
                      ${ joinTime },
                      "${ currentDJ }",
                      ${ lastVoted },
                      ${ lastSpoke },
                      ${ currentPlayCount },
                      ${ totalPlayCount },
                      ${ joinedStage },
                      "${ firstIdleWarning }",
                      "${ secondIdleWarning }",
                      ${ spamCount },
                      ${ lastSnagged },
                      "${ region }",
                      ${ BBBootTimestamp },
                      ${ BBBootedTimestamp },
                      ${ noiceCount },
                      ${ propsCount },
                      ${ RoboCoins },
                      "${ here }",
                      "${ password_hash }",
                      "${ email }");`;

    },

    writeUserDataToDatabase: async function ( userObject ) {
      try {
        const query = await this.buildSaveUserQuery( userObject );
        await this.runQuery( query );
      } catch ( error ) {
        throw new Error( `Error writing user data to database: ${ error.message }` );
      }
    },

    loadUserFromDatabase: async function ( uuid ) {
      const theQuery = "SELECT id, username, moderator, joinTime, currentDJ, lastVoted, lastSpoke, currentPlayCount," +
        " totalPlayCount, joinedStage, firstIdleWarning, secondIdleWarning, spamCount, lastSnagged, region," +
        " BBBootTimestamp, BBBootedTimestamp, noiceCount, propsCount, RoboCoins, here, password_hash, email FROM" +
        " users where id = ?"
      const theValues = [ uuid ];
      try {
        const result = await this.runQuery( theQuery, theValues );
        return result[ 0 ]
      } catch ( error ) {
        console.error( `Unable to load user ${ uuid } from database:`, error.message );
        throw error;
      }
    },

    // ========================================================
    // "Memory" Functions
    // ========================================================

    recordMemory: async function ( key, value ) {
      const theQuery = "REPLACE INTO persistentMemory ( theKey, theValue ) VALUES (?, ?)";
      const theValues = [ key, value ];
      try {
        await this.runQuery( theQuery, theValues );
      } catch ( error ) {
        console.error( 'Unable to save memory:', error.message );
        throw error;
      }
    },

    retrieveMemory: async function ( key ) {
      const theQuery = "SELECT theValue FROM persistentMemory WHERE theKey = ?";
      const theValues = [ key ];
      try {
        const result = await this.runQuery( theQuery, theValues );
        if ( result.length > 0 ) {
          return result[ 0 ].theValue;
        } else {
          return null;
        }
      } catch ( error ) {
        console.error( 'Unable to retrieve memory:', error.message );
        throw error;
      }
    },

    // ========================================================

    // ========================================================
    // Persistent User Functions
    // ========================================================

    storeUserData: async function ( userObject ) {
      try {
        const userToSave = this.removeUnsavableDataFromUser( userObject );

        await this.writeUserDataToDatabase( userToSave );
        return Promise.resolve();
      } catch ( error ) {
        return Promise.reject( error );
      }
    },

    userExistsInDatabase: async function ( uuid ) {
      const theQuery = "SELECT count(*) as theCount FROM users WHERE id = ?";
      const theValues = [ uuid ];
      const result = await this.runQuery( theQuery, theValues );

      return result[0].theCount > 0;
    },

    removeUnsavableDataFromUser: function ( userObject ) {
      // delete the spamTimer if it's in the object or it'll crash the save due to a circular reference
      const editedUser = Object.assign( {}, userObject, { spamTimer: undefined } );

      // remove refresh properties from permanent storage
      delete editedUser[ "RefreshCount" ];
      delete editedUser[ "RefreshStart" ];
      delete editedUser[ "RefreshCurrentPlayCount" ];
      delete editedUser[ "RefreshTotalPlayCount" ];
      delete editedUser[ "RefreshTimer" ];

      // don't store the welcome timer in permanent storage
      delete editedUser[ "welcomeTimer" ];

      return editedUser;
    },

    retrieveHashedPassword: async function ( username ) {
      const theQuery = "SELECT password_hash FROM users WHERE username = ?";
      const theValues = [ username ];

      try {
        const result = await this.runQuery( theQuery, theValues );

        if ( result && result.length > 0 && result[ 0 ].password_hash !== null ) {
          // If there is a result, return the password hash
          return result[ 0 ].password_hash;
        } else {
          // If the result is empty, the user doesn't exist
          return false;
        }
      } catch ( error ) {
        console.error( 'Error in retrieveHashedPassword:', error.message );
        // Handle the error as needed
        throw error; // Rethrow the error if necessary
      }
    },

    getUsersEmailAddress: async function ( userID ) {
      const theQuery = "SELECT email FROM users WHERE id = ?";
      const theValues = [ userID ];

      try {
        const result = await this.runQuery( theQuery, theValues );

        if ( result && result.length > 0 && result[ 0 ].email !== null && result[ 0 ].email !== "" ) {
          return result[ 0 ].email;
        } else {
          return false;
        }
      } catch ( error ) {
        console.error( 'Error in retrieveHashedPassword:', error.message );
        throw error; // Rethrow the error if necessary
      }
    },
    
    resetAllCurrentDJs: async function () {
      const theQuery = "UPDATE users SET currentDJ = false";
      const theValues = [ ];
      try {
        return await this.runQuery( theQuery, theValues );
      } catch ( error ) {
        console.error( 'Error in resetAllCurrentDJs:', error.message );
        throw error; 
      }
    },

    // ========================================================

    // ========================================================
    // RoboCoin Audit Functions
    // ========================================================

    saveRoboCoinAudit: async function ( userID, before, after, numCoins, changeReason, changeID ) {
      const theQuery = "INSERT INTO roboCoinAudit (users_id, beforeChange, afterChange, numCoins, changeReason, auditType_id) VALUES (?, ?, ?, ?, ?, ?);";
      const values = [ userID, before, after, numCoins, changeReason, changeID ];

      try {
        return await this.runQuery( theQuery, values );
      } catch ( error ) {
        console.error( 'Error in saveRoboCoinAudit:', error.message );
        throw error; 
      }
    },

    hasUserHadInitialRoboCoinGift: async function ( userID ) {
      const theQuery = "SELECT COUNT(*) AS gifted FROM roboCoinAudit WHERE users_id=? AND auditType_id=1;";
      const values = [ userID ];
      try {
        const result = await this.runQuery( theQuery, values );
        const firstElement = result && result[ 0 ];
        const giftedValue = firstElement && firstElement.gifted;

        return giftedValue > 0;
      } catch ( error ) {
        console.error( 'Error in checking hasUserHadInitialRoboCoinGift in the DB:', error.message );
        // Handle the error as needed
        throw error; // Rethrow the error if necessary
      }
    },

    // ========================================================

    // ========================================================
    // BBBoot Functions
    // ========================================================

    getAllBBBootTargets: async function () {
      const theQuery = "select DISTINCT(id) from users where BBBootTimestamp !=0;";
      const values = [  ];
      try {
        const result = await this.runQuery( theQuery, values );
        return result.map(item => item.id);
      } catch ( error ) {
        console.error( 'Error in running getAllBBBootTarget in the DB:', error.message );
        // Handle the error as needed
        throw error; // Rethrow the error if necessary
      }
    },

    // ========================================================

    // ========================================================
    // Song Data Functions
    // ========================================================

    saveTrackData: async function ( djID, songData ) {
      let songShortId
      if ( await this.doesTrackMatchingShortCodeExists( songData.songShortId ) ) {
        songShortId = songData.songShortId
        await this.saveTrackPlayed(djID, songShortId, songData.duration)
      } else {
        const songShortId = songData.songShortId
        const youTubeID = songData.musicProviders.youtube || null
        const appleID = songData.musicProviders.apple || null
        const spotifyID = songData.musicProviders.spotify || null
        const artist = songData.artistName;
        const song = songData.trackName;

        let videoID 
        videoID = await this.getVideoDataID( songShortId, youTubeID, appleID, spotifyID );

        if ( !videoID && songShortId ) {
          let theQuery = "INSERT INTO videoData (id, artistName, trackName, youTubeID, appleID, spotifyID) VALUES" +
            " (?, ?, ?, ?, ?, ?)";
          const values = [ songShortId, artist, song, youTubeID, appleID, spotifyID ];
          await this.runQuery( theQuery, values )
          videoID = await this.getVideoDataID( songShortId, youTubeID, appleID, spotifyID );
        } else {
          // maybe send a warning here that the track may not play?!?
          // console.log(`No songShortID available\n${JSON.stringify(songData, null, 2)}`)
        }
        await this.saveTrackPlayed(djID, videoID, songData.duration)
      }
    },
    
    saveTrackPlayed: async function( djID, videoDataID, length ) {
      let theQuery = "INSERT INTO tracksPlayed (djID, videoData_id, length) VALUES (?, ?, ?);"
      let values = [ djID, videoDataID, length ];
      await this.runQuery( theQuery, values )
        .then( async ( result ) => {
          const trackID = result.insertId - 1
          if ( !await this.isPlayedLengthSet( trackID ) ) {
            return this.setTrackPlayedLength( trackID );
          }
        } )
    },
    
    doesTrackMatchingShortCodeExists: async function ( videoID ) {
      const theQuery = "SELECT COUNT(id) as count FROM videoData WHERE id = ?";
      const values = [ videoID ];

      try {
        const result = await this.runQuery( theQuery, values );
        const count = result[ 0 ][ 'count' ];
        return count !== 0;
      } catch ( error ) {
        console.error( "Error:", error );
        throw error;
      }
    },

    getVideoDataID: async function ( videoID, youTubeID, appleID, spotifyID ) {
      const theQuery = "SELECT id FROM videoData WHERE id = ? OR youTubeID = ? OR appleID = ? OR spotifyID = ?" +
        " ORDER BY youTubeID DESC, appleID DESC, spotifyID DESC LIMIT 1";
      const values = [ videoID, youTubeID, appleID, spotifyID ];
      // console.log(`getVideoDataID theQuery:${theQuery}`)
      // console.log(`getVideoDataID values:${JSON.stringify(values)}`)

      try {
        const result = await this.runQuery( theQuery, values );
        // console.log(`getVideoDataID result:${JSON.stringify(result, null, 2)}`)
        if (result.length > 0) {
          return result[0]['id'];
        } else {
          return false;
        }
      } catch ( error ) {
        console.error( "Error:", error );
        throw error;
      }
    },

    setTrackPlayedLength: async function ( trackID ) {
      return this.calcTrackPlayedLength( trackID )
        .then( ( playedLength ) => {
          let theQuery = "UPDATE tracksPlayed SET playedLength = ? WHERE id = ?;"
          let values = [ playedLength, trackID ];
          return this.runQuery( theQuery, values );
        } )
    },
    
    isPlayedLengthSet: async function ( trackID ) {
      const theQuery = "SELECT playedLength FROM tracksPlayed where id = ?"
      const values = [ trackID ];
      const result = await this.runQuery( theQuery, values );
      return result[0]['playedLength'] !== 0;
    },
    
    setPlayedLengthForLastTrack: async function () {
      let theQuery = "SELECT id, whenPlayed FROM tracksPlayed ORDER BY id DESC LIMIT 1"
      let values = [ ];
      const result = await this.runQuery( theQuery, values );
      const trackID = result[ 0 ][ 'id' ];
      const whenPlayed = result[ 0 ][ 'whenPlayed' ]

      if ( !await this.isPlayedLengthSet( trackID ) ) {
        const now = new Date();
        const playedLength = Math.floor( ( now - whenPlayed ) / 1000 ); // played length in seconds
        theQuery = "UPDATE tracksPlayed SET playedLength = ? WHERE id = ?;"
        values = [ playedLength, trackID ];
        return await this.runQuery( theQuery, values );
      }
    },

    getArtistID: function ( theName ) {
      const selectQuery = `SELECT id
                           FROM artists
                           WHERE artistName = ?;`;
      const values = [ theName ];
      return this.runQuery( selectQuery, values )
        .then( ( result ) => {
          if ( result.length !== 0 ) {
            return result[ 0 ][ 'id' ];
          } else {
            const insertQuery = "INSERT INTO artists (artistName) VALUES (?);";
            const values = { artistName: theName }
            return this.runQuery( insertQuery, values )
              .then( ( result ) => {
                return result.insertId;
              } );
          }
        } )
    },

    getTrackID: function ( theName ) {
      const selectQuery = `SELECT id
                           FROM tracks
                           WHERE trackName = ?;`;
      const values = [ theName ];
      return this.runQuery( selectQuery, values )
        .then( ( result ) => {
          if ( result.length !== 0 ) {
            return result[ 0 ][ 'id' ];
          } else {
            const insertQuery = "INSERT INTO tracks (trackName) VALUES (?);";
            const values = { trackName: theName }
            return this.runQuery( insertQuery, values )
              .then( ( result ) => {
                return result.insertId;
              } );
          }
        } )
    },

    saveLastSongStats: async function ( songFunctions ) {
      return this.getLastSongID( songFunctions.previousArtist(), songFunctions.previousTrack() )
        .then( ( theID ) => {
          const query = "UPDATE tracksPlayed tp SET upvotes=?, downvotes=?, snags=?, jumps=? WHERE tp.id=?";
          const values = [ songFunctions.previousUpVotes(), songFunctions.previousDownVotes(), songFunctions.previousSnags(), songFunctions.previousJumps(), theID ];
          return this.runQuery( query, values )
        } )
        .catch( ( ex ) => { console.error( "Something went wrong saving the song stats: .then( ( theID ) " + ex ); } );
    },

    getLastSongID: function ( theArtist, theTrack ) {
      const selectQuery = "SELECT MAX(tp.id) AS theID FROM tracksPlayed tp JOIN videoData vd ON" +
        " tp.videoData_id=vd.id WHERE vd.trackname=? AND vd.artistName=?;";
      const values = [ theTrack, theArtist ];
      return this.runQuery( selectQuery, values )
        .then( ( result ) => {
          return result[ 0 ][ 'theID' ];
        } )
    },

    getCurrentSongID: function () {
      const selectQuery = "SELECT MAX(tp.id) AS theID FROM tracksPlayed tp;";
      const values = [];
      return this.runQuery( selectQuery, values )
        .then( ( result ) => {
          if ( result.length !== 0 ) {
            return result[ 0 ][ 'theID' ];
          }
        } )
    },

    calcTrackPlayedLength: function ( trackID ) {
      return this.getTrackPlayedTime( trackID )
        .then( ( thisTrackPlayedTime ) => {
          return this.getTrackPlayedTime( trackID + 1 )
            .then( ( nextTrackPlayedTime ) => {
              return nextTrackPlayedTime - thisTrackPlayedTime;
            } )
        } )
        .catch( ( ex ) => { console.error( "Something went wrong calculating the track playedLength: " + ex ); } );
    },

    getTrackPlayedTime: function ( trackID ) {
      const selectQuery = "SELECT UNIX_TIMESTAMP(whenPlayed) AS timestampPlayed FROM tracksPlayed tp WHERE tp.id = ?;";
      const values = [ trackID ];
      return this.runQuery( selectQuery, values )
        .then( ( result ) => {
          if ( result.length !== 0 ) {
            return result[ 0 ][ 'timestampPlayed' ];
          }
        } )
        .catch( ( ex ) => { console.error( "Something went wrong getting the track played time: " + ex ); } );
    },

    getSongInfoData: async function (songID) {
      let songInfo = {};

      const nameQuery = "SELECT COALESCE(artistDisplayName, artistName) AS artistName, COALESCE(trackDisplayName, trackName) AS trackName FROM videoData WHERE id=?";
      const nameValues = [songID];

      const whenQuery = "SELECT DATE_FORMAT(MIN(tp.whenPlayed), '%W %D %M %Y') as firstPlay, COUNT(tp.id) AS playCount, COUNT(DISTINCT(djID)) AS djCount " +
        "FROM videoData vd JOIN tracksPlayed tp ON tp.videoData_id=vd.id " +
        "WHERE COALESCE(artistDisplayName, artistName) = ? AND COALESCE(trackDisplayName, trackName) = ?;";

      const firstDJQuery = "SELECT u.username FROM users u " +
        "JOIN tracksPlayed tp ON u.id=tp.djID " +
        "JOIN videoData vd ON tp.videoData_id=vd.id " +
        "WHERE COALESCE(artistDisplayName, artistName) = ? AND COALESCE(trackDisplayName, trackName) = ? " +
        "ORDER BY tp.whenPlayed ASC LIMIT 1";

      return this.runQuery(nameQuery, nameValues)
        .then((results) => {
          songInfo.artistName = results[0].artistName;
          songInfo.trackName = results[0].trackName;
          const whenValues = [songInfo.artistName, songInfo.trackName];
          return this.runQuery(whenQuery, whenValues);
        })
        .then((results) => {
          songInfo.firstPlay = results[0].firstPlay;
          songInfo.playCount = results[0].playCount;
          songInfo.djCount = results[0].djCount;
          const whenValues = [songInfo.artistName, songInfo.trackName];
          return this.runQuery(firstDJQuery, whenValues);
        })
        .then((results) => {
          songInfo.username = results[0]?.username || null; // Handle case where no result is returned
          return songInfo;
        })
        .catch((error) => {
          console.error('Error:', error);
          throw error;
        });
    },
    
    getPreviousPlays: async function () {
      const selectQuery = "SELECT " +
                          "COALESCE(v.artistDisplayName, v.artistName) AS artist, " +
                          "COALESCE(v.trackDisplayName, v.trackName)   AS track " + 
                          "FROM videoData v " +
                          "JOIN tracksPlayed tp ON tp.videoData_id=v.id " +
                          "ORDER BY tp.whenPlayed DESC LIMIT 5;";
      const values = [  ];
      return this.runQuery( selectQuery, values )
        .then( ( result ) => {
          console.log(`getPreviousPlays result: ${JSON.stringify(result, null, 2)}`);
          if ( result.length !== 0 ) {
            return result;
          }
        } )
        .catch( ( ex ) => { console.error( "Something went wrong the previous plays: " + ex ); } );
    },

    // ========================================================

    // ========================================================
    // DB Track Editing Functions
    // ========================================================

    getVerificationDJStats: async function () {
      const theQuery = "SELECT u.username AS 'Username', count(*) AS 'Fixes' FROM roboCoinAudit ra JOIN users u ON u.id=ra.users_id WHERE ra.auditType_id=5 GROUP BY ra.users_id ORDER BY count(*) DESC;";
      const values = [];

      return this.runQuery( theQuery, values )
        .then( ( result ) => {
          const djStats = {};
          result.forEach( ( row ) => {
            djStats[ row.Username ] = row.Fixes;
          } );
          return djStats;
        } )
        .catch( ( error ) => {
          console.error( 'Error in getVerifiedStats:', error );
          throw error;
        } );
    },

    getVerifiedStats: async function () {
      const theQuery = "SELECT 'Fixed' AS 'Metric', count(*) AS 'Count' FROM videoData WHERE artistDisplayName IS NOT NULL AND trackDisplayName IS NOT NULL UNION ALL SELECT 'Unfixed' AS 'Metric', SUM(if(artistDisplayName IS NULL, 1, 0))+SUM(if(trackDisplayName IS NULL, 1, 0)) AS 'Count' FROM videoData UNION ALL SELECT 'Total' AS 'Metric', count(*) AS 'Count' FROM videoData;";
      const values = [];

      return this.runQuery( theQuery, values )
        .then( ( result ) => {
          const stats = {};
          result.forEach( ( row ) => {
            stats[ row.Metric ] = row.Count;
          } );
          return stats;
        } )
        .catch( ( error ) => {
          console.error( 'Error in getVerifiedStats:', error );
          throw error;
        } );
    },

    getRandomVerifiedArtist() {
      return new Promise( ( resolve, _ ) => {
        const selectQuery = "SELECT DISTINCT(displayName) FROM artists WHERE displayName IS NOT NULL ORDER BY RAND() LIMIT 1;";
        const values = [];

        this.runQuery( selectQuery, values )
          .then( ( result ) => {
            if ( result.length !== 0 ) {
              resolve( result[ 0 ][ 'displayName' ] );
            }
          } )
      } )
    },

    getVerifiedArtistsFromName( theArtist ) {
      const selectQuery = "SELECT artistDisplayName FROM videoData WHERE artistName = ?;";
      const values = [ theArtist ];

      return this.runQuery( selectQuery, values )
        .then( ( result ) => {
          return result;
        } );
    },

    getVerifiedArtistFromID( youtube_id ) {
      const selectQuery = "SELECT artistDisplayName FROM videoData WHERE id = ?;";
      const values = [ youtube_id ];

      return this.runQuery( selectQuery, values )
        .then( ( result ) => {
          return result;
        } );
    },

    getVerifiedTracksFromName( theSong ) {
      const selectQuery = "SELECT trackDisplayName FROM videoData WHERE trackName = ?;";
      const values = [ theSong ];

      return this.runQuery( selectQuery, values )
        .then( ( result ) => {
          return result;
        } );
    },

    getVerifiedTrackFromID( youtube_id ) {
      const selectQuery = "SELECT trackDisplayName FROM videoData WHERE id = ?;";
      const values = [ youtube_id ];

      return this.runQuery( selectQuery, values )
        .then( ( result ) => {
          return result;
        } );
    },

    getUnverifiedSongList( args ) {
      let orderByClause = '';
      let whereClause = '';
      const values = [];

      switch ( args.sort ) {
        case 'time':
          orderByClause = 'GROUP BY tp.videoData_id ORDER BY MAX(tp.whenPlayed) DESC';
          break;
        case 'artist':
          orderByClause = 'GROUP BY tp.videoData_id ORDER BY COALESCE(v.artistDisplayName, v.artistName) ASC,' +
            ' v.artistName ASC,' +
            ' COALESCE(v.trackDisplayName, v.trackName) ASC, v.trackName ASC, tp.videoData_id ASC';
          break;
        case 'track':
          orderByClause = 'GROUP BY tp.videoData_id ORDER BY COALESCE(v.trackDisplayName, v.trackName) ASC,' +
            ' v.trackName ASC,' +
            ' COALESCE(v.artistDisplayName, v.artistName) ASC, v.artistName ASC, tp.videoData_id ASC';
          break;
        default:
          orderByClause = 'GROUP BY tp.videoData_id ORDER BY MAX(tp.whenPlayed) DESC, v.artistName ASC, v.trackName' +
            ' ASC, tp.videoData_id ASC';
      }

      switch ( args.where ) {
        case 'track':
          whereClause = '(v.trackName LIKE ? OR v.trackDisplayName LIKE ?)';
          values.push( `%${ args.searchTerm }%`, `%${ args.searchTerm }%` );
          break;
        case 'artist':
          whereClause = '(v.artistName LIKE ? OR v.artistDisplayName LIKE ?)';
          values.push( `%${ args.searchTerm }%`, `%${ args.searchTerm }%` );
          break;
        default:
          whereClause = 'v.artistDisplayName IS NULL OR v.trackDisplayName IS NULL';
      }
      
      switch ( args.unverifiedonly ) {
        case 'true':
          whereClause = whereClause + ' AND (v.artistDisplayName IS NULL OR v.trackDisplayName IS NULL)';
      }

      const selectQuery = `
          SELECT tp.videoData_id,
                 v.youTubeID,
                 v.appleID,
                 SUBSTRING(v.spotifyID,15) AS "spotifyID",
                 v.artistName,
                 v.artistDisplayName,
                 v.trackName,
                 v.trackDisplayName,
                 MAX(tp.whenPlayed)
          FROM tracksPlayed tp
                   JOIN videoData v ON v.id = tp.videoData_id
          WHERE ${ whereClause }
                    ${ orderByClause }
          LIMIT 100`;

      return this.runQuery( selectQuery, values )
        .then( ( result ) => {
          return result;
        } );
    },

    updateArtistDisplayName( id, artistDisplayName ) {
      const trimmedDisplayName = artistDisplayName !== undefined ? artistDisplayName.trim() : artistDisplayName;
      const selectQuery = "UPDATE videoData SET artistDisplayName=? WHERE id=?;";
      const values = [ trimmedDisplayName, id ];

      return this.runQuery( selectQuery, values )
        .then( ( result ) => {
          return result;
        } );
    },

    updateTrackDisplayName( id, trackDisplayName ) {
      const trimmedDisplayName = trackDisplayName !== undefined ? trackDisplayName.trim() : trackDisplayName;
      const selectQuery = "UPDATE videoData SET trackDisplayName=? WHERE id=?;";
      const values = [ trimmedDisplayName, id ];

      return this.runQuery( selectQuery, values )
        .then( ( result ) => {
          return result;
        } );
    },

    // ========================================================

    // ========================================================
    // Command Functions
    // ========================================================

    incrementCommandCountForCurrentTrack: async function ( theCommand ) {
      this.getCurrentSongID()
        .then( ( trackID ) => {
          this.getCommandID( theCommand )
            .then( ( commandID ) => {
              this.getCurrentCommandCount( commandID, trackID )
                .then( ( commandCount ) => {
                  const query = "REPLACE INTO extendedTrackStats (count, commandsToCount_id, tracksPlayed_id) VALUES (?, ?, ?)";
                  const values = [ commandCount + 1, commandID, trackID ];
                  this.runQuery( query, values )
                } )
                .catch( ( ex ) => { console.error( "Something went wrong saving the extended stats: " + ex ); } );
            } )
            .catch( ( ex ) => { console.error( "Something went wrong finding the CommandID: " + ex ); } );
        } )
        .catch( ( ex ) => { console.error( "Something went wrong getting the current Command count: " + ex ); } );
    },

    getCommandID: function ( theCommand ) {
      const selectQuery = "SELECT id as theID FROM commandsToCount WHERE command = ?;";
      const values = [ theCommand ];
      return this.runQuery( selectQuery, values )
        .then( ( result ) => {
          if ( result.length !== 0 ) {
            return result[ 0 ][ 'theID' ];
          }
        } )
    },

    getCurrentCommandCount: function ( commandID, trackID ) {
      const selectQuery = "SELECT count as theCount FROM extendedTrackStats WHERE commandsToCount_id = ? AND tracksPlayed_id = ?;";
      const values = [ commandID, trackID ];
      return this.runQuery( selectQuery, values )
        .then( ( result ) => {
          if ( result.length !== 0 ) {
            return result[ 0 ][ 'theCount' ];
          } else {
            return 0;
          }
        } )
    },

    // ========================================================

    // ========================================================
    // Config Functions
    // ========================================================

    commandsToCount: function () {
      const selectQuery = "SELECT command FROM commandsToCount;";
      const values = [];
      return this.runQuery( selectQuery, values )
        .then( ( results ) => {
          return this.convertToArray( results, "command" );
        } )
    },

    // ========================================================

    // ========================================================
    // Helper Functions
    // ========================================================

    convertToArray: function ( results, column ) {
      let theArray = [];

      for ( let i = 0; i < results.length; i++ ) {
        let currentRow = results[ i ];
        let thisCommand = currentRow[ column ];
        theArray.push( thisCommand );
      }
      return theArray;
    },

    // ========================================================

    // ========================================================
    // Top 10 Functions
    // ========================================================

    async fullTop10Results( startDate, endDate, includeDays = [ 0, 1, 2, 3, 4, 5, 6 ] ) {
      const selectQuery = `SELECT COALESCE(v.artistDisplayName, v.artistName) AS "artist",
                                  COALESCE(v.trackDisplayName, v.trackName)   AS "track",
                                  (
                                      1 +
                                      SUM(tp.upvotes - tp.downvotes) +
                                      SUM(tp.snags * 6) +
                                      SUM(tp.jumps * 2) +
                                      SUM(IF(c.command = 'props', e.count, 0)) * 5 +
                                      SUM(IF(c.command = 'noice', e.count, 0)) * 5 +
                                      SUM(IF(c.command = 'spin', e.count, 0)) * 5 +
                                      SUM(IF(c.command = 'chips', e.count, 0)) * 5 +
                                      SUM(IF(c.command = 'tune', e.count, 0)) * 5
                                  ) *
                                  COUNT(DISTINCT (u.id))                      AS "points",
                                  count(tp.id)                                AS "plays"
                           FROM users u
                                    JOIN tracksPlayed tp ON tp.djID = u.id
                                    JOIN videoData v ON tp.videoData_id = v.id
                                    LEFT JOIN extendedTrackStats e ON e.tracksPlayed_id = tp.id
                                    LEFT JOIN commandsToCount c ON c.id = e.commandsToCount_id
                           WHERE CONVERT_TZ(tp.whenPlayed, 'UTC', 'US/Central') BETWEEN ? AND ? AND
                                 tp.playedLength > 60 AND
                                 u.username != 'Mr. Roboto' AND
                                 DAYOFWEEK(CONVERT_TZ(tp.whenPlayed, 'UTC', 'US/Central')) IN
                                 (${ includeDays.join( ', ' ) })
                           GROUP BY COALESCE(v.artistDisplayName, v.artistName),
                                    COALESCE(v.trackDisplayName, v.trackName)
                           ORDER BY 3 DESC, 4 DESC
                           LIMIT 20;`;

      const values = [ startDate, endDate ];

      try {
        return await this.runQuery( selectQuery, values );
      } catch ( error ) {
        console.error( error );
        throw error;
      }
    },

    async top10ByLikesResults( startDate, endDate, includeDays = [ 0, 1, 2, 3, 4, 5, 6 ] ) {
      const selectQuery = `SELECT COALESCE(v.artistDisplayName, v.artistName) AS "artist",
                                  COALESCE(v.trackDisplayName, v.trackName)   AS "track",
                                  SUM(tp.upvotes)                             as upvotes,
                                  SUM(tp.downvotes)                           as 'downvotes',
                                  count(tp.id)                                AS "plays"
                           FROM users u
                                    JOIN tracksPlayed tp ON tp.djID = u.id
                                    JOIN videoData v ON tp.videoData_id = v.id
                                    LEFT JOIN extendedTrackStats e ON e.tracksPlayed_id = tp.id
                                    LEFT JOIN commandsToCount c ON c.id = e.commandsToCount_id
                           WHERE CONVERT_TZ(tp.whenPlayed, 'UTC', 'US/Central') BETWEEN ? AND ? AND
                                 tp.playedLength > 60 AND
                                 u.username != 'Mr. Roboto' AND
                                 DAYOFWEEK(CONVERT_TZ(tp.whenPlayed, 'UTC', 'US/Central')) IN
                                 (${ includeDays.join( ', ' ) })
                           GROUP BY COALESCE(v.artistDisplayName, v.artistName),
                                    COALESCE(v.trackDisplayName, v.trackName)
                           ORDER BY 3 DESC, 4, 5 DESC
                           limit 15;`;

      const values = [ startDate, endDate ];

      try {
        return await this.runQuery( selectQuery, values );
      } catch ( error ) {
        console.error( error );
        throw error;
      }
    },

    async mostPlayedTracksResults( startDate, endDate, includeDays = [ 0, 1, 2, 3, 4, 5, 6 ] ) {
      const selectQuery = `SELECT COALESCE(v.artistDisplayName, v.artistName) AS "artist",
                                  COALESCE(v.trackDisplayName, v.trackName)   AS "track",
                                  SUM(tp.upvotes - tp.downvotes)              as 'points',
                                  count(tp.id)                                AS "plays"
                           FROM users u
                                    JOIN tracksPlayed tp ON tp.djID = u.id
                                    JOIN videoData v ON tp.videoData_id = v.id
                                    LEFT JOIN extendedTrackStats e ON e.tracksPlayed_id = tp.id
                                    LEFT JOIN commandsToCount c ON c.id = e.commandsToCount_id
                           WHERE CONVERT_TZ(tp.whenPlayed, 'UTC', 'US/Central') BETWEEN ? AND ? AND
                                 tp.playedLength > 60 AND
                                 u.username != 'Mr. Roboto' AND
                                 DAYOFWEEK(CONVERT_TZ(tp.whenPlayed, 'UTC', 'US/Central')) IN
                                 (${ includeDays.join( ', ' ) })
                           GROUP BY COALESCE(v.artistDisplayName, v.artistName),
                                    COALESCE(v.trackDisplayName, v.trackName)
                           ORDER BY 4 DESC, 3 DESC
                           limit 15;`;

      const values = [ startDate, endDate ];

      try {
        return await this.runQuery( selectQuery, values );
      } catch ( error ) {
        console.error( error );
        throw error;
      }
    },


    async mostPlayedArtistsResults( startDate, endDate, includeDays = [ 0, 1, 2, 3, 4, 5, 6 ] ) {
      const selectQuery = `SELECT artist, COUNT(*) as "plays", SUM(points) as "points"
                           FROM (SELECT COALESCE(v.artistDisplayName, v.artistName) as "artist",
                                        ( 1 +
                                        SUM(tp.upvotes - tp.downvotes) +
                                        SUM(tp.snags * 6) +
                                        SUM(tp.jumps * 2) +
                                        SUM(IF(c.command = 'props', e.count, 0)) * 5 +
                                        SUM(IF(c.command = 'noice', e.count, 0)) * 5 +
                                        SUM(IF(c.command = 'spin', e.count, 0)) * 5 +
                                        SUM(IF(c.command = 'chips', e.count, 0)) * 5 +
                                        SUM(IF(c.command = 'tune', e.count, 0)) * 5
                                        ) *
                                        COUNT(DISTINCT (u.id))                      AS "points"
                                 FROM users u
                                          JOIN tracksPlayed tp ON tp.djID = u.id
                                          JOIN videoData v ON tp.videoData_id = v.id
                                          LEFT JOIN extendedTrackStats e ON e.tracksPlayed_id = tp.id
                                          LEFT JOIN commandsToCount c ON c.id = e.commandsToCount_id
                                 WHERE CONVERT_TZ(tp.whenPlayed, 'UTC', 'US/Central') BETWEEN ? AND ? AND
                                       tp.playedLength > 60 AND
                                       u.username != 'Mr. Roboto' AND
                                       DAYOFWEEK(CONVERT_TZ(tp.whenPlayed, 'UTC', 'US/Central')) IN
                                       (${ includeDays.join( ', ' ) })
                                 GROUP BY tp.id, COALESCE(v.artistDisplayName, v.artistName)) trackPoints
                           GROUP BY Artist
                           ORDER BY 2 DESC, 3 DESC
                           limit 15;`;

      const values = [ startDate, endDate ];

      try {
        return await this.runQuery( selectQuery, values );
      } catch ( error ) {
        console.error( error );
        throw error;
      }
    },

    async roomSummaryResults( startDate, endDate ) {
      const selectQuery = `SELECT COUNT(tp.id)           AS "plays",
                                  COUNT(DISTINCT (u.id)) AS "djs",
                                  SUM(tp.upvotes)        AS "upvotes",
                                  SUM(tp.downvotes)      as "downvotes"
                           FROM tracksPlayed tp
                                    JOIN users u ON tp.djID = u.id
                           WHERE CONVERT_TZ(tp.whenPlayed, 'UTC', 'US/Central') BETWEEN ? AND ? AND
                                 u.username != 'Mr. Roboto';`;
      const values = [ startDate, endDate ];

      try {
        return await this.runQuery( selectQuery, values );
      } catch ( error ) {
        console.error( error );
        throw error;
      }
    },

    async top10DJResults( startDate, endDate ) {
      const selectQuery = `SELECT dj, SUM(points) as "points"
                           FROM (SELECT u.username                                    as "dj",
                                    ( 1 +
                                    SUM(tp.upvotes - tp.downvotes) +
                                    SUM(tp.snags * 6) +
                                    SUM(tp.jumps * 2) +
                                    SUM(IF(c.command = 'props', e.count, 0)) * 5 +
                                    SUM(IF(c.command = 'noice', e.count, 0)) * 5 +
                                    SUM(IF(c.command = 'spin', e.count, 0)) * 5 +
                                    SUM(IF(c.command = 'chips', e.count, 0)) * 5 +
                                    SUM(IF(c.command = 'tune', e.count, 0)) * 5
                                    ) AS "points"
                                 FROM users u
                                        JOIN tracksPlayed tp ON tp.djID = u.id
                                        JOIN videoData v ON tp.videoData_id = v.id
                                        LEFT JOIN extendedTrackStats e ON e.tracksPlayed_id = tp.id
                                        LEFT JOIN commandsToCount c ON c.id = e.commandsToCount_id
                                 WHERE CONVERT_TZ(tp.whenPlayed, 'UTC', 'US/Central') BETWEEN ? AND ? AND
                                       tp.playedLength > 60
                                 GROUP BY tp.id, u.username) trackPoints
                           GROUP BY dj
                           ORDER BY 2 DESC
                           LIMIT 11;`;
      const values = [ startDate, endDate ];

      try {
        return await this.runQuery( selectQuery, values );
      } catch ( error ) {
        console.error( error );
        throw error;
      }
    },

    // ========================================================

    // ========================================================

    // ========================================================
    // Command & Alias Functions
    // ========================================================

    isChatCommand: async function ( value ) {
      const selectQuery = 'SELECT count(*) AS count FROM chatCommands WHERE command=?;';
      const values = [ value ];
      try {
        const result = await this.runQuery( selectQuery, values );
        return result[ 0 ].count > 0;
      } catch ( error ) {
        console.error( error );
        throw error;
      }
    },

    isAlias: async function ( value ) {
      const selectQuery = 'SELECT count(*) AS count FROM aliases WHERE alias=?;';
      const values = [ value ];
      try {
        const result = await this.runQuery( selectQuery, values );
        return result[ 0 ].count > 0;
      } catch ( error ) {
        console.error( error );
        throw error;
      }
    },

    getAliases: async function ( command ) {
      const selectQuery = 'SELECT alias FROM aliases WHERE command=?;';
      const values = [ command ];
      try {
        const result = await this.runQuery( selectQuery, values );
        return result.length > 0 ? result : false;
      } catch ( error ) {
        console.error( error );
        throw error;
      }
    },

    // getChatPicture: async function ( command ) {
    //   if ( await this.isChatCommand( command ) ) {
    //     const selectQuery = 'SELECT ci.imageURL FROM chatImages ci WHERE command=?;';
    //     const values = [ value ];
    //
    //   }
    // },

    // ========================================================

  }

}

export default databaseFunctions;