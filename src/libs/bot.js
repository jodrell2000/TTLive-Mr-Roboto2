import { ServerMessageName, SocketClient, StatefulServerMessageName, StatelessServerMessageName } from 'ttfm-socket'
import fastJson from 'fast-json-patch'

import { joinChat, getMessages } from './cometchat.js'
import { logger } from '../utils/logging.js'
import handlers from '../handlers/index.js'
import startup from '../libs/startup.js'

export class Bot {
  constructor( slug ) {
    this.lastMessageIDs = {}
  }

  // ========================================================
  // Connection functions
  // ========================================================

  async connect( roomFunctions, userFunctions, chatFunctions, songFunctions, botFunctions, databaseFunctions ) {
    logger.debug( 'Connecting to room' )
    await joinChat( process.env.ROOM_UUID )

    this.socket = new SocketClient( 'https://socket.prod.tt.fm' )

    const connection = await this.socket.joinRoom( process.env.TTL_USER_TOKEN, {
      roomUuid: process.env.ROOM_UUID
    } )
    this.state = connection.state

    await startup( process.env.ROOM_UUID, this.state, roomFunctions, userFunctions, chatFunctions, songFunctions, botFunctions, databaseFunctions )
  }

  // ========================================================

  async processNewMessages( commandFunctions, userFunctions, videoFunctions, botFunctions, chatFunctions, roomFunctions, songFunctions, databaseFunctions, documentationFunctions, dateFunctions ) {
    const response = await getMessages( process.env.ROOM_UUID, this.lastMessageIDs?.fromTimestamp )
    if ( response?.data ) {
      const messages = response.data
      if ( messages?.length ) {
        for ( const message in messages ) {
          this.lastMessageIDs.fromTimestamp = messages[ message ].sentAt + 1
          const customMessage = messages[ message ]?.data?.customData?.message ?? ''
          if ( !customMessage ) return
          const sender = messages[ message ]?.sender ?? ''
          if ( [ process.env.CHAT_USER_ID, process.env.CHAT_REPLY_ID ].includes( sender ) ) return
          handlers.message( {
            message: customMessage,
            sender,
            senderName: messages[ message ]?.data?.customData?.userName
          }, commandFunctions, userFunctions, videoFunctions, botFunctions, chatFunctions, roomFunctions, songFunctions, databaseFunctions, documentationFunctions, dateFunctions )
        }
      }
    }
  }

  ensurePathExists( obj, path ) {
    let keys = path.split( '/' );
    keys.shift(); // Remove the leading empty string from splitting at '/'
    let current = obj;

    for ( let i = 0; i < keys.length; i++ ) {
      if ( !current[ keys[ i ] ] ) {
        current[ keys[ i ] ] = {};
      }
      current = current[ keys[ i ] ];
    }
  }

  configureListeners( commandFunctions, userFunctions, videoFunctions, botFunctions, chatFunctions, roomFunctions, songFunctions, databaseFunctions, documentationFunctions, dateFunctions ) {
    const self = this
    logger.debug( 'Setting up listeners' )

    this.socket.on( 'statefulMessage', async payload => {
      logger.debug( `statefulMessage - ${ payload.name } -------------------------------------------` )

      if ( payload.name.includes ["votedOnSong"] ) {
        console.log("Do nothing, handled by serverMessage")
      } else if  ( payload.name.includes ["userJoined"] ) {
        handlers[ payload.name ]( payload, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions )
      } else {
        try {
          payload.statePatch.forEach( patch => {
            if ( patch.op === 'replace' || patch.op === 'add' ) {
              // logger.debug( `patch: ${ JSON.stringify( patch ) }` )
              this.ensurePathExists( self.state, patch.path );
            }
          } );
          self.state = fastJson.applyPatch( self.state, payload.statePatch ).newDocument;
        } catch ( error ) {
          console.error( 'Error applying patch:', error );
          // console.error( 'Payload state patch:', JSON.stringify( payload.statePatch, null, 2 ) );
          // console.error( 'Current state:', JSON.stringify( self.state, null, 2 ) );
        }

        if ( handlers[ payload.name ] ) handlers[ payload.name ]( self.state, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions, this.socket )
      }
    } )

    this.socket.on( "statelessMessage", ( payload ) => {
      switch ( payload.name ) {
        case "playedOneTimeAnimation":
          logger.debug( `User ${ payload.params.userUuid } playedOneTimeAnimation` )
          handlers.playedOneTimeAnimation( payload, userFunctions )
          break;
        case "kickedFromRoom":
          break;
        default:
          logger.debug( `statelessMessage - default -------------------------------------------` )
          // logger.debug( `statelessMessage: ${ JSON.stringify(message) }` )
          break;
      }
    } );

    this.socket.on( "serverMessage", ( payload ) => {
      if ( payload.message.name.includes [ "votedOnSong"] ) {
        handlers[ payload.message.name ]( payload, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions )
      } else {
        if ( payload.message.statePatch ) {
          try {
            payload.message.statePatch.forEach( patch => {
              if ( patch.op === 'replace' || patch.op === 'add' ) {
                // logger.debug( `patch: ${ JSON.stringify( patch ) }` )
                this.ensurePathExists( self.state, patch.path );
              }
            } );
            self.state = fastJson.applyPatch( self.state, payload.message.statePatch ).newDocument;
          } catch ( error ) {
            console.error( 'Error applying patch:', error );
            // console.error( 'Payload state patch:', JSON.stringify( payload.statePatch, null, 2 ) );
            // console.error( 'Current state:', JSON.stringify( self.state, null, 2 ) );
          }

          logger.debug( `serverMessage - ${ payload.message.name } -------------------------------------------` )
          // logger.debug( `serverMessage self.state: ${ JSON.stringify( self.state ) }` )
          // logger.debug( `-------------------------------------------` )
        }
      }
    } );

    this.socket.on( "error", ( message ) => {
      logger.debug( `error --------------------------------------------` )
      logger.debug( `error ${ JSON.stringify( message ) }` )
    } );
  }
}
