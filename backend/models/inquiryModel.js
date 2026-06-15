const { pool } = require("../config/db");

function getExecutor(executor) {
  return executor || pool;
}

async function createInquiry(payload, executor) {
  const db = getExecutor(executor);
  const query = `
    INSERT INTO inquiries (
      property_id, buyer_id, seller_id, message, contact_phone, status
    ) VALUES (?, ?, ?, ?, ?, 'open')
  `;
  const [result] = await db.execute(query, [
    payload.propertyId,
    payload.buyerId,
    payload.sellerId,
    payload.message,
    payload.contactPhone,
  ]);
  return result.insertId;
}

async function findInquiryById(inquiryId, executor) {
  const db = getExecutor(executor);
  const query = `
    SELECT id, property_id, buyer_id, seller_id, message, contact_phone, status, last_message_at, created_at, updated_at
    FROM inquiries
    WHERE id = ?
    LIMIT 1
  `;
  const [rows] = await db.execute(query, [inquiryId]);
  return rows[0] || null;
}

async function findActiveInquiryByBuyerAndProperty(buyerId, propertyId, executor) {
  const db = getExecutor(executor);
  const query = `
    SELECT id, status
    FROM inquiries
    WHERE buyer_id = ? AND property_id = ? AND status IN ('open', 'responded')
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const [rows] = await db.execute(query, [buyerId, propertyId]);
  return rows[0] || null;
}

async function updateInquiryStatus(inquiryId, status, executor) {
  const db = getExecutor(executor);
  const query = `
    UPDATE inquiries
    SET status = ?, last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  const [result] = await db.execute(query, [status, inquiryId]);
  return result.affectedRows;
}

async function getSellerInbox(sellerId, pagination, executor) {
  const db = getExecutor(executor);
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM inquiries i
    INNER JOIN properties p ON p.id = i.property_id
    WHERE i.seller_id = ? AND p.deleted_at IS NULL
  `;
  const [countRows] = await db.execute(countQuery, [sellerId]);
  const total = Number(countRows[0].total || 0);

  const query = `
    SELECT
      i.id,
      i.property_id,
      i.buyer_id,
      i.seller_id,
      i.message,
      i.contact_phone,
      i.status,
      i.created_at,
      i.updated_at,
      p.title AS property_title,
      p.slug AS property_slug,
      p.city AS property_city,
      p.price AS property_price,
      b.full_name AS buyer_name,
      b.email AS buyer_email,
      b.phone AS buyer_phone
    FROM inquiries i
    INNER JOIN properties p ON p.id = i.property_id
    INNER JOIN users b ON b.id = i.buyer_id
    WHERE i.seller_id = ? AND p.deleted_at IS NULL
    ORDER BY i.created_at DESC
    LIMIT ${pagination.limit} OFFSET ${pagination.offset}
  `;
  const [rows] = await db.execute(query, [sellerId]);
  return { rows, total };
}

async function getBuyerHistory(buyerId, pagination, executor) {
  const db = getExecutor(executor);
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM inquiries i
    INNER JOIN properties p ON p.id = i.property_id
    WHERE i.buyer_id = ? AND p.deleted_at IS NULL
  `;
  const [countRows] = await db.execute(countQuery, [buyerId]);
  const total = Number(countRows[0].total || 0);

  const query = `
    SELECT
      i.id,
      i.property_id,
      i.buyer_id,
      i.seller_id,
      i.message,
      i.contact_phone,
      i.status,
      i.created_at,
      i.updated_at,
      p.title AS property_title,
      p.slug AS property_slug,
      p.city AS property_city,
      p.price AS property_price,
      s.full_name AS seller_name,
      s.email AS seller_email,
      s.phone AS seller_phone
    FROM inquiries i
    INNER JOIN properties p ON p.id = i.property_id
    INNER JOIN users s ON s.id = i.seller_id
    WHERE i.buyer_id = ? AND p.deleted_at IS NULL
    ORDER BY i.created_at DESC
    LIMIT ${pagination.limit} OFFSET ${pagination.offset}
  `;
  const [rows] = await db.execute(query, [buyerId]);
  return { rows, total };
}

async function createMessage(inquiryId, senderId, message, executor) {
  const db = getExecutor(executor);
  const [result] = await db.execute(
    "INSERT INTO inquiry_messages (inquiry_id, sender_id, message) VALUES (?, ?, ?)",
    [inquiryId, senderId, message]
  );
  return result.insertId;
}

async function getMessages(inquiryId, executor) {
  const db = getExecutor(executor);
  const [rows] = await db.execute(
    `SELECT im.id, im.inquiry_id, im.sender_id, im.message, im.created_at, u.full_name as sender_name
     FROM inquiry_messages im
     INNER JOIN users u ON im.sender_id = u.id
     WHERE im.inquiry_id = ?
     ORDER BY im.created_at ASC`,
    [inquiryId]
  );
  return rows;
}

async function updateInquiryLastMessageAt(inquiryId, executor) {
  const db = getExecutor(executor);
  await db.execute(
    "UPDATE inquiries SET last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [inquiryId]
  );
}

module.exports = {
  createInquiry,
  findInquiryById,
  findActiveInquiryByBuyerAndProperty,
  updateInquiryStatus,
  getSellerInbox,
  getBuyerHistory,
  createMessage,
  getMessages,
  updateInquiryLastMessageAt,
};
