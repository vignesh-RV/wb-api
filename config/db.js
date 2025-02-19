const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: false
    }
  });
  
  db.connect()
    .then(() => console.log('Connected to PostgreSQL Database'))
    .catch(err => console.error('Database connection error', err.stack));

    
module.exports = { db };