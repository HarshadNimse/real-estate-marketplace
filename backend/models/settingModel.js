const { pool } = require("../config/db");

async function getSetting(key) {
  const [rows] = await pool.execute(
    "SELECT setting_value FROM admin_settings WHERE setting_key = ?",
    [key]
  );
  return rows[0] ? rows[0].setting_value : null;
}

async function updateSetting(key, value) {
  await pool.execute(
    `INSERT INTO admin_settings (setting_key, setting_value)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()`,
    [key, value, value]
  );
}

module.exports = {
  getSetting,
  updateSetting,
};
