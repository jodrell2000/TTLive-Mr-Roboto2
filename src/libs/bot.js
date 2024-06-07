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
        handlers[ payload.name ]( payload, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions, this.socket )
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

        if ( handlers[ payload.name ] ) handlers[ payload.name ]( self.state, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions )
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

    // {"level":"debug","message":"serverMessage - userLeft -------------------------------------------"}
    // {"level":"debug","message":"serverMessage {\"message\":{\"name\":\"userLeft\",\"statePatch\":[{\"op\":\"remove\",\"path\":\"/allUserData/f813b9cc-28c4-4ec6-a9eb-2cdfacbcafbc\"},{\"op\":\"remove\",\"path\":\"/allUsers/3\"},{\"op\":\"remove\",\"path\":\"/audienceUsers/3\"},{\"op\":\"remove\",\"path\":\"/floorUsers/3\"},{\"op\":\"replace\",\"path\":\"/vibeMeter\",\"value\":0.16666666666666666}]},\"room\":\"fc0c1a01-83d6-49ad-9050-4379431a015e\",\"from\":\"0\",\"context\":\"user\",\"sentAt\":1716985062748}"}

    // {"level":"debug","message":"serverMessage - userJoined -------------------------------------------"}
    // {"level":"debug","message":"serverMessage {\"message\":{\"name\":\"userJoined\",\"statePatch\":[{\"op\":\"add\",\"path\":\"/allUserData/f813b9cc-28c4-4ec6-a9eb-2cdfacbcafbc\",\"value\":{\"userProfile\":{\"id\":200,\"color\":\"#F96A2D\",\"avatarId\":\"custom-face-av-1\",\"badges\":[\"JQBX\"],\"createdAt\":\"2021-03-30T22:37:39.558Z\",\"discord\":\"\",\"nickname\":\"Jodrell\",\"discordNickname\":\"\",\"firstName\":\"Adam\",\"lastName\":\"Reynolds\",\"pronoun\":\"He / Him\",\"displayPronouns\":true,\"songOfTheWeek\":\"\",\"song\":{\"id\":\"\",\"isrc\":\"\",\"genre\":\"\",\"duration\":0,\"trackUrl\":\"\",\"trackName\":\"\",\"artistName\":\"\",\"musicProvider\":\"\"},\"coverPicture\":\"\",\"facebook\":\"\",\"instagram\":\"\",\"twitter\":\"\",\"snapchat\":\"\",\"tiktok\":\"\",\"priceForGig\":0,\"zodiac\":\"libra\",\"uuid\":\"f813b9cc-28c4-4ec6-a9eb-2cdfacbcafbc\"},\"position\":{\"x\":84.5,\"y\":15.4},\"songVotes\":{}}},{\"op\":\"add\",\"path\":\"/allUsers/3\",\"value\":{\"uuid\":\"f813b9cc-28c4-4ec6-a9eb-2cdfacbcafbc\",\"tokenRole\":\"user\",\"canDj\":true,\"highestRole\":\"coOwner\"}},{\"op\":\"add\",\"path\":\"/audienceUsers/3\",\"value\":{\"uuid\":\"f813b9cc-28c4-4ec6-a9eb-2cdfacbcafbc\",\"tokenRole\":\"user\",\"canDj\":true,\"highestRole\":\"coOwner\"}},{\"op\":\"add\",\"path\":\"/floorUsers/3\",\"value\":{\"uuid\":\"f813b9cc-28c4-4ec6-a9eb-2cdfacbcafbc\",\"tokenRole\":\"user\",\"canDj\":true,\"highestRole\":\"coOwner\"}},{\"op\":\"replace\",\"path\":\"/vibeMeter\",\"value\":0.14285714285714285}]},\"room\":\"fc0c1a01-83d6-49ad-9050-4379431a015e\",\"from\":\"0\",\"context\":\"user\",\"sentAt\":1716985099733}"}

    this.socket.on( "error", ( message ) => {
      logger.debug( `error --------------------------------------------` )
      logger.debug( `error ${ JSON.stringify( message ) }` )
    } );
  }
}
