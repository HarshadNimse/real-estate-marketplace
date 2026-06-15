const express = require("express");
const {
  createProperty,
  getProperties,
  getPropertyById,
  getPropertyBySlug,
  updateProperty,
  deleteProperty,
  updatePropertyStatus,
  getMyPropertyListings,
  getAdminProperties,
} = require("../controllers/propertyController");
const { requireAuth, attachUserIfPresent } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");
const { upload } = require("../middlewares/uploadMiddleware");

const propertyRouter = express.Router();

propertyRouter.get("/", getProperties);
propertyRouter.get("/mine", requireAuth, requireRole("seller"), getMyPropertyListings);
propertyRouter.get("/admin/all", requireAuth, requireRole("admin"), getAdminProperties);
propertyRouter.get("/slug/:slug", attachUserIfPresent, getPropertyBySlug);
propertyRouter.get("/:id", attachUserIfPresent, getPropertyById);

propertyRouter.post(
  "/",
  requireAuth,
  requireRole("seller"),
  upload.array("images", 10),
  createProperty
);

propertyRouter.put(
  "/:id",
  requireAuth,
  requireRole("seller", "admin"),
  upload.array("images", 10),
  updateProperty
);

propertyRouter.delete(
  "/:id",
  requireAuth,
  requireRole("seller", "admin"),
  deleteProperty
);

propertyRouter.patch(
  "/:id/status",
  requireAuth,
  requireRole("admin"),
  updatePropertyStatus
);

module.exports = propertyRouter;
