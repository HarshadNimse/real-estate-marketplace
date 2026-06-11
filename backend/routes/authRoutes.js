const express = require("express");
const {
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
} = require("../controllers/authController");
const { requireAuth } = require("../middlewares/authMiddleware");

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh", refreshToken);
authRouter.post("/logout", logout);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password", resetPassword);
authRouter.post("/verify-email", verifyEmail);
authRouter.post("/send-verification-email", requireAuth, sendVerificationEmail);
authRouter.get("/me", requireAuth, getProfile);
authRouter.put("/me", requireAuth, updateProfile);
authRouter.post("/me/change-password", requireAuth, changePassword);

module.exports = authRouter;
