const { pool } = require("../config/db");

const LISTABLE_WHERE = `
  p.status = 'approved' AND p.is_active = 1 AND p.deleted_at IS NULL
`;

async function addFavourite(userId, propertyId) {
  const [result] = await pool.execute(
    "INSERT IGNORE INTO favorites (user_id, property_id) VALUES (?, ?)",
    [userId, propertyId]
  );
  return result.affectedRows;
}

async function removeFavourite(userId, propertyId) {
  const [result] = await pool.execute(
    "DELETE FROM favorites WHERE user_id = ? AND property_id = ?",
    [userId, propertyId]
  );
  return result.affectedRows;
}

async function listFavouritesByUser(userId) {
  const [rows] = await pool.execute(
    `SELECT p.id, p.title, p.slug, p.price, p.city, p.property_type, p.bhk, p.status,
            (SELECT pi.image_url FROM property_images pi WHERE pi.property_id = p.id ORDER BY pi.is_primary DESC LIMIT 1) AS primary_image_url
     FROM favorites f
     JOIN properties p ON p.id = f.property_id
     WHERE f.user_id = ? AND ${LISTABLE_WHERE}
     ORDER BY f.created_at DESC`,
    [userId]
  );
  return rows;
}

module.exports = {
  addFavourite,
  removeFavourite,
  listFavouritesByUser,
  LISTABLE_WHERE,
};
