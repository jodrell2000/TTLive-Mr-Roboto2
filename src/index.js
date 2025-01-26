import { Chain } from 'repeat'
import { Bot } from './libs/bot.js'

import commandFunctions from './libs/commandsFunctions.js'
import userFunctions from './libs/userFunctions.js'
import roomFunctions from './libs/roomFunctions.js'
import songFunctions from './libs/songFunctions.js'
import chatFunctions from './libs/chatFunctions.js'
import videoFunctions from './libs/videoFunctions.js'
import documentationFunctions from './libs/documentationFunctions.js'
import databaseFunctions from './libs/databaseFunctions.js'
import dateFunctions from './libs/dateFunctions.js'
import botFunctions from './libs/botFunctions.js'
import mlFunctions from './libs/mlFunctions.js'
import playlistFunctions from './libs/playlistFunctions.js'

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Recommended: send the information to a logging service or write to a log file
});

const commandFunctionsInstance = commandFunctions()
const userFunctionsInstance = userFunctions()
const roomFunctionsInstance = roomFunctions()
const songFunctionsInstance = songFunctions()
const chatFunctionsInstance = chatFunctions()
const videoFunctionsInstance = videoFunctions()
const documentationFunctionsInstance = documentationFunctions()
const databaseFunctionsInstance = databaseFunctions()
const dateFunctionsInstance = dateFunctions()
const botFunctionsInstance = botFunctions()
const mlFunctionsInstance = mlFunctions()
const playlistFunctionsInstance = playlistFunctions()

const roomBot = new Bot( process.env.JOIN_ROOM )
await roomBot.connect( roomFunctionsInstance, userFunctionsInstance, chatFunctionsInstance, songFunctionsInstance, botFunctionsInstance, databaseFunctionsInstance )
roomBot.configureListeners( roomBot.socket, commandFunctionsInstance, userFunctionsInstance, videoFunctionsInstance, botFunctionsInstance, chatFunctionsInstance, roomFunctionsInstance, songFunctionsInstance, databaseFunctionsInstance, documentationFunctionsInstance, dateFunctionsInstance )
const repeatedTasks = new Chain()
repeatedTasks
  // .add( () => roomBot.processNewMessages( commandFunctionsInstance, userFunctionsInstance, videoFunctionsInstance, botFunctionsInstance, chatFunctionsInstance, roomFunctionsInstance, songFunctionsInstance, databaseFunctionsInstance, documentationFunctionsInstance, dateFunctionsInstance, mlFunctionsInstance, playlistFunctionsInstance ) )
  // .every( 100 )
  .add( () => roomBot.processUserMessages( commandFunctionsInstance, userFunctionsInstance, videoFunctionsInstance, botFunctionsInstance, chatFunctionsInstance, roomFunctionsInstance, songFunctionsInstance, databaseFunctionsInstance, documentationFunctionsInstance, dateFunctionsInstance, mlFunctionsInstance, playlistFunctionsInstance ) )
  .every( 100 )

// web pages 'n' stuff!
import express, { query } from 'express';
const app = express();
import path from 'path'
import pug from 'pug'
import bodyParser from 'body-parser'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
dayjs.extend( utc )
import bcrypt from 'bcrypt'
import session from 'express-session'


app.use( session( {
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
} ) );

// serve static files from the images folder
app.use( '/images', express.static( '/home/jodrell/apps/mr_roboto/TTLive-Mr-Roboto2/images' ) );

// client authentication
app.use( ( req, res, next ) => {
  if ( req.originalUrl === '/login' || req.originalUrl === '/signup' || req.originalUrl === '/instructions' || req.originalUrl === '/images' ) {
    return next();
  }
  protectRoute( req, res, next );
} );

app.use( `/scripts`, express.static( './scripts' ) );
app.use( `/modules`, express.static( './node_modules' ) );
app.use( `/styles`, express.static( './styles' ) );
app.use( express.json() );
app.use( bodyParser.urlencoded( { extended: false } ) );

// ########################################################################
// DB Song Editor
// ########################################################################

