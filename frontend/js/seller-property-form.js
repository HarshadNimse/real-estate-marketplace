const FIELD_IDS = [
  "title",
  "description",
  "price",
  "city",
  "latitude",
  "longitude",
  "propertyType",
  "bhk",
  "areaSqft",
];

function clearFieldErrors() {
  FIELD_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove("border-rose-400");
    const err = el.nextElementSibling;
    if (err?.classList?.contains("field-err")) err.remove();
  });
}

function markFieldError(fieldId, message) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.classList.add("border-rose-400");
  let span = el.nextElementSibling;
  if (!span?.classList?.contains("field-err")) {
    span = document.createElement("span");
    span.className = "field-err mt-1 block text-xs text-rose-600";
    el.insertAdjacentElement("afterend", span);
  }
  span.textContent = message;
}

function collectAmenities() {
  const selected = Array.from(document.querySelectorAll(".amenity-cb:checked")).map(
    (el) => el.value
  );
  const otherRaw = document.getElementById("amenityOther")?.value.trim();
  if (otherRaw) {
    otherRaw.split(",").forEach((item) => {
      const v = item.trim();
      if (v) selected.push(v);
    });
  }
  return JSON.stringify([...new Set(selected)]);
}

function formToPayload() {
  const amenitiesValue = collectAmenities();

  return {
    title: document.getElementById("title").value.trim(),
    description: document.getElementById("description").value.trim(),
    price: document.getElementById("price").value,
    city: document.getElementById("city").value.trim(),
    address_line: document.getElementById("addressLine").value.trim(),
    latitude: document.getElementById("latitude").value,
    longitude: document.getElementById("longitude").value,
    property_type: document.getElementById("propertyType").value,
    bhk: document.getElementById("bhk").value,
    area_sqft: document.getElementById("areaSqft").value,
    furnishing: document.getElementById("furnishing").value,
    amenities: amenitiesValue,
  };
}

function validateForm(payload) {
  clearFieldErrors();
  const errors = [];

  if (!payload.title) errors.push({ field: "title", message: "Title is required." });
  if (!payload.description) errors.push({ field: "description", message: "Description is required." });
  if (!payload.price && payload.price !== 0) errors.push({ field: "price", message: "Price is required." });
  if (!payload.city) errors.push({ field: "city", message: "City is required." });
  if (!payload.latitude) errors.push({ field: "latitude", message: "Latitude is required." });
  if (!payload.longitude) errors.push({ field: "longitude", message: "Longitude is required." });
  if (!payload.property_type) errors.push({ field: "propertyType", message: "Property type is required." });
  if (!payload.area_sqft) errors.push({ field: "areaSqft", message: "Area is required." });

  if (payload.price !== "" && Number(payload.price) < 0) {
    errors.push({ field: "price", message: "Price must be >= 0." });
  }
  if (payload.latitude !== "" && (Number(payload.latitude) < -90 || Number(payload.latitude) > 90)) {
    errors.push({ field: "latitude", message: "Latitude must be between -90 and 90." });
  }
  if (payload.longitude !== "" && (Number(payload.longitude) < -180 || Number(payload.longitude) > 180)) {
    errors.push({ field: "longitude", message: "Longitude must be between -180 and 180." });
  }
  const bhkNum = Number(payload.bhk);
  if (payload.bhk !== "" && (!Number.isInteger(bhkNum) || bhkNum < 1 || bhkNum > 20)) {
    errors.push({ field: "bhk", message: "BHK must be an integer between 1 and 20." });
  }
  const areaNum = Number(payload.area_sqft);
  if (payload.area_sqft !== "" && (!Number.isInteger(areaNum) || areaNum < 100)) {
    errors.push({ field: "areaSqft", message: "Area must be an integer >= 100." });
  }
  try {
    const amenities = JSON.parse(payload.amenities || "[]");
    if (!Array.isArray(amenities)) throw new Error("invalid");
  } catch {
    errors.push({ field: "amenityOther", message: "Amenities could not be parsed." });
  }

  errors.forEach(({ field, message }) => markFieldError(field, message));
  if (errors.length) {
    throw new Error(errors[0].message);
  }
}

function setAmenitiesFromProperty(property) {
  let list = [];
  try {
    list = JSON.parse(property.amenities || "[]");
    if (!Array.isArray(list)) list = [];
  } catch (error) {
    list = [];
  }
  const known = new Set(
    Array.from(document.querySelectorAll(".amenity-cb")).map((el) => el.value)
  );
  const other = [];
  document.querySelectorAll(".amenity-cb").forEach((el) => {
    el.checked = list.includes(el.value);
  });
  list.forEach((item) => {
    if (!known.has(item)) other.push(item);
  });
  const otherEl = document.getElementById("amenityOther");
  if (otherEl) otherEl.value = other.join(", ");
}

