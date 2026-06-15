const { pool } = require("../config/db");

function getExecutor(executor) {
  return executor || pool;
}

async function createPropertyImages(propertyId, images, executor) {
  if (!images.length) return;
  const db = getExecutor(executor);
  const normalizedImages = images.map((image, index) => ({
    ...image,
    isPrimary: index === 0,
  }));

  const query = `
    INSERT INTO property_images
    (property_id, image_url, cloudinary_public_id, is_primary, sort_order)
    VALUES ?
  `;
  const normalizedValues = normalizedImages.map((image, index) => [
    propertyId,
    image.imageUrl,
    image.publicId,
    image.isPrimary ? 1 : 0,
    index,
  ]);
  await db.query(query, [normalizedValues]);
}

async function replacePropertyImages(propertyId, images, executor) {
  const db = getExecutor(executor);
  await db.execute("DELETE FROM property_images WHERE property_id = ?", [propertyId]);
  if (images.length) {
    await createPropertyImages(propertyId, images, db);
  }
}

async function getPropertyImages(propertyId, executor) {
  const db = getExecutor(executor);
  const query = `
    SELECT id, image_url, cloudinary_public_id, is_primary, sort_order
    FROM property_images
    WHERE property_id = ?
    ORDER BY is_primary DESC, sort_order ASC, id ASC
  `;
  const [rows] = await db.execute(query, [propertyId]);
  return rows;
}

async function getPropertyPublicIds(propertyId, executor) {
  const db = getExecutor(executor);
  const [rows] = await db.execute(
    "SELECT cloudinary_public_id FROM property_images WHERE property_id = ?",
    [propertyId]
  );
  return rows.map((r) => r.cloudinary_public_id).filter(Boolean);
}

module.exports = {
  createPropertyImages,
  replacePropertyImages,
  getPropertyImages,
  getPropertyPublicIds,
};