app.get( '/listunverified', async ( req, res ) => {
  try {
    const sortParam = req.body.sort || req.query.sort || '';
    const whereParam = req.body.where || req.query.where || '';
    const searchParam = req.body.searchTerm || req.query.searchTerm || '';
    const unverifiedParam = req.body.unverifiedonly || req.query.unverifiedonly || '';
    const dbSearchArgs = req.query || req.body;

    const songList = await databaseFunctionsInstance.getUnverifiedSongList( dbSearchArgs );
    const dbStats = await databaseFunctionsInstance.getVerifiedStats();
    const djStatsObject = await databaseFunctionsInstance.getVerificationDJStats();
    const unfixedCount = dbStats[ 'Unfixed' ];
    let availableRoboCoins = songFunctionsInstance.fixTrackPayments() * unfixedCount;
    availableRoboCoins = availableRoboCoins.toFixed( 2 );
    const djStats = Object.entries( djStatsObject ).slice( 0, 7 );

    let html = pug.renderFile( './templates/listUnverifiedSongs.pug', {
      songList,
      sort: sortParam,
      where: whereParam,
      searchTerm: searchParam,
      dbStats,
      djStats,
      availableRoboCoins,
      unverifiedonly: unverifiedParam
    } );
    res.send( html );
  } catch ( error ) {
    console.error( error );
    res.sendStatus( 500 );
  }
} );

app.post( '/updateArtistDisplayName', async ( req, res ) => {
  try {
    const username = req.session.user;

    const videoData_id = req.body.videoData_id;
    const artistDisplayName = req.body.artistDisplayName;
    const sortParam = req.body.sort || req.query.sort || '';
    const whereParam = req.body.where || req.query.where || '';
    const searchParam = req.body.searchTerm || req.query.searchTerm || '';
    const unverifiedParam = req.body.unverifiedonly || req.query.unverifiedonly || '';

    await databaseFunctionsInstance.updateArtistDisplayName( videoData_id, artistDisplayName );

    const userID = await userFunctionsInstance.getUserIDFromUsername( username );
    const numCoins = songFunctionsInstance.fixTrackPayments();
    const changeReason = "Fixed artist name for " + videoData_id;
    const changeID = 5;
    await userFunctionsInstance.addRoboCoins( userID, numCoins, changeReason, changeID, databaseFunctionsInstance );

    const queryParams = new URLSearchParams( { sort: sortParam, where: whereParam, searchTerm: searchParam, unverifiedonly: unverifiedParam } );
    const redirectUrl = '/listunverified?' + queryParams.toString();
    res.redirect( redirectUrl );
  } catch ( error ) {
    console.error( 'Error in updateArtistDisplayName:', error );
    res.status( 500 ).send( 'Internal server error' );
  }
} );
app.post( '/updateTrackDisplayName', async ( req, res ) => {
  try {
    const username = req.session.user;
    const videoData_id = req.body.videoData_id;
    const trackDisplayName = req.body.trackDisplayName;
    const sortParam = req.body.sort || req.query.sort || '';
    const whereParam = req.body.where || req.query.where || '';
    const searchParam = req.body.searchTerm || req.query.searchTerm || '';
    const unverifiedParam = req.body.unverifiedonly || req.query.unverifiedonly || '';

    await databaseFunctionsInstance.updateTrackDisplayName( videoData_id, trackDisplayName );

    const userID = await userFunctionsInstance.getUserIDFromUsername( username );
    const numCoins = songFunctionsInstance.fixTrackPayments();
    const changeReason = "Fixed track name for " + videoData_id;
    const changeID = 5;
    // console.log(`updateTrackDisplayName username:${username}`)
    // console.log(`updateTrackDisplayName userID:${userID}`)
    await userFunctionsInstance.addRoboCoins( userID, numCoins, changeReason, changeID, databaseFunctionsInstance );

    const queryParams = new URLSearchParams( { sort: sortParam, where: whereParam, searchTerm: searchParam, unverifiedonly: unverifiedParam } );
    const redirectUrl = '/listunverified?' + queryParams.toString();
    res.redirect( redirectUrl );
  } catch ( error ) {
    console.error( 'Error in updateArtistDisplayName:', error );
    res.status( 500 ).send( 'Internal server error' );
  }
} );

// ########################################################################
// Top 10 Countdown Data
// ########################################################################

