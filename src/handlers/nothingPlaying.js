export default async ( userFunctions, databaseFunctions ) => {
  await userFunctions.clearCurrentDJFlags( databaseFunctions )
  await databaseFunctions.setPlayedLengthForLastTrack()
}





