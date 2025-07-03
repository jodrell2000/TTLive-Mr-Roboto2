import { v4 as uuidv4 } from 'uuid'
import { buildUrl, makeRequest } from '../utils/networking.js'
// import { CometChat } from "@cometchat/chat-sdk-javascript";

const startTimeStamp = Math.floor( Date.now() / 1000 )

const headers = {
  appid: process.env.CHAT_API_KEY,
  authtoken: process.env.CHAT_TOKEN,
  dnt: 1,
  origin: 'https://tt.live',
  referer: 'https://tt.live/',
  sdk: 'javascript@3.0.10'
}

export const joinChat = async ( roomId ) => {
  headers.appid = process.env.CHAT_API_KEY
  const paths = [
    'v3.0',
    'groups',
    roomId,
    'members'
  ]

  const url = buildUrl( `${ process.env.CHAT_API_KEY }.apiclient-us.cometchat.io`, paths )
  const response = await makeRequest( url, { headers, method: 'POST' } )
  return response
}


export const getMessages = async ( roomId, fromTimestamp = startTimeStamp, lastID ) => {
  headers.appid = process.env.CHAT_API_KEY
  headers.onBehalfOf = process.env.USERID

  const messageLimit = 50
  const paths = [
    'v3.0',
    'groups',
    roomId,
    'messages'
  ]
  const searchParams = [
    [ 'per_page', messageLimit ],
    [ 'hideMessagesFromBlockedUsers', 0 ],
    [ 'unread', 0 ],
    [ 'undelivered', 1 ],
    [ 'withTags', 0 ],
    [ 'hideDeleted', 0 ],
    // [ 'sentAt', fromTimestamp ],
    [ 'affix', 'append' ],
    [ 'id', lastID ]
  ]
  const url = buildUrl( `${ process.env.CHAT_API_KEY }.apiclient-us.cometchat.io`, paths, searchParams )
  // console.log(`url: ${JSON.stringify(url, null, 2)}`)

  try {
    // console.log(`Sending message request`)
    const messageResponse = await makeRequest( url, { headers } )

    // console.log("✅ messageResponse:", JSON.stringify(messageResponse, null, 2));

    return messageResponse;

  } catch (error) {
    console.error("❌ Error in makeRequest:", JSON.stringify(error, null, 2));
    return {
      error: error.message || "Unknown error",
    };
  }

}

export const getUserMessages = async ( userFunctions, fromTimestamp = startTimeStamp ) => {
  userFunctions.theUsersList().forEach(user => {
    if (user.id) {
      console.log( "User ID: " + user.id)
    }
  })
  headers.appid = process.env.CHAT_API_KEY
  headers.onBehalfOf = process.env.USERID

  const messageLimit = 50
  const paths = [
    'v3.0',
    'users',
    userId,
    'messages'
  ]
  const searchParams = [
    [ 'per_page', messageLimit ],
    [ 'hideMessagesFromBlockedUsers', 0 ],
    [ 'unread', 0 ],
    [ 'withTags', 0 ],
    [ 'hideDeleted', 0 ],
    [ 'sentAt', fromTimestamp ],
    [ 'affix', 'append' ]
  ]
  const url = buildUrl( `${ process.env.CHAT_API_KEY }.apiclient-us.cometchat.io`, paths, searchParams )

  try {
    const messageResponse = await makeRequest( url, { headers } )

    // console.log("✅ messageResponse:", JSON.stringify(messageResponse, null, 2));

    return messageResponse;

  } catch (error) {
    console.error("❌ Error in makeRequest:", JSON.stringify(error, null, 2));
    return {
      error: error.message || "Unknown error",
    };
  }
}

export const postMessage = async ( options ) => {
  headers.appid = process.env.CHAT_API_KEY
  headers.onBehalfOf = process.env.USERID
  
  const paths = [
    'v3.0',
    'messages'
  ]

  const customData = {
    message: options.message || '',
    avatarId: process.env.CHAT_AVATAR_ID,
    userName: process.env.CHAT_NAME,
    color: `#${ process.env.CHAT_COLOUR }`,
    mentions: [],
    userUuid: process.env.CHAT_USER_ID,
    badges: [ 'VERIFIED', 'STAFF' ],
    id: uuidv4()
  }
  if ( options.images ) customData.imageUrls = options.images

  if ( options.mentions ) {
    customData.mentions = options.mentions.map( mention => {
      return {
        start: mention.position,
        userNickname: mention.nickname,
        userUuid: mention.userId
      }
    } )
  }

  const payload = {
    type: 'text',
    receiverType: 'group',
    category: 'message',
    data: {
      text: options.message,
      metadata: {
        chatMessage: customData
      }
    },
    receiver: options.room
  }
  // console.log( JSON.stringify(payload,  null, 2) )
  const url = buildUrl( `${ process.env.CHAT_API_KEY }.apiclient-us.cometchat.io`, paths )
  // console.log(`url: ${url}`)
  // console.log(`headers: ${JSON.stringify(headers, null, 2)}`)
  // console.log(`payload: ${JSON.stringify(payload, null, 2)}`)

  try {
    const messageResponse = await makeRequest(
      url,
      { method: 'POST', body: JSON.stringify(payload) },
      headers
    );

    // console.log("✅ messageResponse:", JSON.stringify(messageResponse, null, 2));

    return {
      message: options.message,
      messageResponse
    };

  } catch (error) {
    // console.error("❌ Error in makeRequest:", JSON.stringify(error, null, 2));
    return {
      message: options.message,
      error: error.message || "Unknown error",
    };
  }
}

// let listenerID = process.env.CHAT_USER_ID;
//
// CometChat.addMessageListener(
//   listenerID,
//   new CometChat.MessageListener({
//     onTextMessageReceived: (textMessage) => {
//       console.log("Text message received successfully", textMessage);
//     },
//     // onMediaMessageReceived: (mediaMessage) => {
//     //   console.log("Media message received successfully", mediaMessage);
//     // },
//     onCustomMessageReceived: (customMessage) => {
//       console.log("Custom message received successfully", customMessage);
//     },
//   })
// );
//
// const receiverID = process.env.CHAT_USER_ID;
// const messageText = "Hello from the bot!"
// const receiverType = CometChat.RECEIVER_TYPE.GROUP
//
// const textMessage = new CometChat.TextMessage(
//   receiverID,
//   messageText,
//   receiverType
// )
//
// // The old customData is attached as the TextMessage metadata
// textMessage.setMetadata(customMessage);
//
// CometChat.sendMessage(textMessage).then((message) => {
//   console.log("Message sent", message)
// })