const { Pool } = require("pg")
require("dotenv").config()

/* ***************
 * Connection Pool
 * Sets up SSL/TLS encryption for secure connection.
 * It uses SSL in all environments (production and development) 
 * when connecting to an external database like Render's PostgreSQL.
 * *************** */

let pool;

// Determine if running locally (development) or on Render (production)
const isProduction = process.env.NODE_ENV === "production";

// Configuration object includes the connection string and SSL settings
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  // Use SSL for all environments where an external database is used.
  // rejectUnauthorized: false is often required because Render's DB
  // uses a self-signed or non-standard certificate.
  ssl: isProduction 
    ? { rejectUnauthorized: false } 
    // In development, we still need SSL if connecting to an external DB
    : { rejectUnauthorized: false }, 
};

pool = new Pool(dbConfig);


// If in development mode, export a wrapper function 
// for query logging/troubleshooting
if (!isProduction) {
  module.exports = {
    async query(text, params) {
      try {
        const res = await pool.query(text, params)
        console.log("executed query", { text })
        return res
      } catch (error) {
        console.error("error in query", { text })
        throw error
      }
    },
  }
} else {
  // In production (on Render), export the pool directly
  module.exports = pool
}