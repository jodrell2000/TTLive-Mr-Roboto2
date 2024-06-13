export default async ( payload, userFunctions, roomFunctions, songFunctions, chatFunctions, botFunctions, videoFunctions, databaseFunctions, documentationFunctions, dateFunctions ) => {
  const userUUID = Object.keys( payload.allUserData )[ 0 ]

  for (const uuid in payload.allUserData) {
    if (payload.allUserData.hasOwnProperty(uuid)) {
      const userData = payload.allUserData[uuid];
      if (userData.songVotes) {
        if (userData.songVotes.like === true) {
          await songFunctions.recordUpVotes(uuid);
        } else if (userData.songVotes.like === false) {
          await songFunctions.recordDownVotes(uuid);
        }
      }
      if (userData.songVotes && userData.songVotes.star === true) {
        await songFunctions.recordSnag(uuid);
      }
    }
  }
}
