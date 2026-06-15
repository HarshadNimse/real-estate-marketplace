const app = require("./backend/app");
const env = require("./backend/config/env");
const { testDbConnection } = require("./backend/config/db");

async function startServer() {
  if (!env.jwt.secret) {
    throw new Error("JWT_SECRET is required in environment variables.");
  }

  await testDbConnection();
  console.log("Database connected.");

  app.listen(env.port, () => {
    console.log(`Server is running on port ${env.port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
