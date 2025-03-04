import request from 'request';
import { setIntersection, setDifference } from './setlib.js';
import countryLookup from 'country-code-lookup';

import musicDefaults from '../defaults/musicDefaults.js'

let regionsWeCareAbout = new Set( musicDefaults.alertRegions );

const videoFunctions = () => {
  async function alertIfRegionsNotAllowed( restrictions, userFunctions, notifier ) {
    const missingRegions = setDifference( regionsWeCareAbout, restrictions.allowed || [] );
    if ( missingRegions.length ) {
      notifier( `Sorry @${ await userFunctions.getUsername( await userFunctions.getCurrentDJID() ) }, this video can't be played in ${ turnCodesIntoCountries( missingRegions ) }. Please consider skipping.` );
    }
  }

  async function alertIfRegionsBlocked( restrictions, userFunctions, notifier ) {
    const blockedRegions = setIntersection( regionsWeCareAbout, restrictions.blocked || [] );
    if ( blockedRegions.length ) {
      notifier( `Sorry @${ await userFunctions.getUsername( await userFunctions.getCurrentDJID() ) }, this video can't be played in ${ turnCodesIntoCountries( blockedRegions ) }. Please consider skipping.` );
    }
  }

  function fetchVideoDetails( videoID, callback ) {
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ videoID }&key=${ process.env.YOUTUBE_API_KEY }`;
    request( apiUrl, { json: true }, ( error, response, body ) => {
      if ( error ) {
        console.error( `Error occurred in videoFunctions.fetchVideoDetails(): ${ error }` );
        callback( error );
        return;
      }
      callback( null, body );
    } );
  }

  function processVideoDetails( data, body, userFunctions, chatFunctions ) {
    const restrictions = body.items[ 0 ]?.contentDetails?.regionRestriction;

    if ( !restrictions ) {
      return;
    }

    if ( 'allowed' in restrictions ) {
      if ( restrictions.allowed ) {
        alertIfRegionsNotAllowed( restrictions, userFunctions, ( msg ) =>
          chatFunctions.botSpeak( msg )
        );
      }
    } else if ( 'blocked' in restrictions ) {
      if ( restrictions.blocked ) {
        alertIfRegionsBlocked( restrictions, userFunctions, ( msg ) =>
          chatFunctions.botSpeak( msg )
        );
      }
    }
  }

  function turnCodesIntoCountries( regionCodes ) {
    let countriesString = '';

    for ( let regionLoop = 0; regionLoop < regionCodes.length; regionLoop++ ) {
      countriesString += countryLookup.byIso( regionCodes[ regionLoop ] ).country + ', ';
    }

    countriesString = countriesString.substring( 0, countriesString.length - 2 );
    const lastComma = countriesString.lastIndexOf( ',' );
    if ( lastComma !== -1 ) {
      countriesString = countriesString.substring( 0, lastComma ) + ' and' + countriesString.substring( lastComma + 1 )
    }

    if ( countriesString.length === 0 ) {
      return "empty";
    } else {
      return countriesString;
    }
  }

  return {
    checkVideoRegionAlert: function ( data, videoID, userFunctions, chatFunctions, botFunctions ) {
      if ( botFunctions.checkVideoRegions() ) {
        fetchVideoDetails( videoID, ( error, body ) => {
          if ( !error ) {
            processVideoDetails( data, body, userFunctions, chatFunctions );
          }
        } );
      }
    },

    listAlertRegions: function ( data, chatFunctions ) {
      const regionsAsArray = Array.from( regionsWeCareAbout );
      let regionReport = `The list of regions that will cause a blocked alert is currently ` + turnCodesIntoCountries( regionsAsArray );

      chatFunctions.botSpeak( regionReport );
    },

    checkVideoStatus: function ( videoIDs ) {
      return new Promise( ( resolve, reject ) => {
        let youtubeURL = `https://www.googleapis.com/youtube/v3/videos?id=${ videoIDs }&part=status&key=${ process.env.YOUTUBE_API_KEY }`;

        request( youtubeURL, { json: true }, ( error, res, body ) => {
          console.log( "body:" + JSON.stringify( body ) );
          if ( error ) {
            reject( `Error making request: ${ error }` );
            return;
          }

          if ( res.statusCode !== 200 ) {
            reject( `HTTP error: ${ res.statusCode }` );
            return;
          }

          if ( !body.hasOwnProperty( 'items' ) || !Array.isArray( body.items ) || !body.items.length ) {
            reject( `No data returned from YouTube API` );
            return;
          }

          resolve( body.items );
        } );
      } );
    },

    addAlertRegion: function ( data, region, chatFunctions, announce = true ) {
      let message;
      let theRegion = region.toUpperCase();

      if ( countryLookup.byIso( theRegion ) !== null ) {
        if ( regionsWeCareAbout.has( theRegion ) ) {
          message = countryLookup.byIso( theRegion ).country + ' is already in the region alerts list';
        } else {
          regionsWeCareAbout.add( theRegion );
          message = countryLookup.byIso( theRegion ).country + ' has been added to the region alerts list';
        }
        if ( announce === true ) {
          chatFunctions.botSpeak( message );
        }
      } else {
        if ( announce === true ) {
          chatFunctions.botSpeak( 'That region is not recognised. Please use one of the 2 character ISO country codes, https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2' );
        }
      }
    },

    removeAlertRegion: function ( data, region, chatFunctions, announce = true ) {
      let message;
      let theRegion = region.toUpperCase();

      if ( regionsWeCareAbout.delete( theRegion ) ) {
        message = countryLookup.byIso( theRegion ).country + ' has been removed from the region alerts list';
      } else {
        message = countryLookup.byIso( theRegion ).country + ' is not in the region alerts list';
      }
      if ( announce === true ) {
        chatFunctions.botSpeak( message );
      }
    },

    resetAlertRegions: function () {
      regionsWeCareAbout = new Set( musicDefaults.alertRegions );
    },

    // this is pretty horrible, but nothing in here is easy to test
    test_alertIfRegionsNotAllowed: alertIfRegionsNotAllowed,
    test_alertIfRegionsBlocked: alertIfRegionsBlocked,
  };
};

export default videoFunctions;
