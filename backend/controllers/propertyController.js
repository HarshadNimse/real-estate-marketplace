const {
  createPropertyListing,
  getPublicProperties,
  getPropertyDetails,
  getPropertyDetailsBySlug,
  updatePropertyListing,
  softDeletePropertyListing,
  adminUpdatePropertyStatus,
  getMyProperties,
  getAdminPropertyListings,
  deletePropertyImageListing,
} = require("../services/propertyService");

function parsePropertyId(rawId) {
  const propertyId = Number(rawId);
  if (!Number.isInteger(propertyId) || propertyId <= 0) {
    const error = new Error("Property id must be a positive integer.");
    error.statusCode = 400;
    throw error;
  }
  return propertyId;
}

async function createProperty(req, res, next) {
  try {
    const data = await createPropertyListing(req.user, req.body, req.files);
    return res.status(201).json({
      success: true,
      message: "Property created and submitted for approval.",
      data,
    });
  } catch (error) {
    return next(error);
  }
}

async function getProperties(req, res, next) {
  try {
    const data = await getPublicProperties(req.query);
    return res.status(200).json({
      success: true,
      message: "Properties fetched successfully.",
      data,
    });
  } catch (error) {
    return next(error);
  }
}

async function getPropertyById(req, res, next) {
  try {
    const propertyId = parsePropertyId(req.params.id);
    const data = await getPropertyDetails(propertyId, req.user || null);
    return res.status(200).json({
      success: true,
      message: "Property fetched successfully.",
      data,
    });
  } catch (error) {
    return next(error);
  }
}

async function getPropertyBySlug(req, res, next) {
  try {
    const data = await getPropertyDetailsBySlug(req.params.slug, req.user || null);
    return res.status(200).json({
      success: true,
      message: "Property fetched successfully.",
      data,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateProperty(req, res, next) {
  try {
    const propertyId = parsePropertyId(req.params.id);
    const data = await updatePropertyListing(
      propertyId,
      req.user,
      req.body,
      req.files
    );
    return res.status(200).json({
      success: true,
      message: "Property updated and moved to pending review.",
      data,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteProperty(req, res, next) {
  try {
    const propertyId = parsePropertyId(req.params.id);
    await softDeletePropertyListing(propertyId, req.user);
    return res.status(200).json({
      success: true,
      message: "Property deleted successfully.",
    });
  } catch (error) {
    return next(error);
  }
}

async function updatePropertyStatus(req, res, next) {
  try {
    const propertyId = parsePropertyId(req.params.id);
    const data = await adminUpdatePropertyStatus(propertyId, req.user, req.body);
    return res.status(200).json({
      success: true,
      message: "Property status updated successfully.",
      data,
    });
  } catch (error) {
    return next(error);
  }
}

async function getMyPropertyListings(req, res, next) {
  try {
    const data = await getMyProperties(req.user, req.query);
    return res.status(200).json({
      success: true,
      message: "Your properties fetched successfully.",
      data,
    });
  } catch (error) {
    return next(error);
  }
}

async function getAdminProperties(req, res, next) {
  try {
    const data = await getAdminPropertyListings(req.user, req.query);
    return res.status(200).json({
      success: true,
      message: "Admin properties fetched successfully.",
      data,
    });
  } catch (error) {
    return next(error);
  }
}

async function deletePropertyImage(req, res, next) {
  try {
    const propertyId = parsePropertyId(req.params.id);
    const imageId = Number(req.params.imgId);
    if (!Number.isInteger(imageId) || imageId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid image id." });
    }
    const data = await deletePropertyImageListing(propertyId, imageId, req.user);
    return res.status(200).json({
      success: true,
      message: "Image deleted successfully.",
      data,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createProperty,
  getProperties,
  getPropertyById,
  getPropertyBySlug,
  updateProperty,
  deleteProperty,
  updatePropertyStatus,
  getMyPropertyListings,
  getAdminProperties,
  deletePropertyImage,
};
