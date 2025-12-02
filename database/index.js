const { Pool } = require("pg");
require("dotenv").config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not defined!");
  process.exit(1);
}

const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
};

const pool = new Pool(dbConfig);

if (process.env.NODE_ENV !== "production") {
  const origQuery = pool.query.bind(pool);
  pool.query = async (text, params) => {
    console.log("executing query:", text);
    return origQuery(text, params);
  };
}

module.exports = pool;
