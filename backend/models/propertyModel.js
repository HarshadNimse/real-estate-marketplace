const { pool } = require("../config/db");

function getExecutor(executor) {
  return executor || pool;
}

/** Escape %, _, and \\ for safe use in SQL LIKE patterns (with ESCAPE '\\'). */
function escapeLikePattern(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

async function createProperty(payload, executor) {
  const db = getExecutor(executor);
  const query = `
    INSERT INTO properties (
      seller_id, title, slug, description, price, city, address_line,
      latitude, longitude, property_type, bhk, area_sqft, furnishing,
      amenities, status, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 1)
  `;

  const [result] = await db.execute(query, [
    payload.sellerId,
    payload.title,
    payload.slug,
    payload.description,
    payload.price,
    payload.city,
    payload.addressLine,
    payload.latitude,
    payload.longitude,
    payload.propertyType,
    payload.bhk,
    payload.areaSqft,
    payload.furnishing,
    payload.amenitiesJson,
  ]);

  return result.insertId;
}

async function findPropertyById(propertyId, executor) {
  const db = getExecutor(executor);
  const query = `
    SELECT
      p.*,
      u.full_name AS seller_name,
      u.email AS seller_email,
      u.phone AS seller_phone
    FROM properties p
    INNER JOIN users u ON u.id = p.seller_id
    WHERE p.id = ?
    LIMIT 1
  `;
  const [rows] = await db.execute(query, [propertyId]);
  return rows[0] || null;
}

async function findPropertyBySlug(slug, executor) {
  const db = getExecutor(executor);
  const query = `
    SELECT
      p.*,
      u.full_name AS seller_name,
      u.email AS seller_email,
      u.phone AS seller_phone
    FROM properties p
    INNER JOIN users u ON u.id = p.seller_id
    WHERE p.slug = ?
    LIMIT 1
  `;
  const [rows] = await db.execute(query, [slug]);
  return rows[0] || null;
}

async function getExistingSlugs(baseSlug, excludePropertyId, executor) {
  const db = getExecutor(executor);
  const escapedBase = escapeLikePattern(baseSlug);
  const likePattern = `${escapedBase}-%`;
  const params = [baseSlug, likePattern];
  let query = `
    SELECT slug
    FROM properties
    WHERE (slug = ? OR slug LIKE ? ESCAPE '\\\\')
  `;

  if (excludePropertyId) {
    query += " AND id <> ?";
    params.push(excludePropertyId);
  }

  const [rows] = await db.execute(query, params);
  return rows.map((row) => row.slug);
}

async function updatePropertyById(propertyId, payload, options, executor) {
  const db = getExecutor(executor);
  const shouldResetApproval = Boolean(options && options.resetApproval);
  const query = `
    UPDATE properties
    SET
      title = ?,
      slug = ?,
      description = ?,
      price = ?,
      city = ?,
      address_line = ?,
      latitude = ?,
      longitude = ?,
      property_type = ?,
      bhk = ?,
      area_sqft = ?,
      furnishing = ?,
      amenities = ?,
      status = CASE WHEN ? = 1 THEN 'pending' ELSE status END,
      approved_by = CASE WHEN ? = 1 THEN NULL ELSE approved_by END,
      approved_at = CASE WHEN ? = 1 THEN NULL ELSE approved_at END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND deleted_at IS NULL
  `;

  const [result] = await db.execute(query, [
    payload.title,
    payload.slug,
    payload.description,
    payload.price,
    payload.city,
    payload.addressLine,
    payload.latitude,
    payload.longitude,
    payload.propertyType,
    payload.bhk,
    payload.areaSqft,
    payload.furnishing,
    payload.amenitiesJson,
    shouldResetApproval ? 1 : 0,
    shouldResetApproval ? 1 : 0,
    shouldResetApproval ? 1 : 0,
    propertyId,
  ]);
  return result.affectedRows;
}

async function softDeletePropertyById(propertyId, executor) {
  const db = getExecutor(executor);
  const query = `
    UPDATE properties
    SET is_active = 0, deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND deleted_at IS NULL
  `;
  const [result] = await db.execute(query, [propertyId]);
  return result.affectedRows;
}

async function updatePropertyStatus(propertyId, status, adminUserId, executor) {
  const db = getExecutor(executor);
  const query = `
    UPDATE properties
    SET
      status = ?,
      approved_by = CASE WHEN ? = 'approved' THEN ? ELSE NULL END,
      approved_at = CASE WHEN ? = 'approved' THEN CURRENT_TIMESTAMP ELSE NULL END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND deleted_at IS NULL
  `;
  const [result] = await db.execute(query, [
    status,
    status,
    adminUserId,
    status,
    propertyId,
  ]);
  return result.affectedRows;
}

async function listPublicProperties(filters, executor) {
  const db = getExecutor(executor);
  const whereClauses = ["p.status = 'approved'", "p.is_active = 1", "p.deleted_at IS NULL"];
  const params = [];

  if (filters.city) {
    whereClauses.push("(p.city LIKE ? OR p.address_line LIKE ?)");
    const cityPattern = `%${filters.city}%`;
    params.push(cityPattern, cityPattern);
  }
  if (filters.q) {
    whereClauses.push(
      "(MATCH(p.title, p.description) AGAINST (? IN NATURAL LANGUAGE MODE) OR p.title LIKE ? OR p.description LIKE ?)"
    );
    const likePattern = `%${filters.q}%`;
    params.push(filters.q, likePattern, likePattern);
  }
  if (filters.furnishing) {
    whereClauses.push("p.furnishing = ?");
    params.push(filters.furnishing);
  }
  if (typeof filters.minArea === "number") {
    whereClauses.push("p.area_sqft >= ?");
    params.push(filters.minArea);
  }
  if (typeof filters.maxArea === "number") {
    whereClauses.push("p.area_sqft <= ?");
    params.push(filters.maxArea);
  }
  if (filters.propertyType) {
    whereClauses.push("p.property_type = ?");
    params.push(filters.propertyType);
  }
  if (typeof filters.bhk === "number") {
    whereClauses.push("p.bhk = ?");
    params.push(filters.bhk);
  }
  if (typeof filters.minPrice === "number") {
    whereClauses.push("p.price >= ?");
    params.push(filters.minPrice);
  }
  if (typeof filters.maxPrice === "number") {
    whereClauses.push("p.price <= ?");
    params.push(filters.maxPrice);
  }

  const orderBy = filters.sortBy === "price" ? "p.price" : "p.created_at";
  const orderDirection = filters.sortOrder === "asc" ? "ASC" : "DESC";

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM properties p
    WHERE ${whereClauses.join(" AND ")}
  `;
  const [countRows] = await db.execute(countQuery, params);
  const total = Number(countRows[0].total || 0);

  const listQuery = `
    SELECT
      p.id, p.title, p.slug, p.price, p.city, p.address_line,
      p.latitude, p.longitude, p.property_type, p.bhk, p.area_sqft,
      p.furnishing, p.amenities, p.status, p.created_at,
      u.id AS seller_id, u.full_name AS seller_name,
      (
        SELECT pi.image_url
        FROM property_images pi
        WHERE pi.property_id = p.id
        ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
        LIMIT 1
      ) AS primary_image_url
    FROM properties p
    INNER JOIN users u ON u.id = p.seller_id
    WHERE ${whereClauses.join(" AND ")}
    ORDER BY ${orderBy} ${orderDirection}
    LIMIT ${Number(filters.limit)} OFFSET ${Number(filters.offset)}
  `;
  const [rows] = await db.execute(listQuery, params);

  return { rows, total };
}

async function listPropertiesBySellerId(sellerId, pagination = {}, executor) {
  const db = getExecutor(executor);
  const limit = pagination.limit === undefined ? 8 : Number(pagination.limit);
  const offset = pagination.offset === undefined ? 0 : Number(pagination.offset);

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM properties p
    WHERE p.seller_id = ? AND p.deleted_at IS NULL
  `;
  const [countRows] = await db.execute(countQuery, [sellerId]);
  const total = Number(countRows[0].total || 0);

  const query = `
    SELECT
      p.id, p.title, p.slug, p.price, p.city, p.property_type,
      p.bhk, p.status, p.is_active, p.created_at, p.updated_at,
      (
        SELECT pi.image_url
        FROM property_images pi
        WHERE pi.property_id = p.id
        ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
        LIMIT 1
      ) AS primary_image_url
    FROM properties p
    WHERE p.seller_id = ? AND p.deleted_at IS NULL
    ORDER BY p.created_at DESC
    LIMIT ${Number(limit)} OFFSET ${Number(offset)}
  `;
  const [rows] = await db.execute(query, [sellerId]);
  return { rows, total };
}

async function getSellerDashboardStats(sellerId, executor) {
  const db = getExecutor(executor);
  const [propertyRows] = await db.execute(
    `SELECT
       SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS activeListings,
       SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pendingProperties
     FROM properties
     WHERE seller_id = ? AND deleted_at IS NULL`,
    [sellerId]
  );
  const [inquiryRows] = await db.execute(
    `SELECT
       COUNT(*) AS totalInquiries,
       SUM(CASE WHEN i.status <> 'open' THEN 1 ELSE 0 END) AS respondedInquiries
     FROM inquiries i
     INNER JOIN properties p ON p.id = i.property_id
     WHERE i.seller_id = ? AND p.deleted_at IS NULL`,
    [sellerId]
  );

  return {
    activeListings: Number(propertyRows[0].activeListings || 0),
    pendingProperties: Number(propertyRows[0].pendingProperties || 0),
    totalInquiries: Number(inquiryRows[0].totalInquiries || 0),
    respondedInquiries: Number(inquiryRows[0].respondedInquiries || 0),
  };
}

async function listAdminProperties(filters, executor) {
  const db = getExecutor(executor);
  const whereClauses = ["p.deleted_at IS NULL"];
  const params = [];

  if (filters.status) {
    whereClauses.push("p.status = ?");
    params.push(filters.status);
  }

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM properties p
    WHERE ${whereClauses.join(" AND ")}
  `;
  const [countRows] = await db.execute(countQuery, params);
  const total = Number(countRows[0].total || 0);

  const listQuery = `
    SELECT
      p.id, p.title, p.slug, p.price, p.city, p.property_type,
      p.bhk, p.status, p.is_active, p.created_at, p.updated_at,
      u.id AS seller_id, u.full_name AS seller_name, u.email AS seller_email,
      (
        SELECT pi.image_url
        FROM property_images pi
        WHERE pi.property_id = p.id
        ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.id ASC
        LIMIT 1
      ) AS primary_image_url
    FROM properties p
    INNER JOIN users u ON u.id = p.seller_id
    WHERE ${whereClauses.join(" AND ")}
    ORDER BY p.created_at DESC
    LIMIT ${Number(filters.limit)} OFFSET ${Number(filters.offset)}
  `;
  const [rows] = await db.execute(listQuery, params);
  return { rows, total };
}

module.exports = {
  createProperty,
  findPropertyById,
  findPropertyBySlug,
  getExistingSlugs,
  updatePropertyById,
  softDeletePropertyById,
  updatePropertyStatus,
  listPublicProperties,
  listPropertiesBySellerId,
  getSellerDashboardStats,
  listAdminProperties,
};
