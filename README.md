# Mr. Roboto V2
This bot is forked from my bot https://github.com/jodrell2000/DaManagement and was originally written for the 
website turntable.fm

That bot was forked from Mr. Roboto https://github.com/jakewillsmith/roboto, which was in turn forked from chillybot: 
https://github.com/samuri51/chillybot

The bot is being ported over to tt.live

## Getting Started
To run a Bot on tt.live you're going to already need to have your own user created, obviously, and then you'll need 
5 items for your Bot
* an auth-token
* a chat auth-token
* a chat API token
* the Bot's ID
* the Room's ID 

This looks complicated, but it's really not that bad, and you'll only need to do all this once

To get the bot token you'll first need to authenticate using your own token. To get that,
* log into tt.live
* open the developer tools on whichever browser you're using
* find the local cookie storage
* the vaule you need is stored in "token-storage" and looks something like this

  eyJhbGciOiJSUsfdgadfsgsdfgsdfgsdfpXVCJ9. eyJpZCI6MjA0LCJzdWIiOiJmsdfgsdfgsdYi0yY2RmYWNiY2FmYmMiLCJyb2xlIjoidXNlciIsInN1YnNjcmlwdGlvbklkIjoiIiwiY2FwYWJpbGl0aWVzIjpbIsdfgsdfgsdfJ1c2VyIiwiaWF0IjoxNzE1NzkxNDcwLCJleHAiOjIwMzExNTE0NzAsImlzcyI6InR1cm50YWJsZS11c2VyLXNlcnZpY2UifQ.Asdfgsdfgsdfgu4sdfgsdfgsdfgVftqWLMvBNCsJBz2QRmBA1wdG9yXp4-MvjeTK5ojU2Qm3hFH051Znr86lT-OfqH0s1F2GzWuacmAJoRsdfgsdfgsdfgXZboOpDmKN-ceEsksdfgsdfsdfgsdfgsdfYB-gTQUBgzKz_AjhJM7ctmsdfgsdfgsdj_xrb6y71HJPkwZSyDxArJ2q3noUCgF5GKm0l9p8C6MWQ6qkvxAXiXn-ybZzNh7bfs3nJcsdfgsdfgsdfuE4JnrpJm0LFbuR8Ug_v3uXJeDRX7KW6mHfsjHsws6sXqdGH9421KM4tyggE6yPv0Np4jFQsxI_Uf6PISi1aDPxHlttQV4iPuvPXc4g8pS6ATCm1bX-hE3vKa2y8xcIj_cw2F2vsdfgsdfgsdfgsdfg2AKEHBQkMfL_jvmYzp8gD-NZkX_iANwCZ9RukjVpUi9sdfgsdfgsdfgszkbxeacBsHkz7Euv43JkLljM21tIj5NI
* Once you have it visit https://api.prod.tt.fm/api/ and click the green Authorize 
  button at the top of the page
* Paste in your token
* Click Authorize
* Close the box

Now that you're authorized you can create the token to represent your Bot. Note, each tt.live user can only have one Bot
* head to https://api.prod.tt.fm/api/#/Bot%20endpoints/signUpBot (actually just further down the page you're 
  already on)
* Click "Try it out"
* Edit the request body and enter your new Bots name, the avatar you want to use (bot-1 and bot-2 are dedicated bot 
  avatars but you can use any others) and then enter the hex value for whatever colour you want the Bot's chat to 
  appear in
* Click "Execute" below the request body
* You should get a response body with the ID of the new bot, something like 1234567
  * if you get an unauthorized error look to the right of the "POST /users/sign-up-bot" title of the section you're in
  * If the padlock is unlocked, click it and paste in your personal auth-token again to reauthenticate and try again
* next, immediately below /users/sign-up-bot you'll see /users/bot-token
* Click "Try it out"
* Click Execute
* The Response body will contain accessToken and another auth-token, this is your Bots auth-token. Keeps it 
  somewhere safe as you won't be able to access it again or recover it if you lose it

Next you're going to need a chat token so that the Bot can speak!
* head to https://api.prod.tt.fm/api/#/CometChat/getUserCometChatAuthToken
  * if the padlock there is locked, it'll be because you're still logged in, click it and log out
* Click the unlocked padlock, and paste in the auth token for the bot. **NOTE NOT** your personal token
* Click "Try it Out"
* Click "Execute"
* The Response Body will contain the chat token you need

