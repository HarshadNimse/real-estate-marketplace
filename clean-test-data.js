const mysql = require("mysql2/promise");
const env = require("./backend/config/env");

async function cleanTestData() {
  const connection = await mysql.createConnection({
    host: env.db.host,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
  });

  try {
    console.log("🧹 Cleaning test data from database...\n");

    // Delete smoke test properties
    const result1 = await connection.execute(
      "DELETE FROM properties WHERE title LIKE ? OR title LIKE ?",
      ["Smoke Test Property%", "Smoke Seller%"]
    );
    console.log(`✅ Deleted ${result1[0].affectedRows} smoke test properties`);

    // Delete smoke test inquiries
    const result2 = await connection.execute(
      "DELETE FROM inquiries WHERE message = ?",
      ["I'm interested"]
    );
    console.log(`✅ Deleted ${result2[0].affectedRows} smoke test inquiries`);

    // Delete smoke test users (optional - be careful)
    const result3 = await connection.execute(
      "DELETE FROM users WHERE full_name LIKE ? OR email LIKE ?",
      ["Smoke%", "smoke%"]
    );
    console.log(`✅ Deleted ${result3[0].affectedRows} smoke test users`);

    console.log("\n✅ Database cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Error cleaning database:", error.message);
  } finally {
    await connection.end();
  }
}

cleanTestData();
