const { pool } = require("../config/db");
const {
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
} = require("../models/propertyModel");
const {
  createPropertyImages,
  replacePropertyImages,
  getPropertyImages,
  getPropertyPublicIds,
  findPropertyImageById,
  deletePropertyImageById,
  countPropertyImages,
} = require("../models/propertyImageModel");
const { uploadPropertyImage, deletePropertyImage } = require("./cloudinaryService");
const { recordPropertyView } = require("../models/propertyViewModel");
const {
  normalizePropertyPayload,
  validateImageFiles,
  normalizeStatusPayload,
  normalizeListFilters,
} = require("./propertyValidationService");

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function canManageProperty(user, property) {
  return user.role === "admin" || Number(property.seller_id) === Number(user.id);
}

async function resolveUniqueSlug(baseSlug, excludePropertyId) {
  const existingSlugs = await getExistingSlugs(baseSlug, excludePropertyId);
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let suffix = 1;
  while (existingSlugs.includes(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }
  return `${baseSlug}-${suffix}`;
}

function assertPropertyVisibility(property, currentUser) {
  if (!property || property.deleted_at) {
    throw createError("Property not found.", 404);
  }

  const isPublicVisible =
    property.status === "approved" && Number(property.is_active) === 1;
  const isOwner = currentUser && Number(currentUser.id) === Number(property.seller_id);
  const isAdmin = currentUser && currentUser.role === "admin";

  if (!isPublicVisible && !isOwner && !isAdmin) {
    throw createError("Property not found.", 404);
  }
}

async function uploadFilesToCloudinary(files) {
  if (!files || !files.length) return [];
  const uploaded = [];
  for (const file of files) {
    try {
      const result = await uploadPropertyImage(file.buffer, file.originalname);
      uploaded.push(result);
    } catch (uploadError) {
      throw createError(
        "Image upload failed. Check your Cloudinary settings in .env, or remove CLOUDINARY_* values to use placeholder images in development.",
        502
      );
    }
  }
  return uploaded.map((item, index) => ({
    imageUrl: item.imageUrl,
    publicId: item.publicId,
    isPrimary: index === 0,
  }));
}

async function createPropertyListing(user, body, files) {
  if (user.role !== "seller") {
    throw createError("Only sellers can create properties.", 403);
  }

  validateImageFiles(files);
  const payload = normalizePropertyPayload(body);
  payload.sellerId = user.id;
  payload.slug = await resolveUniqueSlug(payload.slug);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const propertyId = await createProperty(payload, connection);
    
    // Upload files if provided, otherwise create with no images (placeholder will be used)
    const uploadedImages = files && files.length ? await uploadFilesToCloudinary(files) : [];
    
    if (uploadedImages.length) {
      await createPropertyImages(propertyId, uploadedImages, connection);
    }
    
    await connection.commit();
    const property = await findPropertyById(propertyId);
    const images = await getPropertyImages(propertyId);
    return { property, images };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getPublicProperties(query) {
  const filters = normalizeListFilters(query);
  const { rows, total } = await listPublicProperties(filters);
  return {
    properties: rows,
    pagination: {
      total,
      limit: filters.limit,
      offset: filters.offset,
    },
  };
}

async function maybeRecordPublicView(property, currentUser) {
  const isPublicVisible =
    property.status === "approved" && Number(property.is_active) === 1;
  if (!isPublicVisible) return;
  const userId = currentUser ? currentUser.id : null;
  recordPropertyView(property.id, userId).catch((err) => {
    console.warn("Property view tracking failed:", err.message);
  });
}

async function getPropertyDetails(propertyId, currentUser) {
  const property = await findPropertyById(propertyId);
  assertPropertyVisibility(property, currentUser);
  await maybeRecordPublicView(property, currentUser);

  const images = await getPropertyImages(property.id);
  return { property, images };
}

async function getPropertyDetailsBySlug(slug, currentUser) {
  const cleanSlug = String(slug || "").trim().toLowerCase();
  if (!cleanSlug) {
    throw createError("Property slug is required.", 400);
  }

  const property = await findPropertyBySlug(cleanSlug);
  assertPropertyVisibility(property, currentUser);
  await maybeRecordPublicView(property, currentUser);
  const images = await getPropertyImages(property.id);
  return { property, images };
}

async function updatePropertyListing(propertyId, user, body, files) {
  const existing = await findPropertyById(propertyId);
  if (!existing || existing.deleted_at) {
    throw createError("Property not found.", 404);
  }
  if (!canManageProperty(user, existing)) {
    throw createError("You do not have permission to update this property.", 403);
  }

  validateImageFiles(files);
  const payload = normalizePropertyPayload(body);
  payload.slug = await resolveUniqueSlug(payload.slug, propertyId);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // Admins can update without changing approval status
    // Sellers also keep approval status (don't reset to pending)
    await updatePropertyById(
      propertyId,
      payload,
      { resetApproval: false },
      connection
    );
    
    // Only update images if files are provided
    if (files && files.length) {
      const oldPublicIds = await getPropertyPublicIds(propertyId, connection);
      for (const pid of oldPublicIds) {
        await deletePropertyImage(pid);
      }
      const uploadedImages = await uploadFilesToCloudinary(files);
      await replacePropertyImages(propertyId, uploadedImages, connection);
    }
    
    await connection.commit();
    return getPropertyDetails(propertyId, user);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function softDeletePropertyListing(propertyId, user) {
  const existing = await findPropertyById(propertyId);
  if (!existing || existing.deleted_at) {
    throw createError("Property not found.", 404);
  }
  if (!canManageProperty(user, existing)) {
    throw createError("You do not have permission to delete this property.", 403);
  }
  const oldPublicIds = await getPropertyPublicIds(propertyId);
  for (const pid of oldPublicIds) {
    await deletePropertyImage(pid);
  }
  await softDeletePropertyById(propertyId);
}

async function adminUpdatePropertyStatus(propertyId, adminUser, body) {
  if (adminUser.role !== "admin") {
    throw createError("Only admins can update property status.", 403);
  }
  const existing = await findPropertyById(propertyId);
  if (!existing || existing.deleted_at) {
    throw createError("Property not found.", 404);
  }

  const { status } = normalizeStatusPayload(body);
  await updatePropertyStatus(propertyId, status, adminUser.id);
  return getPropertyDetails(propertyId, adminUser);
}

async function getMyProperties(user, query = {}) {
  if (user.role === "admin") {
    throw createError("Use admin listing routes for all properties.", 400);
  }
  const limit = query.limit === undefined ? 8 : Number(query.limit);
  const offset = query.offset === undefined ? 0 : Number(query.offset);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw createError("limit must be an integer between 1 and 50.", 400);
  }
  if (!Number.isInteger(offset) || offset < 0) {
    throw createError("offset must be an integer >= 0.", 400);
  }
  const { rows, total } = await listPropertiesBySellerId(user.id, { limit, offset });
  return {
    properties: rows,
    pagination: { total, limit, offset },
  };
}

async function getMyPropertyStats(user) {
  if (user.role !== "seller") {
    throw createError("Only sellers can access seller stats.", 403);
  }
  const stats = await getSellerDashboardStats(user.id);
  const responseRate = stats.totalInquiries
    ? Math.round((stats.respondedInquiries / stats.totalInquiries) * 100)
    : 0;
  return { ...stats, responseRate };
}

async function getAdminPropertyListings(user, query) {
  if (user.role !== "admin") {
    throw createError("Only admins can access all properties.", 403);
  }

  const limit = query.limit === undefined ? 20 : Number(query.limit);
  const offset = query.offset === undefined ? 0 : Number(query.offset);
  const status = query.status ? String(query.status).trim().toLowerCase() : "";

  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw createError("limit must be an integer between 1 and 50.", 400);
  }
  if (!Number.isInteger(offset) || offset < 0) {
    throw createError("offset must be an integer >= 0.", 400);
  }
  if (status && !["pending", "approved", "rejected"].includes(status)) {
    throw createError("status must be pending, approved, or rejected.", 400);
  }

  const { rows, total } = await listAdminProperties({ limit, offset, status });
  return {
    properties: rows,
    pagination: { total, limit, offset },
  };
}

async function deletePropertyImageListing(propertyId, imageId, user) {
  const property = await findPropertyById(propertyId);
  if (!property || property.deleted_at) {
    throw createError("Property not found.", 404);
  }
  if (!canManageProperty(user, property)) {
    throw createError("You do not have permission to delete this image.", 403);
  }

  const image = await findPropertyImageById(propertyId, imageId);
  if (!image) {
    throw createError("Image not found.", 404);
  }

  await deletePropertyImageById(propertyId, imageId);
  if (image.cloudinary_public_id) {
    await deletePropertyImage(image.cloudinary_public_id);
  }

  const remaining = await countPropertyImages(propertyId);
  if (remaining === 0) {
    return { images: [] };
  }

  const images = await getPropertyImages(propertyId);
  const hasPrimary = images.some((img) => Number(img.is_primary) === 1);
  if (!hasPrimary && images.length) {
    await pool.execute(
      "UPDATE property_images SET is_primary = 1 WHERE id = ? AND property_id = ?",
      [images[0].id, propertyId]
    );
  }

  return { images: await getPropertyImages(propertyId) };
}

module.exports = {
  createPropertyListing,
  getPublicProperties,
  getPropertyDetails,
  getPropertyDetailsBySlug,
  updatePropertyListing,
  softDeletePropertyListing,
  adminUpdatePropertyStatus,
  getMyProperties,
  getMyPropertyStats,
  getAdminPropertyListings,
  deletePropertyImageListing,
};
