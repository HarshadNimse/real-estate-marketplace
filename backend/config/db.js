const mysql = require("mysql2/promise");
const env = require("./env");

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit,
  queueLimit: 0,
});

async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    try {
      await connection.ping();
    } finally {
      connection.release();
    }
  } catch (error) {
    const hint =
      error.code === "ECONNREFUSED"
        ? " Is MySQL running? Import database/schema.sql then set DB_* in .env."
        : "";
    throw new Error(`${error.message || "Database connection failed."}${hint}`);
  }
}

module.exports = {
  pool,
  testDbConnection,
};
