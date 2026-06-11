const { pool } = require("../config/db");

async function recordPropertyView(propertyId, userId = null) {
  await pool.execute(
    "INSERT INTO property_views (property_id, user_id) VALUES (?, ?)",
    [propertyId, userId]
  );
}

async function countTotalPropertyViews() {
  const [[row]] = await pool.execute(
    "SELECT COUNT(*) AS totalViews FROM property_views"
  );
  return Number(row.totalViews || 0);
}

module.exports = {
  recordPropertyView,
  countTotalPropertyViews,
};
