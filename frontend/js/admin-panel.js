const adminState = { limit: 12, offset: 0, total: 0 };
const userState = { limit: 10, offset: 0, total: 0 };
let currentReviewId = null;

function statusBadge(status) {
  const styles =
    status === "approved"
      ? "bg-emerald-100 text-emerald-700"
      : status === "rejected"
      ? "bg-rose-100 text-rose-700"
      : "bg-amber-100 text-amber-700";
  return `<span class="rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles}">${ui.escapeHtml(status)}</span>`;
}

// ==========================================
// TAB NAVIGATION SYSTEM
// ==========================================
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    // Remove active styles from all buttons
    document.querySelectorAll(".tab-btn").forEach((t) => {
      t.classList.remove("border-indigo-600", "text-indigo-600");
      t.classList.add("border-transparent", "text-slate-500");
    });
    // Add active styles to clicked button
    btn.classList.add("border-indigo-600", "text-indigo-600");
    btn.classList.remove("border-transparent", "text-slate-500");

    // Hide all panels
    document.querySelectorAll(".tab-panel").forEach((panel) => {
      panel.classList.add("hidden");
    });
    // Show clicked panel
    const tabId = btn.dataset.tab;
    const targetPanel = document.getElementById(`tabPanel${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
    if (targetPanel) {
      targetPanel.classList.remove("hidden");
    }
  });
});

// ==========================================
// PERSIST SYSTEM SETTINGS
// ==========================================
async function loadSettings() {
  try {
    const res = await api.request("/admin/settings");
    if (res.success && res.data) {
      const commissionInput = document.getElementById("commissionInput");
      if (commissionInput) {
        commissionInput.value = res.data.platform_commission || "5.0";
      }
    }
  } catch (error) {
    console.warn("Failed to load settings:", error.message);
  }
}

document.getElementById("saveSettingsBtn")?.addEventListener("click", async () => {
  const btn = document.getElementById("saveSettingsBtn");
  const val = document.getElementById("commissionInput").value.trim();
  const prevLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Saving...";
  try {
    await api.request("/admin/settings", {
      method: "PUT",
      body: JSON.stringify({ platform_commission: val }),
    });
    ui.showToast("Settings saved successfully.", "success");
  } catch (error) {
    ui.showToast(error.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = prevLabel;
  }
});

// ==========================================
// PROPERTY MODERATION & REVIEW MODAL
// ==========================================
async function loadAdminProperties() {
  ui.setLoading("adminLoading", true);
  ui.setMessage("adminMessage", "");

  try {
    const status = document.getElementById("statusFilter").value;
    const query = api.buildQuery({
      status,
      limit: adminState.limit,
      offset: adminState.offset,
    });
    const response = await api.request(`/properties/admin/all?${query}`);
    const { properties, pagination } = response.data;
    adminState.total = pagination.total;

    // Update pagination info text
    const startIdx = adminState.offset + 1;
    const endIdx = Math.min(adminState.offset + adminState.limit, adminState.total);
    const pagInfo = document.getElementById("propsPaginationInfo");
    if (pagInfo) {
      pagInfo.textContent = properties.length
        ? `Showing ${startIdx}-${endIdx} of ${adminState.total} properties`
        : "No properties listed";
    }

    const e = ui.escapeHtml;
    document.getElementById("adminPropertyList").innerHTML = properties.length
      ? properties
          .map(
            (item) => `
            <li class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div class="flex items-start justify-between gap-2">
                  <strong class="text-base font-bold text-slate-800 line-clamp-1 cursor-pointer hover:text-indigo-600 block-title" data-id="${item.id}">${e(item.title)}</strong>
                  ${statusBadge(item.status)}
                </div>
                <div class="mt-2 text-xs text-slate-500">Seller: ${e(item.seller_name)}</div>
                <div class="mt-1 text-xs text-slate-500">${e(item.city)} | INR ${Number(item.price).toLocaleString("en-IN")}</div>
              </div>
              <div class="mt-4 flex gap-2">
                <button class="flex-1 rounded-xl border border-indigo-200 bg-indigo-50 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 review-details-btn" data-id="${item.id}" type="button">Review Details</button>
                ${item.status === 'pending' ? `
                  <button class="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 accept-btn" data-id="${item.id}" type="button">Approve</button>
                ` : ""}
              </div>
            </li>
          `
          )
          .join("")
      : `<li class="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">No properties found for the selected status.</li>`;
  } catch (error) {
    ui.setMessage("adminMessage", error.message, true);
    ui.showToast(error.message, "error");
  } finally {
    ui.setLoading("adminLoading", false);
  }
}

// Modal open/close controls
async function openReviewModal(propertyId) {
  currentReviewId = propertyId;
  const modal = document.getElementById("reviewModal");
  const mLoading = document.getElementById("modalLoading");
  const mContent = document.getElementById("modalContent");

  modal.classList.remove("hidden");
  mLoading.classList.remove("hidden");
  mContent.classList.add("hidden");

  try {
    const res = await api.request(`/admin/properties/${propertyId}`);
    const { property, images } = res.data;

    document.getElementById("modalTitle").textContent = property.title;
    document.getElementById("modalPrice").textContent = `INR ${Number(property.price).toLocaleString("en-IN")}`;
    document.getElementById("modalMeta").innerHTML = `
      <span class="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-semibold">${ui.escapeHtml(property.city)}</span>
      <span class="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold">${property.bhk} BHK</span>
      <span class="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold">${ui.escapeHtml(property.property_type.toUpperCase())}</span>
      <span class="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold">${property.area_sqft} Sqft</span>
      ${statusBadge(property.status)}
    `;

    document.getElementById("modalDescription").textContent = property.description;

    // Render amenities
    let rawAmenities = [];
    try {
      rawAmenities = typeof property.amenities === "string" ? JSON.parse(property.amenities) : property.amenities;
    } catch (_) {}
    document.getElementById("modalAmenities").innerHTML = Array.isArray(rawAmenities) && rawAmenities.length
      ? rawAmenities.map(a => `<li>${ui.escapeHtml(a)}</li>`).join("")
      : "<li class='text-slate-400 list-none'>No amenities listed</li>";

    // Render gallery images
    const ph = ui.PLACEHOLDER_IMAGE;
    document.getElementById("modalGallery").innerHTML = (images || []).length
      ? images.map(img => `
          <img class="h-24 w-full rounded-xl object-cover border border-slate-200 shadow-sm" src="${ui.safeImageSrc(img.image_url) || ph}" onerror="this.src='${ph}'" alt="Property image">
        `).join("")
      : `<img class="h-24 w-full rounded-xl object-cover border border-slate-200 shadow-sm" src="${ph}" alt="No image">`;

    // Seller Info
    document.getElementById("modalSeller").innerHTML = `
      <p><strong>Name:</strong> ${ui.escapeHtml(property.seller_name || "Unknown")}</p>
      <p><strong>Email:</strong> ${ui.escapeHtml(property.seller_email || "-")}</p>
      <p><strong>Phone:</strong> ${ui.escapeHtml(property.phone || "-")}</p>
    `;

    // Rejection / Approval buttons in modal
    const approveBtn = document.getElementById("modalApproveBtn");
    const rejectBtn = document.getElementById("modalRejectBtn");

    if (property.status === "approved") {
      approveBtn.classList.add("hidden");
      rejectBtn.classList.remove("hidden");
    } else if (property.status === "rejected") {
      approveBtn.classList.remove("hidden");
      rejectBtn.classList.add("hidden");
    } else {
      approveBtn.classList.remove("hidden");
      rejectBtn.classList.remove("hidden");
    }

    mLoading.classList.add("hidden");
    mContent.classList.remove("hidden");
  } catch (error) {
    ui.showToast("Failed to load details: " + error.message, "error");
    closeReviewModal();
  }
}

function closeModal() {
  document.getElementById("reviewModal").classList.add("hidden");
  currentReviewId = null;
}

document.getElementById("closeModalBtn")?.addEventListener("click", closeModal);

// Modal actions
document.getElementById("modalApproveBtn")?.addEventListener("click", async () => {
  if (!currentReviewId) return;
  const btn = document.getElementById("modalApproveBtn");
  btn.disabled = true;
  try {
    await updateStatus(currentReviewId, "approved", btn);
    closeModal();
  } catch (_) {} finally {
    btn.disabled = false;
  }
});

document.getElementById("modalRejectBtn")?.addEventListener("click", async () => {
  if (!currentReviewId) return;
  const btn = document.getElementById("modalRejectBtn");
  btn.disabled = true;
  try {
    await updateStatus(currentReviewId, "rejected", btn);
    closeModal();
  } catch (_) {} finally {
    btn.disabled = false;
  }
});

async function updateStatus(propertyId, status, btn) {
  const oldLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = status === "approved" ? "Approving..." : "Rejecting...";
  try {
    await api.request(`/properties/${propertyId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    ui.showToast(`Property status updated to ${status}.`, "success");
    await loadAdminProperties();
    await loadStats(); // Reload stats as pending count changes!
  } catch (error) {
    ui.showToast(error.message, "error");
    throw error;
  } finally {
    btn.disabled = false;
    btn.textContent = oldLabel;
  }
}

