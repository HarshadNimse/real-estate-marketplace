const { pool } = require("../config/db");
const { findPropertyById } = require("../models/propertyModel");
const {
  createInquiry,
  findInquiryById,
  findActiveInquiryByBuyerAndProperty,
  updateInquiryStatus,
  getSellerInbox,
  getBuyerHistory,
} = require("../models/inquiryModel");
const {
  normalizeCreateInquiryPayload,
  normalizeInquiryStatusPayload,
  parseInquiryId,
  normalizePagination,
} = require("./inquiryValidationService");
const { notifySellerOfInquiry } = require("./inquiryNotificationService");

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function createPropertyInquiry(user, body) {
  if (user.role !== "buyer") {
    throw createError("Only buyers can create inquiries.", 403);
  }

  const payload = normalizeCreateInquiryPayload(body);
  const property = await findPropertyById(payload.propertyId);

  if (!property || property.deleted_at) {
    throw createError("Property not found.", 404);
  }
  if (!(property.status === "approved" && Number(property.is_active) === 1)) {
    throw createError("Inquiries are allowed only for approved active properties.", 400);
  }
  if (Number(property.seller_id) === Number(user.id)) {
    throw createError("You cannot contact your own property listing.", 400);
  }

  const connection = await pool.getConnection();
  let inquiryId;
  try {
    await connection.beginTransaction();
    const activeInquiry = await findActiveInquiryByBuyerAndProperty(
      user.id,
      payload.propertyId,
      connection
    );
    if (activeInquiry) {
      throw createError(
        "You already have an active inquiry for this property. Close it before creating a new one.",
        409
      );
    }

    inquiryId = await createInquiry(
      {
        propertyId: payload.propertyId,
        buyerId: user.id,
        sellerId: property.seller_id,
        message: payload.message,
        contactPhone: payload.contactPhone,
      },
      connection
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const inquiry = await findInquiryById(inquiryId);
  notifySellerOfInquiry({
    sellerEmail: property.seller_email,
    propertyTitle: property.title,
    buyerName: user.full_name,
    message: payload.message,
  }).catch((err) => {
    console.warn("Inquiry notification email failed:", err.message);
  });
  return { inquiry };
}

async function getSellerInquiries(user, query) {
  if (user.role !== "seller") {
    throw createError("Only sellers can access seller inbox.", 403);
  }
  const pagination = normalizePagination(query);
  const { rows, total } = await getSellerInbox(user.id, pagination);
  return {
    inquiries: rows,
    pagination: {
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    },
  };
}

async function getBuyerInquiries(user, query) {
  if (user.role !== "buyer") {
    throw createError("Only buyers can access inquiry history.", 403);
  }
  const pagination = normalizePagination(query);
  const { rows, total } = await getBuyerHistory(user.id, pagination);
  return {
    inquiries: rows,
    pagination: {
      total,
      limit: pagination.limit,
      offset: pagination.offset,
    },
  };
}

function isValidStatusTransition(currentStatus, nextStatus) {
  const allowedTransitions = {
    open: new Set(["responded", "closed"]),
    responded: new Set(["closed"]),
    closed: new Set([]),
  };
  return allowedTransitions[currentStatus]?.has(nextStatus) || false;
}

async function updateInquiryStatusByRole(user, inquiryIdRaw, body) {
  const inquiryId = parseInquiryId(inquiryIdRaw);
  const inquiry = await findInquiryById(inquiryId);
  if (!inquiry) {
    throw createError("Inquiry not found.", 404);
  }

  const isSeller = Number(inquiry.seller_id) === Number(user.id);
  const isBuyer = Number(inquiry.buyer_id) === Number(user.id);

  if (!isSeller && !isBuyer) {
    throw createError("You do not have permission to update this inquiry.", 403);
  }

  const { status } = normalizeInquiryStatusPayload(body);
  if (!isValidStatusTransition(inquiry.status, status)) {
    throw createError(
      `Invalid status transition from ${inquiry.status} to ${status}.`,
      400
    );
  }

  if (status === "responded" && !isSeller) {
    throw createError("Only seller can mark inquiry as responded.", 403);
  }
  if (status === "closed" && !isSeller && !isBuyer) {
    throw createError("Only buyer or seller can close inquiry.", 403);
  }

  await updateInquiryStatus(inquiryId, status);
  const updatedInquiry = await findInquiryById(inquiryId);
  return { inquiry: updatedInquiry };
}

module.exports = {
  createPropertyInquiry,
  getSellerInquiries,
  getBuyerInquiries,
  updateInquiryStatusByRole,
};
