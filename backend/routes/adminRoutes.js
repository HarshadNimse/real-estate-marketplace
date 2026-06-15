const express = require("express");
const { requireAuth } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");
const { listUsers, toggleUserStatus, adminStats, getPropertyDetail, getAdminSettings, updateAdminSettings } = require("../controllers/adminController");

const adminRouter = express.Router();

adminRouter.use(requireAuth, requireRole("admin"));

adminRouter.get("/health", (req, res) =>
  res.status(200).json({ success: true, message: "Admin route access granted." })
);
adminRouter.get("/stats", adminStats);
adminRouter.get("/settings", getAdminSettings);
adminRouter.put("/settings", updateAdminSettings);
adminRouter.get("/properties/:id", getPropertyDetail);
adminRouter.get("/users", listUsers);
adminRouter.patch("/users/:id/toggle-status", toggleUserStatus);

module.exports = adminRouter;
