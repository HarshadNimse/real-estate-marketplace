const buyerState = { limit: 10, offset: 0, total: 0 };

function buyerInquiryActions(item) {
  if (item.status === "closed") return "";
  return `
    <div class="mt-3 flex flex-wrap gap-2">
      <button type="button" class="buyer-close-inquiry rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50" data-inquiry-id="${item.id}">Close inquiry</button>
    </div>`;
}

async function loadBuyerInquiries() {
  ui.setLoading("buyerLoading", true);
  ui.setMessage("buyerMessage", "");
  try {
    const query = api.buildQuery({
      limit: buyerState.limit,
      offset: buyerState.offset,
    });
    const response = await api.request(`/inquiries/buyer?${query}`);
    const { inquiries, pagination } = response.data;
    buyerState.total = pagination.total;
    ui.setText("buyerStatInquiries", Number(pagination.total || 0).toLocaleString("en-IN"));

    const e = ui.escapeHtml;
    document.getElementById("buyerInquiryList").innerHTML = inquiries.length
      ? inquiries
          .map(
            (item) => `
              <li class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" data-inquiry-id="${item.id}">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <strong class="text-base font-semibold text-slate-800">${e(item.property_title)}</strong>
                  <span class="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">${e(item.status)}</span>
                </div>
                <div class="mt-2 text-sm text-slate-600">Seller: ${e(item.seller_name)} | ${e(item.seller_email)} | ${e(item.seller_phone || "-")}</div>
                <div class="mt-2 text-sm text-slate-700">Message: ${e(item.message)}</div>
                ${buyerInquiryActions(item)}
              </li>`
          )
          .join("")
      : `<li class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">No inquiries found. Start by contacting an owner from a property page.</li>`;
  } catch (error) {
    ui.setMessage("buyerMessage", error.message, true);
    ui.showToast(error.message, "error");
  } finally {
    ui.setLoading("buyerLoading", false);
  }
}

function renderSavedProperties(properties) {
  const root = document.getElementById("buyerSavedProperties");
  if (!root) return;
  const e = ui.escapeHtml;
  root.innerHTML = properties.length
    ? properties
        .map(
          (item) => `
            <article class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <img loading="lazy" class="h-40 w-full object-cover" src="${ui.safeImageSrc(
                item.primary_image_url
              )}" alt="${e(item.title)}" onerror="this.onerror=null;this.src='${ui.PLACEHOLDER_IMAGE}';" />
              <div class="space-y-2 p-4">
                <h4 class="line-clamp-1 font-semibold text-slate-800">${e(item.title)}</h4>
                <p class="text-sm text-slate-500">${e(item.city)} | ${e(item.property_type)}</p>
                <p class="font-semibold text-indigo-700">INR ${Number(item.price).toLocaleString("en-IN")}</p>
                <div class="flex flex-wrap gap-2">
                  <a class="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500" href="./property.html?slug=${encodeURIComponent(
                    item.slug || ""
                  )}">View details</a>
                  <button type="button" class="buyer-remove-saved rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50" data-property-id="${Number(
                    item.id
                  )}">Remove</button>
                </div>
              </div>
            </article>`
        )
        .join("")
    : `<p class="col-span-full rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">No saved properties yet. Save listings from the home or property details page.</p>`;
}

async function loadSavedProperties() {
  ui.setLoading("buyerSavedLoading", true, "Loading saved properties...");
  try {
    const response = await api.request("/favourites");
    const properties = Array.isArray(response.data?.properties) ? response.data.properties : [];
    ui.setText("buyerStatSaved", properties.length.toLocaleString("en-IN"));
    renderSavedProperties(properties);
  } catch (error) {
    ui.setText("buyerStatSaved", "—");
    ui.setMessage("buyerSavedMessage", error.message, true);
  } finally {
    ui.setLoading("buyerSavedLoading", false);
  }
}

document.getElementById("buyerInquiryList")?.addEventListener("click", async (event) => {
  const btn = event.target.closest(".buyer-close-inquiry");
  if (!btn) return;
  const inquiryId = Number(btn.dataset.inquiryId);
  if (!inquiryId) return;
  if (!window.confirm("Close this inquiry?")) return;

  const prev = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Closing...";
  try {
    await api.request(`/inquiries/${inquiryId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "closed" }),
    });
    ui.showToast("Inquiry closed.", "success");
    await loadBuyerInquiries();
  } catch (error) {
    ui.showToast(error.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = prev;
  }
});

document.getElementById("buyerSavedProperties")?.addEventListener("click", async (event) => {
  const btn = event.target.closest(".buyer-remove-saved");
  if (!btn) return;
  const propertyId = Number(btn.dataset.propertyId);
  if (!propertyId) return;

  btn.disabled = true;
  btn.textContent = "Removing...";
  try {
    await api.request(`/favourites/${propertyId}`, { method: "DELETE" });
    ui.showToast("Removed from saved properties.", "success");
    await loadSavedProperties();
  } catch (error) {
    btn.disabled = false;
    btn.textContent = "Remove";
    ui.showToast(error.message, "error");
  }
});

document.getElementById("buyerPrev")?.addEventListener("click", () => {
  if (buyerState.offset === 0) return;
  buyerState.offset = Math.max(0, buyerState.offset - buyerState.limit);
  loadBuyerInquiries();
});

document.getElementById("buyerNext")?.addEventListener("click", () => {
  if (buyerState.offset + buyerState.limit >= buyerState.total) return;
  buyerState.offset += buyerState.limit;
  loadBuyerInquiries();
});

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  auth.logout("./login.html");
});

(function init() {
  const user = auth.requireAuth(["buyer"]);
  if (!user) return;
  ui.setText("buyerName", user.full_name);
  ui.setText("buyerStatViews", "—");
  loadBuyerInquiries();
  loadSavedProperties();
})();
