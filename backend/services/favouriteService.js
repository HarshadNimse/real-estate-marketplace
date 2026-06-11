const { findPropertyById } = require("../models/propertyModel");
const {
  addFavourite,
  removeFavourite,
  listFavouritesByUser,
} = require("../models/favouriteModel");

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function assertListableProperty(property) {
  if (!property || property.deleted_at) {
    throw createError("Property not found.", 404);
  }
  if (!(property.status === "approved" && Number(property.is_active) === 1)) {
    throw createError("Only approved active properties can be saved.", 400);
  }
}

async function addPropertyFavourite(user, propertyIdRaw) {
  if (user.role !== "buyer") {
    throw createError("Only buyers can save favourites.", 403);
  }
  const propertyId = Number(propertyIdRaw);
  if (!Number.isInteger(propertyId) || propertyId <= 0) {
    throw createError("Invalid property id.", 400);
  }
  const property = await findPropertyById(propertyId);
  assertListableProperty(property);
  await addFavourite(user.id, propertyId);
}

async function removePropertyFavourite(user, propertyIdRaw) {
  if (user.role !== "buyer") {
    throw createError("Only buyers can remove favourites.", 403);
  }
  const propertyId = Number(propertyIdRaw);
  if (!Number.isInteger(propertyId) || propertyId <= 0) {
    throw createError("Invalid property id.", 400);
  }
  await removeFavourite(user.id, propertyId);
}

async function getUserFavourites(user) {
  if (user.role !== "buyer") {
    throw createError("Only buyers can view favourites.", 403);
  }
  const properties = await listFavouritesByUser(user.id);
  return { properties };
}

module.exports = {
  addPropertyFavourite,
  removePropertyFavourite,
  getUserFavourites,
};
