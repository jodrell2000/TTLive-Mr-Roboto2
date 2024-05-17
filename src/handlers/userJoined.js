import { postMessage } from '../libs/cometchat.js'

export default async ( payload, room ) => {
  if ( !payload.userUuid ) return
  if ( [ process.env.CHAT_USER_ID, process.env.CHAT_REPLY_ID ].includes( payload.userUuid ) ) return
  await postMessage( {
    room,
    message: `Welcome @${ payload.nickname }`,
    mentions: [ {
      position: 8,
      nickname: payload.nickname,
      userId: payload.userUuid
    } ]
  } )
}
