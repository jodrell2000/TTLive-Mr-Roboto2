export default async ( currentState, payload, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions ) => {
  for ( const patch of payload.statePatch ) {
    if (patch.path.startsWith('/djs/')) {
      // djOrder = parseInt(patch.path.split('/')[2]);
      // Extract the uuid
      const uuid = patch.value.uuid;
      await userFunctions.updateUserJoinedStage( uuid, databaseFunctions );
    }
  }

}
