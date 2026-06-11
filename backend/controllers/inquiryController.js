const {
  createPropertyInquiry,
  getSellerInquiries,
  getBuyerInquiries,
  updateInquiryStatusByRole,
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

module.exports = {
  createInquiry,
  getSellerInbox,
  getBuyerHistory,
  updateInquiryStatus,
};
