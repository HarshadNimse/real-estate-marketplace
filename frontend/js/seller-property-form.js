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

function validateForm(payload, isEdit) {
  if (
    !payload.title ||
    !payload.description ||
    !payload.price ||
    !payload.city ||
    !payload.latitude ||
    !payload.longitude ||
    !payload.property_type ||
    !payload.bhk ||
    !payload.area_sqft
  ) {
    throw new Error("Please fill all required fields.");
  }

  if (Number(payload.price) < 0) throw new Error("Price must be greater than or equal to 0.");
  if (Number(payload.latitude) < -90 || Number(payload.latitude) > 90) {
    throw new Error("Latitude must be between -90 and 90.");
  }
  if (Number(payload.longitude) < -180 || Number(payload.longitude) > 180) {
    throw new Error("Longitude must be between -180 and 180.");
  }
  if (!Number.isInteger(Number(payload.bhk)) || Number(payload.bhk) < 1 || Number(payload.bhk) > 20) {
    throw new Error("BHK must be an integer between 1 and 20.");
  }
  if (!Number.isInteger(Number(payload.area_sqft)) || Number(payload.area_sqft) < 100) {
    throw new Error("Area (sqft) must be an integer greater than or equal to 100.");
  }
  try {
    const amenities = JSON.parse(payload.amenities || "[]");
    if (!Array.isArray(amenities)) throw new Error("amenities must be array");
  } catch (error) {
    throw new Error("Amenities could not be parsed.");
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
          <img class="gallery-img h-28 w-full rounded-xl object-cover shadow-sm" src="${url}" alt="preview ${
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

async function loadEditData(propertyId) {
  const response = await api.request(`/properties/${propertyId}`);
  fillForm(response.data.property);
  const images = response.data.images || [];
  document.getElementById("existingImages").innerHTML = images.length
    ? images
        .map(
          (img) =>
            `<img class="h-28 w-full rounded-xl object-cover shadow-sm" src="${ui.safeImageSrc(img.image_url)}" alt="existing image">`
        )
        .join("")
    : `<p class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No existing images.</p>`;
}

async function submitForm(event, propertyId) {
  event.preventDefault();
  const isEdit = Boolean(propertyId);
  const submitBtn = event.target.querySelector("button[type='submit']");
  ui.setMessage("formMessage", "");

  try {
    const payload = formToPayload();
    validateForm(payload, isEdit);

    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => formData.append(key, value));
    
    // Add images if any are selected
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
