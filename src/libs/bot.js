import { SocketClient } from 'ttfm-socket'
import fastJson from 'fast-json-patch'

import { joinChat, getMessages } from './cometchat.js'
import { logger } from '../utils/logging.js'
import handlers from '../handlers/index.js'
import startup from '../libs/startup.js'
// import CometChatSDK from "@cometchat/chat-sdk-javascript";
// const { CometChat } = CometChatSDK;
// global.window = {}; // Mock the window object
// import CometChatSDK from "@cometchat-pro/chat";
// const { CometChat } = CometChatSDK;

export class Bot {
  constructor() {
    this.lastMessageIDs = {}
  }

  // ========================================================
  // Connection functions
  // ========================================================

  async connect( roomFunctions, userFunctions, chatFunctions, songFunctions, botFunctions, databaseFunctions ) {
    // Validate required environment variables
    if (!process.env.ROOM_UUID || !process.env.TTL_USER_TOKEN) {
      logger.error('Missing required environment variables: ROOM_UUID and/or TTL_USER_TOKEN')
      return false
    }

    try {

      logger.debug( 'Connecting to room' )
      await joinChat( process.env.ROOM_UUID )

      this.socket = new SocketClient( 'https://socket.prod.tt.fm' )

      const connection = await this.socket.joinRoom( process.env.TTL_USER_TOKEN, {
        roomUuid: process.env.ROOM_UUID
      } )
      this.state = connection.state
      this.isConnected = true
      logger.debug( `Connected to room with state: ${ JSON.stringify( this.state, null, 2 ) }` )

      this.socket.on("disconnect", () => {
        this.isConnected = false
        logger.debug('Disconnected from socket')
      })

      this.socket.on("reconnect", async () => {
        try {
          const { state } = await this.socket.joinRoom( process.env.TTL_USER_TOKEN, {
            roomUuid: process.env.ROOM_UUID
          });
          this.state = state // Use the new state, not the old connection.state
          this.isConnected = true
          logger.debug('Reconnected to socket')
        } catch (error) {
          logger.error(`Reconnection failed: ${error.message}`)
        }
      });

      await startup( process.env.ROOM_UUID, this.state, roomFunctions, userFunctions, chatFunctions, songFunctions, botFunctions, databaseFunctions )

      // Configure listeners after successful connection
      this.configureListeners( this.socket, null, userFunctions, null, botFunctions, chatFunctions, roomFunctions, songFunctions, databaseFunctions, null, null, null, null )
      return true
    } catch (error) {
      this.isConnected = false
      logger.error(`Connection failed: ${error.message}`)
      throw error
    }
  }
  
  async processNewMessages( commandFunctions, userFunctions, videoFunctions, botFunctions, chatFunctions, roomFunctions, songFunctions, databaseFunctions, documentationFunctions, dateFunctions, mlFunctions, playlistFunctions ) {
    const response = await getMessages( process.env.ROOM_UUID, this.lastMessageIDs?.fromTimestamp, this.lastMessageIDs?.id );
    if ( response?.data ) {
      const messages = response.data;
      if ( messages?.length ) {
        for ( const message of messages ) {
          this.lastMessageIDs.fromTimestamp = messages.sentAt + 1;
          this.lastMessageIDs.id = message.id;

          const chatMessage = message?.data?.metadata?.chatMessage?.message ?? '';

          if ( !chatMessage ) return;
          const sender = message?.sender ?? '';
          if ( [ process.env.CHAT_USER_ID, process.env.CHAT_REPLY_ID ].includes( sender ) ) return;
          handlers.message( {
            message: chatMessage,
            sender,
            senderName: messages[ message ]?.data?.chatMessage?.userName
          }, commandFunctions, userFunctions, videoFunctions, botFunctions, chatFunctions, roomFunctions, songFunctions, databaseFunctions, documentationFunctions, dateFunctions, mlFunctions, playlistFunctions, this.socket )
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

  configureListeners( socket, commandFunctions, userFunctions, videoFunctions, botFunctions, chatFunctions, roomFunctions, songFunctions, databaseFunctions, documentationFunctions, dateFunctions, mlFunctions, playlistFunctions ) {
    const self = this
    logger.debug( 'Setting up listeners' )
    
    this.socket.on( 'statefulMessage', async payload => {
      // logger.debug( `statefulMessage - ${ payload.name } -------------------------------------------` )

      try {
        payload.statePatch.forEach( patch => {
          if ( patch.op === 'replace' || patch.op === 'add' ) {
            // logger.debug( `patch: ${ JSON.stringify( patch ) }` )
            this.ensurePathExists( self.state, patch.path );
          }
        } );
        self.state = fastJson.applyPatch( self.state, payload.statePatch ).newDocument;
      } catch ( error ) {
        logger.error( `Error applying patch: ${error.message}` );
        // logger.error( `Payload state patch: ${JSON.stringify( payload.statePatch, null, 2 )}` );
        // logger.error( `Current state: ${JSON.stringify( self.state, null, 2 )}` );
      }


      if  ( ["userJoined", "userLeft", "addedDj", "removedDj"].includes(payload.name) ) {
        await handlers[ payload.name ]( self.state, payload, socket, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions, mlFunctions, playlistFunctions )
      } else  if ( payload.name === "votedOnSong" ) {
        // console.log("Do nothing, handled by serverMessage")
      } else {
        if ( handlers[ payload.name ] ) {
          await handlers[ payload.name ]( self.state, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions, this.socket, mlFunctions, playlistFunctions )
        }
      }
    } )

    this.socket.on( "statelessMessage", ( payload ) => {
      switch ( payload.name ) {
        case "playedOneTimeAnimation":
          // logger.debug( `User ${ payload.params.userUuid } playedOneTimeAnimation` )
          handlers.playedOneTimeAnimation( payload, userFunctions, songFunctions, databaseFunctions )
          break;
        case "kickedFromRoom":
          break;
        default:
          logger.debug( `statelessMessage: ${ payload.name } -------------------------------------------` )
          break;
      }
    } );

    this.socket.on( "serverMessage", ( payload ) => {
      // logger.debug( `serverMessage - ${ payload.message.name } -------------------------------------------` )

      if ( ["votedOnSong"].includes(payload.message.name) ) {
        // logger.debug(payload)
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
            logger.error( `Error applying patch: ${error.message}` );
            // logger.error( `Payload state patch: ${JSON.stringify( payload.statePatch, null, 2 )}` );
            // logger.error( `Current state: ${JSON.stringify( self.state, null, 2 )}` );
          }

          // logger.debug( `serverMessage - ${ payload.message.name } -------------------------------------------` )
          // logger.debug( `serverMessage self.state: ${ JSON.stringify( self.state ) }` )
          // logger.debug( `-------------------------------------------` )
        }
      }
    } );

    this.socket.on( "error", async ( message ) => {
      logger.debug( `error --------------------------------------------` )
      logger.debug( `error ${ message }` )
      switch ( message ) {
        case "Nothing is playing right now.":
          handlers.nothingPlaying( userFunctions, databaseFunctions, botFunctions )
          break;
      }
    } );
  }
}
