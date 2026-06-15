const express = require("express");
const {
  createInquiry,
  getSellerInbox,
  getBuyerHistory,
  updateInquiryStatus,
  sendInquiryMessage,
  getInquiryMessages,
} = require("../controllers/inquiryController");
const { requireAuth } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");

const inquiryRouter = express.Router();

inquiryRouter.post("/", requireAuth, requireRole("buyer"), createInquiry);
inquiryRouter.get("/seller", requireAuth, requireRole("seller"), getSellerInbox);
inquiryRouter.get("/buyer", requireAuth, requireRole("buyer"), getBuyerHistory);
inquiryRouter.patch(
  "/:id/status",
  requireAuth,
  requireRole("buyer", "seller"),
  updateInquiryStatus
);
inquiryRouter.post(
  "/:id/messages",
  requireAuth,
  requireRole("buyer", "seller"),
  sendInquiryMessage
);
inquiryRouter.get(
  "/:id/messages",
  requireAuth,
  requireRole("buyer", "seller"),
  getInquiryMessages
);

module.exports = inquiryRouter;