// Dashboard interactions
document.getElementById("statusFilter")?.addEventListener("change", () => {
  adminState.offset = 0;
  loadAdminProperties();
});

document.getElementById("adminPrev")?.addEventListener("click", () => {
  if (adminState.offset === 0) return;
  adminState.offset = Math.max(0, adminState.offset - adminState.limit);
  loadAdminProperties();
});

document.getElementById("adminNext")?.addEventListener("click", () => {
  if (adminState.offset + adminState.limit >= adminState.total) return;
  adminState.offset += adminState.limit;
  loadAdminProperties();
});

document.getElementById("adminPropertyList")?.addEventListener("click", async (event) => {
  const reviewBtn = event.target.closest(".review-details-btn");
  const blockTitle = event.target.closest(".block-title");
  const acceptBtn = event.target.closest(".accept-btn");

  if (reviewBtn) {
    openReviewModal(Number(reviewBtn.dataset.id));
  } else if (blockTitle) {
    openReviewModal(Number(blockTitle.dataset.id));
  } else if (acceptBtn) {
    await updateStatus(Number(acceptBtn.dataset.id), "approved", acceptBtn);
  }
});

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  auth.logout("./login.html");
});

// ==========================================
// ADMIN DASHBOARD STATISTICS
// ==========================================
async function loadStats() {
  try {
    const res = await api.request("/admin/stats");
    const stats = res.data;
    const statElements = {
      statUsers: stats.totalUsers,
      statPending: stats.pendingProperties,
      statProperties: stats.totalProperties,
      statInquiries: stats.totalInquiries,
      statViews: stats.totalViews ?? 0,
    };
    Object.entries(statElements).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = Number(value || 0).toLocaleString("en-IN");
      }
    });
  } catch (e) {
    console.warn("Failed to load admin stats:", e.message);
  }
}

