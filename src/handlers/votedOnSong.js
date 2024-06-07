import { logger } from '../utils/logging.js'

export default async ( payload, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions ) => {
  console.log( `message.js payload.allUserData: ${ JSON.stringify( payload.allUserData, null, 2 ) }` )

  const userUUID = Object.keys( payload.allUserData )[ 0 ]
  console.log(`userUUID: ${ userUUID }`)

  if ( payload.allUserData[ userUUID ].songVotes ) {
    if ( payload.allUserData[ userUUID ].songVotes.star ) {
      console.log(`record snag`)
      await songFunctions.recordSnag( userUUID )
    } else if ( payload.allUserData[ userUUID ].songVotes.like === true) {
      console.log(`record up vote`)
      await songFunctions.recordUpVotes( userUUID )
    } else {
      console.log(`record down vote`)
      await songFunctions.recordDownVotes( userUUID )
    }
  }

  console.log(`upVotes: ${ songFunctions.upVotes() }`)
  console.log(`downVotes: ${ songFunctions.downVotes() }`)
  console.log(`snags: ${ songFunctions.snagCount() }`)
}