function setupImagePreview() {
  const input = document.getElementById("images");
  const dropZone = document.getElementById("dropZone");
  if (!dropZone || !input) return;

  dropZone.addEventListener("click", () => input.click());

  ["dragenter", "dragover"].forEach((evt) =>
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.add("drag-over");
    })
  );
  ["dragleave", "drop"].forEach((evt) =>
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropZone.classList.remove("drag-over");
    })
  );
  dropZone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    const dataTransfer = new DataTransfer();
    Array.from(files).forEach((f) => dataTransfer.items.add(f));
    input.files = dataTransfer.files;
    input.dispatchEvent(new Event("change"));
  });

  input.addEventListener("change", (event) => {
    const preview = document.getElementById("imagePreview");
    preview.innerHTML = "";
    const files = Array.from(event.target.files || []);
    if (files.length > 10) {
      ui.showToast("Maximum 10 images allowed.", "error");
      input.value = "";
      return;
    }
    files.forEach((file, idx) => {
      const url = URL.createObjectURL(file);
      preview.innerHTML += `
        <div class="relative group">
          <img loading="lazy" class="gallery-img h-28 w-full rounded-xl object-cover shadow-sm" src="${url}" alt="preview ${
            idx + 1
          }">
          ${
            idx === 0
              ? '<span class="absolute top-1 left-1 rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white">Primary</span>'
              : ""
          }
        </div>`;
    });
    if (files.length > 0) {
      preview.insertAdjacentHTML(
        "beforeend",
        `<p class="col-span-full text-xs text-slate-500">${files.length} image(s) selected.</p>`
      );
    }
  });
}

function fillForm(property) {
  document.getElementById("title").value = property.title || "";
  document.getElementById("description").value = property.description || "";
  document.getElementById("price").value = property.price || "";
  document.getElementById("city").value = property.city || "";
  document.getElementById("addressLine").value = property.address_line || "";
  document.getElementById("latitude").value = property.latitude || "";
  document.getElementById("longitude").value = property.longitude || "";
  document.getElementById("propertyType").value = property.property_type || "rent";
  document.getElementById("bhk").value = property.bhk || "";
  document.getElementById("areaSqft").value = property.area_sqft || "";
  document.getElementById("furnishing").value = property.furnishing || "unfurnished";
  setAmenitiesFromProperty(property);
}

function renderExistingImages(propertyId, images) {
  const root = document.getElementById("existingImages");
  if (!root) return;
  const e = ui.escapeHtml;
  root.innerHTML = images.length
    ? images
        .map(
          (img) => `
        <div class="relative" data-image-id="${Number(img.id)}">
          <img loading="lazy" class="h-28 w-full rounded-xl object-cover shadow-sm" src="${ui.safeImageSrc(img.image_url)}" alt="existing image">
          ${
            Number(img.is_primary) === 1
              ? '<span class="absolute top-1 left-1 rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-semibold text-white">Primary</span>'
              : ""
          }
          <button type="button" class="delete-existing-img absolute bottom-1 right-1 rounded-lg bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-500" data-img-id="${Number(
            img.id
          )}">Delete</button>
        </div>`
        )
        .join("")
    : `<p class="col-span-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No existing images.</p>`;

  root.querySelectorAll(".delete-existing-img").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const imgId = Number(btn.dataset.imgId);
      if (!imgId || !window.confirm("Delete this image?")) return;
      const prev = btn.textContent;
      btn.disabled = true;
      btn.textContent = "…";
      try {
        const res = await api.request(`/properties/${propertyId}/images/${imgId}`, {
          method: "DELETE",
        });
        renderExistingImages(propertyId, res.data?.images || []);
        ui.showToast("Image deleted.", "success");
      } catch (err) {
        ui.showToast(err.message, "error");
        btn.disabled = false;
        btn.textContent = prev;
      }
    });
  });
}

async function loadEditData(propertyId) {
  const response = await api.request(`/properties/${propertyId}`);
  fillForm(response.data.property);
  renderExistingImages(propertyId, response.data.images || []);
}

async function submitForm(event, propertyId) {
  event.preventDefault();
  const isEdit = Boolean(propertyId);
  const submitBtn = event.target.querySelector("button[type='submit']");
  ui.setMessage("formMessage", "");

  try {
    const payload = formToPayload();
    validateForm(payload);

    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => formData.append(key, value));

    const files = document.getElementById("images").files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => formData.append("images", file));
    }

    submitBtn.disabled = true;
    submitBtn.textContent = isEdit ? "Updating..." : "Creating...";
    ui.setLoading("formLoading", true, isEdit ? "Updating property..." : "Creating property...");

    const endpoint = isEdit ? `/properties/${propertyId}` : "/properties";
    const method = isEdit ? "PUT" : "POST";
    await api.request(endpoint, { method, body: formData });

    ui.showToast(
      isEdit ? "Property updated successfully." : "Property created successfully.",
      "success"
    );
    window.location.href = "./seller-dashboard.html";
  } catch (error) {
    ui.setMessage("formMessage", error.message, true);
    ui.showToast(error.message, "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = isEdit ? "Update Property" : "Create Property";
    ui.setLoading("formLoading", false);
  }
}

(function init() {
  auth.requireAuth(["seller"]);
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    auth.logout("./login.html");
  });
  setupImagePreview();

  const params = new URLSearchParams(window.location.search);
  const propertyId = params.get("id");
  if (propertyId) {
    document.getElementById("pageTitle").textContent = "Edit Property";
    document.getElementById("submitBtn").textContent = "Update Property";
    loadEditData(propertyId).catch((error) => {
      ui.showToast(error.message, "error");
      window.location.href = "./seller-dashboard.html";
    });
  }

  document.getElementById("propertyForm")?.addEventListener("submit", (event) =>
    submitForm(event, propertyId)
  );
})();
