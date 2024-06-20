import message from './message.js'
import playedSong from './playedSong.js'
import userJoined from './userJoined.js'
import userLeft from './userLeft.js'
import playedOneTimeAnimation from "./playedOneTimeAnimation.js";
import votedOnSong from "./votedOnSong.js";
import addedDj from "./addedDj.js";

const handlers = {
  message,
  playedSong,
  userJoined,
  userLeft,
  playedOneTimeAnimation,
  votedOnSong,
  addedDj
}

export default handlers;