To get the ID for the Bot...
* Go to https://api.prod.tt.fm/api/#/User%20profile/getProfile
* as above, make sure you're authenticated with the Bot's auth-token, not yours
* Click "Try it Out"
* Click "Execute"
* The response body contains the user details for your Bot. At the bottom you'll see "uuid", this si the value you need

To get the Room ID that you want the Bot to connect to...
* Go to https://rooms.prod.tt.fm/api/#/Rooms%20data/getRoom
* You can use either your personal token, or the Bot token here
* Click "Try it Out"
* Enter the slug for your room in the text box
  * The slug is the name of the room in the URL, eg. for https://tt.live/da/i-love-the-80s the slug is i-love-the-80s
* Click "Execute"
* The response body contains A LOT of information about the room, what's playing and the users in it. Scroll down to 
  find the uuid at the root level

Finally, to get the Chat api-token...
*

## Running locally
Clone the source and run `npm install`. In developement you can run use `npm run dev` where the nodemon will automatically reestart your project on any changes.

### Redis
You'll need a loacal instance of redis running. Please use [this guide](https://redis.io/docs/getting-started/).

### Configuring variables
There are a number of variables needed to run this project and connect to the TTL Hangout. For help getting any of 
these values, please connect to the Turntable LIVE discord [here](https://discord.com/channels/812448637425680394/1006608336092938381/1007358948267008052)
```
NODE_ENV=development
LOG_LEVEL=debug

REDIS_HOST=localhost

CHAT_TOKEN=
CHAT_USER_ID=
CHAT_REPLY_ID=
CHAT_API_KEY=
CHAT_AVATAR_ID=
CHAT_NAME=
CHAT_COLOUR=

ROOM_UUID=
TTL_USER_TOKEN=
BARD_COOKIE=
OPENAI_API_KEY=

FAVOURITE_ARTIST=
MERCH_RESPONSE_KEYWORDS=
MERCH_MESSAGE=
MERCH_MESSAGE_RANDOM=
MERCH_MESSAGE_RANDOM_SONG_COUNT=
ANNOUNCE_SONG_DETAILS_COUNT=
```

`CHAT_TOKEN` should be the auth token provided when setting up your commet chat bot.  
`CHAT_USER_ID` & `CHAT_REPLY_ID` are the two IDs that will be associated with your bot via commet chat - these are used to prevent the bot talking to itself.  
`CHAT_API_KEY` is the key to allow connection to the TTL comet chat instance.  
`CHAT_AVATAR_ID` is the avatar that the bot should use within chat - the options availabe can be obtained via request on Discord.  
`CHAT_NAME` is the name your bot should label itself with (also used to respond to mentions).  
`CHAT_COLOUR` is the font colour to use for the bots namke in sent messages.  
`ROOM_UUID` is the UUID for the room you will be accessing (can be obtained from [here](https://rooms.prod.tt.fm/api/#/Rooms%20data/getRoom)).  
`TTL_USER_TOKEN` Is your JWT to access TTL (you can grab this from any netwrok requests made via your browser).  
`BARD_COOKIE` is used for the connection to the Bard API - please see [the package documentation](https://www.npmjs.com/package/bard-ai) to obtain this value.  
`OPENAI_API_KEY` as a fallback to Bard, the service can also use OpenAI. Please create an account and get an access key [here](https://openai.com/).  
`FAVOURITE_ARTIST` is the artist name that will be used to form the bot's personality and to know which songs to respond to automatically.  
`MERCH_RESPONSE_KEYWORDS` this can be a comma separated list of keywords that the bot should respond to with the following;  
`MERCH_MESSAGE` The message to respond when trigger, as above.  
`MERCH_MESSAGE_RANDOM` A random version of the merch message that will trigger on a set number of plays of songs by the favourite artist.  
`MERCH_MESSAGE_RANDOM_SONG_COUNT` How many songs to play before sending the above message.  
`ANNOUNCE_SONG_DETAILS_COUNT` How many songs by the favourite artist should play before telling the user about the current song.

### Testing & Linting
The project uses [standard.js](https://standardjs.com/) for linting and [mocha.js](https://mochajs.org/) for testing with [istanbul / nyc](https://istanbul.js.org/) for coverage reporting.  
These will all run using `npm test`, but you can also take advantadge of standard.js' ability to fix simple errors using `npm run lint:fix`.  
This project also takes advantadge of Github actions to run tests when code is pushed up to a branch.  
**(NOTE: most functionality is not yet covered by tests)**

## Running in production
A `Dockerfile` is included should you wish to containerise to run in production.