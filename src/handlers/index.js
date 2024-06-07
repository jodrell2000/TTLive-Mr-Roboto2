import message from './message.js'
import playedSong from './playedSong.js'
import userJoined from './userJoined.js'
import playedOneTimeAnimation from "./playedOneTimeAnimation.js";
import votedOnSong from "./votedOnSong.js";

const handlers = {
  message,
  playedSong,
  userJoined,
  playedOneTimeAnimation,
  votedOnSong
}

export default handlers;