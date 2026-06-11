const { pool } = require("../config/db");
const { countTotalPropertyViews } = require("../models/propertyViewModel");

async function listUsers(req, res, next) {
  try {
    const role = req.query.role ? String(req.query.role).trim().toLowerCase() : "";
    const search = req.query.search ? String(req.query.search).trim() : "";
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const where = ["1=1"];
    const params = [];
    if (role && ["buyer", "seller", "admin"].includes(role)) {
      where.push("role = ?");
      params.push(role);
    }
    if (search) {
      where.push("(full_name LIKE ? OR email LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM users WHERE ${where.join(" AND ")}`,
      params
    );

    const [rows] = await pool.execute(
      `SELECT id, full_name, email, phone, role, is_active, email_verified, created_at, last_login_at
       FROM users WHERE ${where.join(" AND ")} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    return res.status(200).json({
      success: true,
      data: {
        users: rows,
        pagination: { total: Number(total), limit, offset },
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function toggleUserStatus(req, res, next) {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid user id." });
    }
    if (userId === req.user.id) {
      return res
        .status(400)
        .json({ success: false, message: "You cannot deactivate yourself." });
    }
    const [[user]] = await pool.execute(
      "SELECT id, role, is_active FROM users WHERE id = ?",
      [userId]
    );
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    if (user.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Cannot change status of another admin.",
      });
    }
    const newStatus = user.is_active ? 0 : 1;
    await pool.execute(
      "UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?",
      [newStatus, userId]
    );
    return res.status(200).json({
      success: true,
      message: `User ${newStatus ? "activated" : "deactivated"}.`,
      data: { is_active: Boolean(newStatus) },
    });
  } catch (error) {
    return next(error);
  }
}

async function adminStats(req, res, next) {
  try {
    const [[{ totalUsers }]] = await pool.execute(
      "SELECT COUNT(*) AS totalUsers FROM users WHERE role != 'admin'"
    );
    const [[{ totalProperties }]] = await pool.execute(
      "SELECT COUNT(*) AS totalProperties FROM properties WHERE deleted_at IS NULL"
    );
    const [[{ pendingProperties }]] = await pool.execute(
      "SELECT COUNT(*) AS pendingProperties FROM properties WHERE status = 'pending' AND deleted_at IS NULL"
    );
    const [[{ totalInquiries }]] = await pool.execute(
      "SELECT COUNT(*) AS totalInquiries FROM inquiries"
    );
    const totalViews = await countTotalPropertyViews();
    return res.status(200).json({
      success: true,
      data: {
        totalUsers: Number(totalUsers),
        totalProperties: Number(totalProperties),
        pendingProperties: Number(pendingProperties),
        totalInquiries: Number(totalInquiries),
        totalViews,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getPropertyDetail(req, res, next) {
  try {
    const propertyId = Number(req.params.id);
    if (!Number.isInteger(propertyId) || propertyId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid property id." });
    }
    
    const [[property]] = await pool.execute(
      `SELECT p.*, u.full_name as seller_name, u.email as seller_email
       FROM properties p
       LEFT JOIN users u ON p.seller_id = u.id
       WHERE p.id = ? AND p.deleted_at IS NULL`,
      [propertyId]
    );
    
    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found." });
    }
    
    const [images] = await pool.execute(
      "SELECT id, image_url, cloudinary_public_id, is_primary FROM property_images WHERE property_id = ? ORDER BY created_at ASC",
      [propertyId]
    );
    
    return res.status(200).json({
      success: true,
      data: { property, images },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listUsers, toggleUserStatus, adminStats, getPropertyDetail };
