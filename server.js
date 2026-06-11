const app = require("./backend/app");
const env = require("./backend/config/env");
const { pool, testDbConnection } = require("./backend/config/db");

async function ensureRefreshTokenMigration() {
  try {
    await pool.execute(
      "ALTER TABLE refresh_tokens ADD COLUMN used_at TIMESTAMP NULL DEFAULT NULL AFTER expires_at"
    );
    console.log("Applied refresh_tokens.used_at migration.");
  } catch (error) {
    if (error.code !== "ER_DUP_FIELDNAME") {
      throw error;
    }
  }
}

async function verifyDatabaseSchema() {
  try {
    await pool.execute("SELECT 1 FROM users LIMIT 1");
  } catch (error) {
    if (error.code === "ER_NO_SUCH_TABLE") {
      throw new Error(
        "Database schema is missing or incomplete. Import database/schema.sql and apply migrations."
      );
    }
    throw error;
  }
}

async function startServer() {
  if (!env.jwt.secret) {
    throw new Error("JWT_SECRET is required in environment variables.");
  }

  await testDbConnection();
  await verifyDatabaseSchema();
  await ensureRefreshTokenMigration();
  console.log("Database connected.");

  app.listen(env.port, () => {
    console.log(`Server is running on port ${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
