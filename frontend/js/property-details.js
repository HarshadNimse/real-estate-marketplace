function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    id: params.get("id"),
    slug: params.get("slug"),
  };
}

function renderAmenities(rawAmenities) {
  try {
    const items = typeof rawAmenities === "string" ? JSON.parse(rawAmenities) : rawAmenities;
    if (!Array.isArray(items) || !items.length) return "<li>No amenities listed.</li>";
    return items.map((item) => `<li>${ui.escapeHtml(String(item))}</li>`).join("");
  } catch (error) {
    return "<li>No amenities listed.</li>";
  }
}

async function loadPropertyDetails() {
  ui.setLoading("detailsLoading", true);
  ui.setMessage("detailsMessage", "");

  try {
    const { id, slug } = getParams();
    if (!id && !slug) throw new Error("Property id or slug is required.");
    const endpoint = slug
      ? `/properties/slug/${encodeURIComponent(slug)}`
      : `/properties/${id}`;
    const response = await api.request(endpoint);
    const { property, images } = response.data;

    document.getElementById("propertyTitle").textContent = property.title;
    document.getElementById("propertyPrice").textContent = `INR ${Number(
      property.price
    ).toLocaleString("en-IN")}`;
    document.getElementById("propertyMeta").textContent =
      `${property.city} | ${property.bhk} BHK | ${property.property_type}`;
    document.getElementById("propertyDescription").textContent = property.description;
    document.getElementById("amenitiesList").innerHTML = renderAmenities(property.amenities);

    const ph = ui.PLACEHOLDER_IMAGE;
    document.getElementById("gallery").innerHTML = (images || []).length
      ? images
          .map(
            (img) => {
              const src = ui.safeImageSrc(img.image_url) || ph;
              return `<img class="h-48 w-full rounded-xl object-cover shadow-sm" src="${src}" alt="Property image" onerror="this.onerror=null;this.src='${ph}';">`;
            }
          )
          .join("")
      : `<img class="h-48 w-full rounded-xl object-cover shadow-sm" src="${ph}" alt="No image">`;

    const lat = Number(property.latitude);
    const lng = Number(property.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      document.getElementById("mapFallback").classList.remove("hidden");
      document.getElementById("propertyMap").style.display = "none";
    } else {
      document.getElementById("mapFallback").classList.add("hidden");
      const mapEl = document.getElementById("propertyMap");
      if (mapEl && window.L && !mapEl._leaflet_id) {
        const map = L.map("propertyMap").setView([lat, lng], 15);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
        }).addTo(map);
        L.marker([lat, lng])
          .addTo(map)
          .bindPopup(property.city || "Property location")
          .openPopup();
      }
    }
    document.getElementById("contactForm").dataset.propertyId = property.id;

    const favBtn = document.getElementById("favBtn");
    const currentUser = auth.getUser();
    if (favBtn && currentUser && currentUser.role === "buyer") {
      favBtn.classList.remove("hidden");
      
      // Check if property is already favorited
      try {
        const favRes = await api.request("/favourites");
        const favourites = favRes.data.properties || [];
        const isFavorited = favourites.some(fav => Number(fav.id) === Number(property.id));
        
        // Set initial state
        favBtn.dataset.fav = isFavorited ? "true" : "false";
        favBtn.textContent = isFavorited ? "♥ Saved" : "♡ Save";
        if (isFavorited) {
          favBtn.classList.add("text-rose-600");
        }
      } catch (e) {
        console.warn("Failed to load favourite status:", e.message);
        favBtn.dataset.fav = "false";
      }
      
      favBtn.addEventListener("click", async () => {
        const isFav = favBtn.dataset.fav === "true";
        const method = isFav ? "DELETE" : "POST";
        try {
          await api.request(`/favourites/${property.id}`, { method });
          favBtn.dataset.fav = isFav ? "false" : "true";
          favBtn.textContent = isFav ? "♡ Save" : "♥ Saved";
          favBtn.classList.toggle("text-rose-600", !isFav);
          ui.showToast(
            isFav ? "Removed from favourites." : "Added to favourites.",
            "success"
          );
        } catch (e) {
          ui.showToast(e.message, "error");
        }
      });
    }
  } catch (error) {
    const message = error.status === 404 ? "Property not found." : error.message;
    ui.setMessage("detailsMessage", message, true);
    ui.showToast(message, "error");
  } finally {
    ui.setLoading("detailsLoading", false);
  }
}

document.getElementById("contactForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  ui.setMessage("contactMessage", "");
  ui.setLoading("contactLoading", true, "Sending inquiry...");
  const submitBtn = event.target.querySelector("button[type='submit']");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
  }

  const user = auth.getCurrentUser();
  if (!user) {
    ui.setMessage("contactMessage", "Please login as buyer to send inquiry.", true);
    ui.setLoading("contactLoading", false);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Inquiry";
    }
    return;
  }
  if (user.role !== "buyer") {
    ui.setMessage("contactMessage", "Only buyers can contact owner.", true);
    ui.setLoading("contactLoading", false);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Inquiry";
    }
    return;
  }

  try {
    const propertyId = Number(document.getElementById("contactForm").dataset.propertyId);
    const message = document.getElementById("inquiryMessage").value.trim();
    const contact_phone = document.getElementById("inquiryPhone").value.trim();
    await api.request("/inquiries", {
      method: "POST",
      body: JSON.stringify({ property_id: propertyId, message, contact_phone }),
    });
    ui.setMessage("contactMessage", "Inquiry sent successfully.", false);
    ui.showToast("Inquiry sent successfully.", "success");
    document.getElementById("contactForm").reset();
  } catch (error) {
    ui.setMessage("contactMessage", error.message, true);
    ui.showToast(error.message, "error");
  } finally {
    ui.setLoading("contactLoading", false);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Inquiry";
    }
  }
});

loadPropertyDetails();
