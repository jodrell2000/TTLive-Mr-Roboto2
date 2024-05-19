import mysql from 'mysql'

const pool = mysql.createPool( {
  host: 'localhost',
  user: process.env.DBUSERNAME,
  password: process.env.DBPASSWORD,
  database: process.env.DBNAME,
  connectionLimit: 100
} );

export default pool;
