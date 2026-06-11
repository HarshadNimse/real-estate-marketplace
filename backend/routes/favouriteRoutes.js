const express = require("express");
const { requireAuth } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");
const {
  addFavourite,
  removeFavourite,
  listFavourites,
} = require("../controllers/favouriteController");

const favRouter = express.Router();

favRouter.use(requireAuth, requireRole("buyer"));

favRouter.post("/:propertyId", addFavourite);
favRouter.delete("/:propertyId", removeFavourite);
favRouter.get("/", listFavourites);

module.exports = favRouter;
