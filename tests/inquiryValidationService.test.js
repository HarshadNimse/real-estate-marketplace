const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeCreateInquiryPayload,
  normalizeInquiryStatusPayload,
} = require("../backend/services/inquiryValidationService");

test("normalizeCreateInquiryPayload maps property_id and message", () => {
  const payload = normalizeCreateInquiryPayload({
    property_id: 5,
    message: "Interested",
    contact_phone: "999",
  });
  assert.equal(payload.propertyId, 5);
  assert.equal(payload.message, "Interested");
  assert.equal(payload.contactPhone, "999");
});

test("normalizeInquiryStatusPayload allows responded and closed", () => {
  assert.equal(normalizeInquiryStatusPayload({ status: "responded" }).status, "responded");
  assert.throws(() => normalizeInquiryStatusPayload({ status: "open" }), /status/);
});
