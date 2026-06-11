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

async function createRefreshToken(userId, executor) {
  const db = executor || pool;
  const raw = crypto.randomBytes(40).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.execute(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    [userId, hash, expiresAt]
  );
  return raw;
}

function createTokenReuseError() {
  const error = new Error(
    "Refresh token reuse detected. All sessions have been revoked. Please log in again."
  );
  error.statusCode = 401;
  error.code = "TOKEN_REUSE";
  return error;
}

async function rotateRefreshToken(rawToken) {
  const hash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [reusedRows] = await connection.execute(
      "SELECT user_id FROM refresh_tokens WHERE token_hash = ? AND used_at IS NOT NULL LIMIT 1",
      [hash]
    );
    if (reusedRows.length) {
      await connection.execute("DELETE FROM refresh_tokens WHERE user_id = ?", [
        reusedRows[0].user_id,
      ]);
      await connection.commit();
      throw createTokenReuseError();
    }

    const [rows] = await connection.execute(
      `SELECT id, user_id FROM refresh_tokens
       WHERE token_hash = ? AND expires_at > NOW() AND used_at IS NULL
       LIMIT 1 FOR UPDATE`,
      [hash]
    );
    if (!rows.length) {
      await connection.rollback();
      return null;
    }

    const { id, user_id } = rows[0];
    await connection.execute("UPDATE refresh_tokens SET used_at = NOW() WHERE id = ?", [id]);
    const newRaw = await createRefreshToken(user_id, connection);
    await connection.commit();
    return { userId: user_id, refreshToken: newRaw };
  } catch (error) {
    if (error.code !== "TOKEN_REUSE") {
      await connection.rollback();
    }
    throw error;
  } finally {
    connection.release();
  }
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
