import mysql from 'mysql'

var pool = mysql.createPool( {
  host: 'localhost',
  user: process.env.DBUSERNAME,
  password: process.env.DBPASSWORD,
  database: process.env.DBNAME,
  connectionLimit: 100
} );

export default pool;
