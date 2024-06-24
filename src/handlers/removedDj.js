export default async ( currentState, payload, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions ) => {
  // console.log(`removedDJ payload:${JSON.stringify(payload,null,2)}`)
  for ( const patch of payload.statePatch ) {
    if (patch.path.startsWith('/audienceUsers/') && patch.path.endsWith('/uuid')) {
      const uuid = patch.value;
      await userFunctions.removeDJFromList( uuid, databaseFunctions )
      await userFunctions.removeEscortMeFromUser( uuid, databaseFunctions );
    }
  }
}
