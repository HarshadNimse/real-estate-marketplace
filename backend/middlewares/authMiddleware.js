const { findUserById } = require("../models/userModel");
const { verifyAccessToken } = require("../services/jwtService");

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing or invalid.",
      });
    }

    const decoded = verifyAccessToken(token);
    const user = await findUserById(decoded.sub);

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: "User no longer has access.",
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Token expired. Please log in again."
        : "Invalid token.";

    return res.status(401).json({
      success: false,
      message,
    });
  }
}

async function attachUserIfPresent(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      return next();
    }

    const decoded = verifyAccessToken(token);
    const user = await findUserById(decoded.sub);
    if (user && user.is_active) {
      req.user = user;
    }
    return next();
  } catch (error) {
    return next();
  }
}

module.exports = {
  requireAuth,
  attachUserIfPresent,
};