async function getTop10( req, res, functionName, templateFile ) {
  try {
    const { startDate, endDate } = req.query;
    const [ formStartDate, formEndDate, linkStartDate, linkEndDate ] = [
      dateFunctionsInstance.formStartDate( dayjs, startDate ),
      dateFunctionsInstance.formEndDate( dayjs, endDate ),
      dateFunctionsInstance.linkStartDate( dayjs, startDate ),
      dateFunctionsInstance.linkEndDate( dayjs, endDate ),
    ];
    const [ top10SongList, top1080sSongList, top10WednesdaySongList, top10FridaySongList ] = await Promise.all( [
      databaseFunctionsInstance[ functionName ]( dateFunctionsInstance.dbStartDate( dayjs, startDate ), dateFunctionsInstance.dbEndDate( dayjs, endDate ) ),
      databaseFunctionsInstance[ functionName ]( dateFunctionsInstance.dbStartDate( dayjs, startDate ), dateFunctionsInstance.dbEndDate( dayjs, endDate ), [ 0, 1, 2, 3, 5 ] ),
      databaseFunctionsInstance[ functionName ]( dateFunctionsInstance.dbStartDate( dayjs, startDate ), dateFunctionsInstance.dbEndDate( dayjs, endDate ), [ 4 ] ),
      databaseFunctionsInstance[ functionName ]( dateFunctionsInstance.dbStartDate( dayjs, startDate ), dateFunctionsInstance.dbEndDate( dayjs, endDate ), [ 6 ] ),
    ] );
    const html = pug.renderFile( `./templates/${ templateFile }.pug`, {
      top10SongList,
      top1080sSongList,
      top10WednesdaySongList,
      top10FridaySongList,
      formStartDate,
      formEndDate,
      linkStartDate,
      linkEndDate,
    } );
    res.send( html );
  } catch ( error ) {
    console.error( error );
    res.sendStatus( 500 );
  }
}

async function getSummary( req, res, templateFile ) {
  try {
    const { startDate, endDate } = req.query;
    const [ formStartDate, formEndDate, linkStartDate, linkEndDate ] = [
      dateFunctionsInstance.formStartDate( dayjs, startDate ),
      dateFunctionsInstance.formEndDate( dayjs, endDate ),
      dateFunctionsInstance.linkStartDate( dayjs, startDate ),
      dateFunctionsInstance.linkEndDate( dayjs, endDate ),
    ];
    const [ summary, top10DJs ] = await Promise.all( [
      databaseFunctionsInstance.roomSummaryResults( dateFunctionsInstance.dbStartDate( dayjs, startDate ), dateFunctionsInstance.dbEndDate( dayjs, endDate ) ),
      databaseFunctionsInstance.top10DJResults( dateFunctionsInstance.dbStartDate( dayjs, startDate ), dateFunctionsInstance.dbEndDate( dayjs, endDate ) ),
    ] );
    const html = pug.renderFile( `./templates/${ templateFile }.pug`, {
      summary,
      top10DJs,
      formStartDate,
      formEndDate,
      linkStartDate,
      linkEndDate,
    } );
    res.send( html );
  } catch ( error ) {
    console.error( error );
    res.sendStatus( 500 );
  }
}

app.get( '/fulltop10', async ( req, res ) => {
  await getTop10( req, res, "fullTop10Results", "fullTop10" );
} );

app.get( '/likesTop10', async ( req, res ) => {
  await getTop10( req, res, "top10ByLikesResults", "likesTop10" );
} );

app.get( '/mostplayedtracks', async ( req, res ) => {
  await getTop10( req, res, "mostPlayedTracksResults", "mostplayedtracks" );
} );

app.get( '/mostplayedartists', async ( req, res ) => {
  await getTop10( req, res, "mostPlayedArtistsResults", "mostplayedartists" );
} );

app.get( '/summary', async ( req, res ) => {
  await getSummary( req, res, "summary" );
} );


// ########################################################################
// Bot Playlist Editor
// ########################################################################

// all this needs a complete rewrite for the new site

