const {
  createPropertyInquiry,
  getSellerInquiries,
  getBuyerInquiries,
  updateInquiryStatusByRole,
  createInquiryMessage,
  getMessagesByInquiry,
} = require("../services/inquiryService");

async function createInquiry(req, res, next) {
  try {
    const data = await createPropertyInquiry(req.user, req.body);
    return res.status(201).json({
      success: true,
      message: "Inquiry created successfully.",
      data,
    });
  } catch (error) {
    return next(error);
  }
}

async function getSellerInbox(req, res, next) {
  try {
    const data = await getSellerInquiries(req.user, req.query);
    return res.status(200).json({
      success: true,
      message: "Seller inquiries fetched successfully.",
      data,
    });
  } catch (error) {
    return next(error);
  }
}

async function getBuyerHistory(req, res, next) {
  try {
    const data = await getBuyerInquiries(req.user, req.query);
    return res.status(200).json({
      success: true,
      message: "Buyer inquiries fetched successfully.",
      data,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateInquiryStatus(req, res, next) {
  try {
    const data = await updateInquiryStatusByRole(
      req.user,
      req.params.id,
      req.body
    );
    return res.status(200).json({
      success: true,
      message: "Inquiry status updated successfully.",
      data,
    });
  } catch (error) {
    return next(error);
  }
}

async function sendInquiryMessage(req, res, next) {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message content is required." });
    }
    const newMessage = await createInquiryMessage(req.user, req.params.id, message);
    return res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: { message: newMessage },
    });
  } catch (error) {
    return next(error);
  }
}

async function getInquiryMessages(req, res, next) {
  try {
    const data = await getMessagesByInquiry(req.user, req.params.id);
    return res.status(200).json({
      success: true,
      message: "Messages fetched successfully.",
      data,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createInquiry,
  getSellerInbox,
  getBuyerHistory,
  updateInquiryStatus,
  sendInquiryMessage,
  getInquiryMessages,
};
