const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { pool } = require("../config/db");
const env = require("../config/env");

function signAccessToken(payload) {
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn || "7d",
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.secret);
}

async function createRefreshToken(userId) {
  const raw = crypto.randomBytes(40).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await pool.execute(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    [userId, hash, expiresAt]
  );
  return raw;
}

async function rotateRefreshToken(rawToken) {
  const hash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const [rows] = await pool.execute(
    "SELECT * FROM refresh_tokens WHERE token_hash = ? AND expires_at > NOW()",
    [hash]
  );
  if (!rows.length) return null;

  const { user_id } = rows[0];
  await pool.execute("DELETE FROM refresh_tokens WHERE token_hash = ?", [hash]);
  const newRaw = await createRefreshToken(user_id);
  return { userId: user_id, refreshToken: newRaw };
}

async function revokeRefreshToken(rawToken) {
  const hash = crypto.createHash("sha256").update(rawToken).digest("hex");
  await pool.execute("DELETE FROM refresh_tokens WHERE token_hash = ?", [hash]);
}

async function revokeAllRefreshTokens(userId) {
  await pool.execute("DELETE FROM refresh_tokens WHERE user_id = ?", [userId]);
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
};