// ==========================================
// USER ACCOUNTS MANAGEMENT
// ==========================================
async function loadUsers() {
  ui.setLoading("userLoading", true);
  try {
    const role = document.getElementById("roleFilter")?.value || "";
    const search = document.getElementById("userSearch")?.value.trim() || "";
    const q = api.buildQuery({
      role,
      search,
      limit: userState.limit,
      offset: userState.offset,
    });
    const res = await api.request(`/admin/users?${q}`);
    const { users, pagination } = res.data;
    userState.total = pagination.total;

    const startIdx = userState.offset + 1;
    const endIdx = Math.min(userState.offset + userState.limit, userState.total);
    const pagInfo = document.getElementById("usersPaginationInfo");
    if (pagInfo) {
      pagInfo.textContent = users.length
        ? `Showing ${startIdx}-${endIdx} of ${userState.total} users`
        : "No users found";
    }

    const e = ui.escapeHtml;
    document.getElementById("userList").innerHTML = users.length
      ? users
          .map(
            (u) => `
          <li class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <div class="text-sm font-semibold text-slate-800">${e(u.full_name)} 
                <span class="ml-1.5 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">${e(u.role)}</span>
                ${Number(u.email_verified) ? '<span class="ml-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">Verified</span>' : ""}
              </div>
              <div class="mt-1 text-xs text-slate-500">${e(u.email)} ${u.phone ? `| ${e(u.phone)}` : ""}</div>
              <div class="mt-1 text-[10px] text-slate-400">Registered on ${new Date(u.created_at).toLocaleDateString("en-IN")}</div>
            </div>
            <button type="button" class="toggle-user-btn rounded-xl px-4 py-2 text-xs font-semibold transition ${
              u.is_active
                ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }" data-id="${u.id}" data-active="${u.is_active}">${
              u.is_active ? "Deactivate" : "Activate"
            }</button>
          </li>`
          )
          .join("")
      : `<li class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">No users found matching search query.</li>`;
  } catch (e) {
    ui.showToast(e.message, "error");
  } finally {
    ui.setLoading("userLoading", false);
  }
}

document.getElementById("userList")?.addEventListener("click", async (event) => {
  const btn = event.target.closest(".toggle-user-btn");
  if (!btn) return;
  const userId = Number(btn.dataset.id);
  const prev = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Updating...";
  try {
    const res = await api.request(`/admin/users/${userId}/toggle-status`, {
      method: "PATCH",
    });
    ui.showToast(res.message, "success");
    await loadUsers();
    await loadStats(); // Reload stats in case active counts change
  } catch (e) {
    ui.showToast(e.message, "error");
    btn.disabled = false;
    btn.textContent = prev;
  }
});

let userSearchTimer;
document.getElementById("userSearch")?.addEventListener("input", () => {
  clearTimeout(userSearchTimer);
  userSearchTimer = setTimeout(() => {
    userState.offset = 0;
    loadUsers();
  }, 400);
});

document.getElementById("roleFilter")?.addEventListener("change", () => {
  userState.offset = 0;
  loadUsers();
});

document.getElementById("userPrev")?.addEventListener("click", () => {
  if (userState.offset === 0) return;
  userState.offset = Math.max(0, userState.offset - userState.limit);
  loadUsers();
});

document.getElementById("userNext")?.addEventListener("click", () => {
  if (userState.offset + userState.limit >= userState.total) return;
  userState.offset += userState.limit;
  loadUsers();
});

// ==========================================
// INITIALIZER
// ==========================================
(function init() {
  const user = auth.requireAuth(["admin"]);
  if (!user) return;
  ui.setText("adminName", user.full_name);
  loadAdminProperties();
  loadStats();
  loadUsers();
  loadSettings();
})();
