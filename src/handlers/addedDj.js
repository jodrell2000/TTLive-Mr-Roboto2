export default async ( currentState, payload, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions ) => {
  for ( const patch of payload.statePatch ) {
    if (patch.path.startsWith('/djs/')) {
      const uuid = patch.value.uuid;
      await userFunctions.updateUserJoinedStage( uuid, databaseFunctions );
      await userFunctions.addDJToList( uuid )
    }
  }
}
