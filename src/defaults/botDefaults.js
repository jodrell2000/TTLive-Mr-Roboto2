export default {
  howManyVotes: 10, //how many awesome's for a song to be automatically added to the bot's playlist(only works when autoSnag = true;)

  //this is for the bot's autodjing(triggers on new song, bot also gets on when no song is playing, unless autodjing is turned off)
  autoDJEnabled: false, //autodjing(on by default)
  whenToGetOnStage: 1, //with this many or fewer people djing the bot will get on stage(only if autodjing is enabled)
  whenToGetOffStage: 3, //when this many people are on stage and auto djing is enabled the bot will get off
  // stage(note: the bot counts as one person)

  autoBop: true, //choose whether the bot will autobop for each song or not(against the rules but I leave it up to
  // you) 
  autoSnag: false, //auto song adding(different from every song adding), tied to  botDefaultsModule.howManyVotes up above, (off by default)
  feart: true,

  botPlaylist: null, //the playlist for the bot
  roomUuid: process.env.ROOM_UUID,
  botUuid: process.env.USERID,
  
  headers: {
    'accept': 'application/json',
    'Authorization': `Bearer ${process.env.TTL_USER_TOKEN}`
  }
}
