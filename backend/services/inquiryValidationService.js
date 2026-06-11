function createValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function normalizeCreateInquiryPayload(body) {
  const propertyId = Number(body.property_id ?? body.propertyId);
  const message = String(body.message || "").trim();
  const contactPhone = body.contact_phone
    ? String(body.contact_phone).trim()
    : body.contactPhone
    ? String(body.contactPhone).trim()
    : null;

  if (!Number.isInteger(propertyId) || propertyId <= 0) {
    throw createValidationError("property_id must be a valid positive integer.");
  }
  if (!message) {
    throw createValidationError("message is required.");
  }

  return { propertyId, message, contactPhone };
}

function normalizeInquiryStatusPayload(body) {
  const status = String(body.status || "")
    .trim()
    .toLowerCase();
  if (!["responded", "closed"].includes(status)) {
    throw createValidationError("status must be either responded or closed.");
  }
  return { status };
}

function parseInquiryId(rawId) {
  const inquiryId = Number(rawId);
  if (!Number.isInteger(inquiryId) || inquiryId <= 0) {
    throw createValidationError("Inquiry id must be a positive integer.");
  }
  return inquiryId;
}

function normalizePagination(query) {
  const limit = query.limit === undefined ? 10 : Number(query.limit);
  const offset = query.offset === undefined ? 0 : Number(query.offset);

  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw createValidationError("limit must be an integer between 1 and 50.");
  }
  if (!Number.isInteger(offset) || offset < 0) {
    throw createValidationError("offset must be an integer greater than or equal to 0.");
  }

  return { limit, offset };
}

module.exports = {
  normalizeCreateInquiryPayload,
  normalizeInquiryStatusPayload,
  parseInquiryId,
  normalizePagination,
};
