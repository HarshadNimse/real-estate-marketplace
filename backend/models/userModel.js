const { pool } = require("../config/db");

async function findUserByEmail(email) {
  const query = `
    SELECT id, full_name, email, phone, password_hash, role, is_active, email_verified
    FROM users
    WHERE email = ?
    LIMIT 1
  `;
  const [rows] = await pool.execute(query, [email]);
  return rows[0] || null;
}

async function findUserById(id) {
  const query = `
    SELECT id, full_name, email, phone, role, is_active, email_verified, phone_verified,
           created_at, updated_at
    FROM users
    WHERE id = ?
    LIMIT 1
  `;
  const [rows] = await pool.execute(query, [id]);
  return rows[0] || null;
}

async function createUser({ fullName, email, phone, passwordHash, role }) {
  const query = `
    INSERT INTO users (full_name, email, phone, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `;
  const [result] = await pool.execute(query, [
    fullName,
    email,
    phone || null,
    passwordHash,
    role,
  ]);
  return findUserById(result.insertId);
}

async function updateLastLoginAt(userId) {
  const query = `
    UPDATE users
    SET last_login_at = CURRENT_TIMESTAMP
    WHERE id = ?
    LIMIT 1
  `;
  await pool.execute(query, [userId]);
}

async function updateUser(userId, { fullName, phone }) {
  const query = `
    UPDATE users
    SET full_name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  await pool.execute(query, [fullName || null, phone || null, userId]);
  return findUserById(userId);
}

async function updateUserPassword(userId, passwordHash) {
  await pool.execute(
    "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [passwordHash, userId]
  );
}

async function setEmailVerified(userId, verified = true) {
  await pool.execute(
    "UPDATE users SET email_verified = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [verified ? 1 : 0, userId]
  );
  return findUserById(userId);
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateLastLoginAt,
  updateUser,
  updateUserPassword,
  setEmailVerified,
};
