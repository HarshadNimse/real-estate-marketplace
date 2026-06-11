function createValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function toNumber(value, fieldName) {
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) {
    throw createValidationError(`${fieldName} must be a valid number.`);
  }
  return numberValue;
}

function parseAmenities(amenitiesRaw) {
  if (amenitiesRaw === undefined || amenitiesRaw === null || amenitiesRaw === "") {
    return [];
  }

  if (Array.isArray(amenitiesRaw)) {
    return amenitiesRaw.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof amenitiesRaw === "string") {
    try {
      const parsed = JSON.parse(amenitiesRaw);
      if (!Array.isArray(parsed)) {
        throw new Error("Amenities payload must be an array.");
      }
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    } catch (error) {
      throw createValidationError("amenities must be a JSON array or array.");
    }
  }

  throw createValidationError("amenities must be a JSON array or array.");
}

function normalizePropertyPayload(payload) {
  const title = String(payload.title || "").trim();
  const description = String(payload.description || "").trim();
  const city = String(payload.city || "").trim();
  const addressLine = payload.address_line
    ? String(payload.address_line).trim()
    : payload.addressLine
    ? String(payload.addressLine).trim()
    : null;
  const propertyType = String(payload.property_type || payload.propertyType || "")
    .trim()
    .toLowerCase();
  const furnishing = String(payload.furnishing || "unfurnished").trim().toLowerCase();
  const slugInput = String(payload.slug || "").trim().toLowerCase();

  if (!title || !description || !city || !propertyType) {
    throw createValidationError(
      "title, description, city, and property_type are required."
    );
  }

  if (!["rent", "sale"].includes(propertyType)) {
    throw createValidationError("property_type must be either rent or sale.");
  }

  if (!["furnished", "semi", "unfurnished"].includes(furnishing)) {
    throw createValidationError(
      "furnishing must be furnished, semi, or unfurnished."
    );
  }

  const price = toNumber(payload.price, "price");
  const latitude = toNumber(payload.latitude, "latitude");
  const longitude = toNumber(payload.longitude, "longitude");
  const bhkRaw = payload.bhk === undefined || payload.bhk === null ? "" : payload.bhk;
  const bhk = bhkRaw === "" ? null : toNumber(bhkRaw, "bhk");
  const areaSqft = toNumber(payload.area_sqft || payload.areaSqft, "area_sqft");

  if (price < 0) throw createValidationError("price must be greater than or equal to 0.");
  if (latitude < -90 || latitude > 90)
    throw createValidationError("latitude must be between -90 and 90.");
  if (longitude < -180 || longitude > 180)
    throw createValidationError("longitude must be between -180 and 180.");
  if (bhk !== null && (!Number.isInteger(bhk) || bhk < 1 || bhk > 20))
    throw createValidationError("bhk must be an integer between 1 and 20.");
  if (!Number.isInteger(areaSqft) || areaSqft < 100)
    throw createValidationError("area_sqft must be an integer greater than or equal to 100.");

  const amenities = parseAmenities(payload.amenities);

  return {
    title,
    slug: slugInput || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    description,
    price,
    city,
    addressLine,
    latitude,
    longitude,
    propertyType,
    bhk,
    areaSqft,
    furnishing,
    amenitiesJson: JSON.stringify(amenities),
  };
}

function validateImageFiles(files) {
  if (!files || !files.length) return;
  if (files.length > 10) {
    throw createValidationError("You can upload at most 10 images.");
  }
}

function normalizeStatusPayload(payload) {
  const status = String(payload.status || "")
    .trim()
    .toLowerCase();

  if (!["approved", "rejected"].includes(status)) {
    throw createValidationError("status must be either approved or rejected.");
  }

  return { status };
}

function normalizeListFilters(query) {
  const limit = query.limit === undefined ? 10 : Number(query.limit);
  const offset = query.offset === undefined ? 0 : Number(query.offset);
  const sortBy = String(query.sortBy || "created_at").trim();
  const sortOrder = String(query.sortOrder || "desc").trim().toLowerCase();

  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw createValidationError("limit must be an integer between 1 and 50.");
  }
  if (!Number.isInteger(offset) || offset < 0) {
    throw createValidationError("offset must be an integer greater than or equal to 0.");
  }
  if (!["price", "created_at"].includes(sortBy)) {
    throw createValidationError("sortBy must be price or created_at.");
  }
  if (!["asc", "desc"].includes(sortOrder)) {
    throw createValidationError("sortOrder must be asc or desc.");
  }

  const filters = {
    limit,
    offset,
    sortBy,
    sortOrder,
  };

  const searchQ = String(query.q || query.search || "").trim();
  if (searchQ) filters.q = searchQ;

  if (query.city) filters.city = String(query.city).trim();
  if (query.property_type)
    filters.propertyType = String(query.property_type).trim().toLowerCase();
  if (query.furnishing) {
    const furnishing = String(query.furnishing).trim().toLowerCase();
    if (!["furnished", "semi", "unfurnished"].includes(furnishing)) {
      throw createValidationError(
        "furnishing must be furnished, semi, or unfurnished."
      );
    }
    filters.furnishing = furnishing;
  }
  const minAreaRaw = query.minArea ?? query.minSqft;
  const maxAreaRaw = query.maxArea ?? query.maxSqft;
  if (minAreaRaw !== undefined) {
    const minArea = Number(minAreaRaw);
    if (!Number.isInteger(minArea) || minArea < 100) {
      throw createValidationError("minArea must be an integer >= 100.");
    }
    filters.minArea = minArea;
  }
  if (maxAreaRaw !== undefined) {
    const maxArea = Number(maxAreaRaw);
    if (!Number.isInteger(maxArea) || maxArea < 100) {
      throw createValidationError("maxArea must be an integer >= 100.");
    }
    filters.maxArea = maxArea;
  }
  if (
    typeof filters.minArea === "number" &&
    typeof filters.maxArea === "number" &&
    filters.minArea > filters.maxArea
  ) {
    throw createValidationError("minArea cannot be greater than maxArea.");
  }
  if (query.bhk !== undefined) {
    const bhk = Number(query.bhk);
    if (!Number.isInteger(bhk) || bhk < 1 || bhk > 20) {
      throw createValidationError("bhk must be an integer between 1 and 20.");
    }
    filters.bhk = bhk;
  }
  if (query.minPrice !== undefined) filters.minPrice = toNumber(query.minPrice, "minPrice");
  if (query.maxPrice !== undefined) filters.maxPrice = toNumber(query.maxPrice, "maxPrice");
  if (
    typeof filters.minPrice === "number" &&
    typeof filters.maxPrice === "number" &&
    filters.minPrice > filters.maxPrice
  ) {
    throw createValidationError("minPrice cannot be greater than maxPrice.");
  }
  if (filters.propertyType && !["rent", "sale"].includes(filters.propertyType)) {
    throw createValidationError("property_type must be rent or sale.");
  }

  return filters;
}

module.exports = {
  normalizePropertyPayload,
  validateImageFiles,
  normalizeStatusPayload,
  normalizeListFilters,
};
