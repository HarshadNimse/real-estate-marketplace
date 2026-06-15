const crypto = require("crypto");
const { pool } = require("../config/db");
const {
  createUser,
  findUserByEmail,
  findUserById,
  updateLastLoginAt,
  updateUser,
  updateUserPassword,
} = require("../models/userModel");
const env = require("../config/env");
const { hashPassword, comparePassword } = require("../services/passwordService");
const { sendEmail } = require("../services/emailService");
const { setEmailVerified } = require("../models/userModel");
const {
  signAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokens,
} = require("../services/jwtService");

const registerAllowedRoles = new Set(["buyer", "seller"]);
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

async function getAuthResponse(user) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = await createRefreshToken(user.id);
  return { accessToken, refreshToken, user };
}

async function register(req, res, next) {
  try {
    const fullName = (req.body.fullName || req.body.full_name || "").trim();
    const { email, phone, password, role } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "fullName/full_name, email, and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    const normalizedEmail = normalizeEmail(email);
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    const selectedRole = role ? role.toLowerCase() : "buyer";

    if (!registerAllowedRoles.has(selectedRole)) {
      return res.status(400).json({
        success: false,
        message: "Role must be either buyer or seller.",
      });
    }

    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      fullName,
      email: normalizedEmail,
      phone: phone ? phone.trim() : null,
      passwordHash,
      role: selectedRole,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      data: await getAuthResponse(user),
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "email and password are required.",
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const userWithPassword = await findUserByEmail(normalizedEmail);

    if (!userWithPassword || !userWithPassword.is_active) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    if (env.requireEmailVerification && !userWithPassword.email_verified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }

    const isPasswordValid = await comparePassword(
      password,
      userWithPassword.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    await updateLastLoginAt(userWithPassword.id);

    const user = {
      id: userWithPassword.id,
      full_name: userWithPassword.full_name,
      email: userWithPassword.email,
      phone: userWithPassword.phone,
      role: userWithPassword.role,
      is_active: userWithPassword.is_active,
    };

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: await getAuthResponse(user),
    });
  } catch (error) {
    return next(error);
  }
}

async function getProfile(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
}

async function refreshToken(req, res, next) {
  try {
    const { refreshToken: raw } = req.body;
    if (!raw) {
      return res
        .status(400)
        .json({ success: false, message: "refreshToken is required." });
    }
    const result = await rotateRefreshToken(raw);
    if (!result) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired refresh token." });
    }
    const user = await findUserById(result.userId);
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: "User not found." });
    }
    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    return res.status(200).json({
      success: true,
      data: { accessToken, refreshToken: result.refreshToken, user },
    });
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken: raw } = req.body;
    if (raw) await revokeRefreshToken(raw);
    return res.status(200).json({ success: true, message: "Logged out." });
  } catch (error) {
    return next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const fullName = (req.body.fullName || req.body.full_name || "").trim();
    const phone = (req.body.phone || "").trim();
    if (!fullName) {
      return res
        .status(400)
        .json({ success: false, message: "fullName is required." });
    }
    const updated = await updateUser(req.user.id, {
      fullName,
      phone: phone || null,
    });
    return res.status(200).json({ success: true, data: { user: updated } });
  } catch (error) {
    return next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "currentPassword and newPassword are required.",
      });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters.",
      });
    }
    const userWithPwd = await findUserByEmail(req.user.email);
    const valid = await comparePassword(currentPassword, userWithPwd.password_hash);
    if (!valid) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect." });
    }
    const hash = await hashPassword(newPassword);
    await updateUserPassword(req.user.id, hash);
    await revokeAllRefreshTokens(req.user.id);
    return res
      .status(200)
      .json({ success: true, message: "Password changed successfully." });
  } catch (error) {
    return next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const emailRaw = String(req.body.email || "").trim();
    if (!emailRaw) {
      return res.status(400).json({ success: false, message: "email is required." });
    }
    const email = normalizeEmail(emailRaw);
    const user = await findUserByEmail(email);
    if (user && user.is_active) {
      const raw = crypto.randomBytes(32).toString("hex");
      const hash = crypto.createHash("sha256").update(raw).digest("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await pool.execute(
        "UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL",
        [user.id]
      );
      await pool.execute(
        "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
        [user.id, hash, expiresAt]
      );
      const resetLink = `${
        process.env.FRONTEND_URL || "http://localhost:5500"
      }/frontend/pages/reset-password.html?token=${raw}`;
      await sendEmail({
        to: user.email,
        subject: "EstateHub — Reset your password",
        html: `<p>Click the link to reset your password (valid 1 hour):</p><p><a href="${resetLink}">${resetLink}</a></p>`,
      });
    }
    return res.status(200).json({
      success: true,
      message: "If that email is registered, a reset link has been sent.",
    });
  } catch (error) {
    return next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "token and newPassword are required." });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    const [rows] = await pool.execute(
      "SELECT * FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()",
      [hash]
    );
    if (!rows.length) {
      return res
        .status(400)
        .json({ success: false, message: "Token is invalid or has expired." });
    }
    const { user_id: userId } = rows[0];
    const passwordHash = await hashPassword(newPassword);
    await updateUserPassword(userId, passwordHash);
    await pool.execute(
      "UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = ?",
      [hash]
    );
    await revokeAllRefreshTokens(userId);
    return res.status(200).json({
      success: true,
      message: "Password has been reset. Please log in.",
    });
  } catch (error) {
    return next(error);
  }
}

async function sendVerificationEmail(req, res, next) {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified.",
      });
    }

    const raw = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash("sha256").update(raw).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await pool.execute(
      "UPDATE email_verification_tokens SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL",
      [user.id]
    );
    await pool.execute(
      "INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
      [user.id, hash, expiresAt]
    );

    const verifyUrl = `${env.frontendUrl}/frontend/pages/verify-email.html?token=${raw}`;
    await sendEmail({
      to: user.email,
      subject: "EstateHub — Verify your email",
      html: `<p>Click to verify your email (valid 24 hours):</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });

    return res.status(200).json({
      success: true,
      message: "Verification email sent.",
    });
  } catch (error) {
    return next(error);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: "token is required." });
    }
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    const [rows] = await pool.execute(
      "SELECT * FROM email_verification_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()",
      [hash]
    );
    if (!rows.length) {
      return res
        .status(400)
        .json({ success: false, message: "Token is invalid or has expired." });
    }
    const { user_id: userId } = rows[0];
    await setEmailVerified(userId, true);
    await pool.execute(
      "UPDATE email_verification_tokens SET used_at = NOW() WHERE token_hash = ?",
      [hash]
    );
    return res.status(200).json({
      success: true,
      message: "Email verified successfully.",
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  getProfile,
  refreshToken,
  logout,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
};
