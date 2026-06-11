const {
  addPropertyFavourite,
  removePropertyFavourite,
  getUserFavourites,
} = require("../services/favouriteService");

async function addFavourite(req, res, next) {
  try {
    await addPropertyFavourite(req.user, req.params.propertyId);
    return res.status(200).json({ success: true, message: "Added to favourites." });
  } catch (error) {
    return next(error);
  }
}

async function removeFavourite(req, res, next) {
  try {
    await removePropertyFavourite(req.user, req.params.propertyId);
    return res.status(200).json({ success: true, message: "Removed from favourites." });
  } catch (error) {
    return next(error);
  }
}

async function listFavourites(req, res, next) {
  try {
    const data = await getUserFavourites(req.user);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  addFavourite,
  removeFavourite,
  listFavourites,
};
