const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeListFilters,
  normalizePropertyPayload,
} = require("../backend/services/propertyValidationService");

test("normalizeListFilters accepts q, furnishing, and area range", () => {
  const filters = normalizeListFilters({
    q: "metro",
    city: "Pune",
    furnishing: "semi",
    minArea: "500",
    maxArea: "1200",
    limit: "10",
    offset: "0",
  });
  assert.equal(filters.q, "metro");
  assert.equal(filters.city, "Pune");
  assert.equal(filters.furnishing, "semi");
  assert.equal(filters.minArea, 500);
  assert.equal(filters.maxArea, 1200);
});

test("normalizePropertyPayload rejects invalid furnishing", () => {
  assert.throws(
    () =>
      normalizePropertyPayload({
        title: "Test",
        description: "Desc",
        city: "Pune",
        property_type: "rent",
        price: 1000,
        latitude: 18,
        longitude: 73,
        bhk: 2,
        area_sqft: 900,
        furnishing: "luxury",
      }),
    /furnishing/
  );
});

test("normalizePropertyPayload allows missing bhk", () => {
  const normalized = normalizePropertyPayload({
    title: "Plot in Pune",
    description: "Open land near highway.",
    city: "Pune",
    property_type: "sale",
    price: 1200000,
    latitude: 18,
    longitude: 73,
    area_sqft: 1200,
    furnishing: "unfurnished",
  });

  assert.equal(normalized.bhk, null);
  assert.equal(normalized.city, "Pune");
  assert.equal(normalized.propertyType, "sale");
});
