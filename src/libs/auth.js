// configured using environment variables in a .env file
// copy the .env.example file to .env and fill out the details for your Bot user
import dotenv from 'dotenv';

export default {
  AUTH: process.env.AUTH,
  USERID: process.env.USERID,
  ROOMID: process.env.ROOMID
}