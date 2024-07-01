export default async ( userFunctions, databaseFunctions, botFunctions, roomFunctions, songFunctions ) => {
  await userFunctions.clearCurrentDJFlags( databaseFunctions )
  await databaseFunctions.setPlayedLengthForLastTrack()

  if ( botFunctions.autoDJEnabled() === true &&
    userFunctions.vipList().length === 0 &&
    userFunctions.queueList().length === 0 &&
    userFunctions.refreshDJCount() === 0 ) {
    bot.addDj();
  }

  botFunctions.setSkipOn( false );
  botFunctions.clearAllTimers( userFunctions, roomFunctions, songFunctions );

}