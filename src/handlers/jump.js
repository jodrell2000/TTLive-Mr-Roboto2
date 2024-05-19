import { postMessage } from '../libs/cometchat.js'
import axios from 'axios'
import { logger } from '../utils/logging.js'

export default async ( userID, room ) => {
  const url = `https://api.prod.tt.fm/users/profiles?users=${userID}`;
  const headers = {
    'accept': 'application/json',
    'Authorization': `Bearer ${process.env.TT_LIVE_AUTHTOKEN}`
  };

  try {
    const response = await axios.get(url, { headers });
    const userProfile = response.data[0]?.userProfile;

    if (userProfile && userProfile.nickname) {
      const message = `${userProfile.nickname} jumped`
      return await postMessage({
        room,
        message: message
      })
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}