// app.get( '/', function ( req, res ) {
//   bot.playlistAll( ( playlistData ) => {
//     let html = pug.renderFile( './templates/index.pug', { playlistData: playlistData.list } );
//     res.send( html );
//   } );
// } );
//
// app.post( '/songstatus', async function ( req, res ) {
//   let videoStatus = await videoFunctionsInstance.checkVideoStatus( req.body.videoIDs )
//   res.send( videoStatus );
// } );
//
// app.post( '/movesong', ( req, res ) => {
//   bot.playlistReorder( Number.parseInt( req.body.indexFrom ), Number.parseInt( req.body.indexTo ) );
//   res.json( `refresh` );
// } );
//
// app.get( '/findsong', ( req, res ) => {
//   bot.searchSong( req.query.term, ( data ) => {
//     let html = pug.renderFile( './templates/search.pug', { playlistData: data.docs } );
//     res.send( html );
//   } );
// } );
//
// app.get( '/addsong', ( req, res ) => {
//   bot.playlistAdd( req.query.songid );
//   res.json( `refresh` );
// } );
//
// app.get( '/deletesong', ( req, res ) => {
//   bot.playlistRemove( Number.parseInt( req.query.songindex ) );
//   res.json( `refresh` );
// } );

// ########################################################################
// General functions
// ########################################################################

app.get( '/instructions', ( req, res ) => {
  let html = pug.renderFile( './templates/instructions.pug' );
  res.send( html );

} );

app.get( '/signup', ( req, res ) => {
  let html = pug.renderFile( './templates/signup.pug' );
  res.send( html );

} );

app.post( '/signup', async ( req, res, next ) => {
  const { email, username, password, confirmPassword } = req.body;
  const userID = await userFunctionsInstance.getUserIDFromUsername( username );

  try {
    if ( password !== confirmPassword ) {
      return res.status( 400 ).send( 'Passwords do not match' );
    }

    const user = userFunctionsInstance.userExists( userID );
    if ( !user ) {
      return res.status( 400 ).send( 'User does not exist' );
    }
    const verify = await userFunctionsInstance.verifyUsersEmail( userID, email, databaseFunctionsInstance );
    if ( !verify ) {
      return res.status( 400 ).send( "User's email does not match" );
    }

    const passwordHash = await bcrypt.hash( password, 10 );

    const passwordSet = await setPassword( { next, username, passwordHash } );
    if ( !passwordSet ) {
      return res.status( 400 ).send( "Couldn't set the password" );
    }

    res.redirect( '/login' );
  } catch ( error ) {
    console.error( 'Error during signup:', error );
    return res.status( 500 ).send( 'Internal server error' );
  }
} );

function protectRoute( req, res, next ) {
  if ( req.session && req.session.user ) {
    // User is authenticated, proceed to the next middleware
    next();
  } else {
    // User is not authenticated, redirect to the login page
    req.session.originalUrl = req.originalUrl;
    res.redirect( '/login' );
  }
}

app.get( '/login', ( req, res ) => {
  let html = pug.renderFile( './templates/login.pug' );
  res.send( html );

} );

app.post( '/login', async ( req, res ) => {
  const { username, password } = req.body;
  if ( await authentication( username, password ) ) {
    req.session.user = username;
    const redirectTo = req.session.originalUrl || '/listunverified';
    delete req.session.originalUrl;
    res.redirect( redirectTo );
  } else {
    res.redirect( '/signup' );
  }
} );

async function authentication( username, password ) {
  
  try {
    const hashedPassword = await databaseFunctionsInstance.retrieveHashedPassword( encodeURIComponent(username) );
    if ( !hashedPassword ) {
      return false; // User not found
    }

    return await bcrypt.compare( password, hashedPassword ); // Return true if passwords match, false otherwise
  } catch ( error ) {
    console.error( 'Error during authentication:', error );
    throw new Error( 'Internal server error' );
  }
}

async function setPassword( { username, passwordHash } ) {
  try {
    const userID = await userFunctionsInstance.getUserIDFromUsername( username );
    await userFunctionsInstance.storeUserData( userID, "password_hash", passwordHash, databaseFunctionsInstance );
    return true;
  } catch ( error ) {
    console.error( 'Error setting password:', error );
    return false;
  }
}

app.listen( ( 14501 ), () => {
  console.log( "Server is Running" );
} )