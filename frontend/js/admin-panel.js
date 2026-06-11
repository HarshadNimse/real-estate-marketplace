const adminState = { limit: 12, offset: 0, total: 0 };
const userState = { limit: 10, offset: 0, total: 0 };

const STAT_IDS = ["statUsers", "statPending", "statProperties", "statInquiries", "statViews"];

function statusBadge(status) {
  const styles =
    status === "approved"
      ? "bg-emerald-100 text-emerald-700"
      : status === "rejected"
      ? "bg-rose-100 text-rose-700"
      : "bg-amber-100 text-amber-700";
  return `<span class="rounded-full px-3 py-1 text-xs font-semibold ${styles}">${ui.escapeHtml(status)}</span>`;
}

function ensureAdminModal() {
  if (document.getElementById("adminPropertyModal")) return;
  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div id="adminPropertyModal" class="fixed inset-0 z-[100] hidden items-center justify-center bg-black/50 p-4">
      <div class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div class="flex items-center justify-between gap-2">
          <h3 id="adminModalTitle" class="text-lg font-semibold text-slate-800">Property details</h3>
          <button type="button" id="adminModalClose" class="rounded-lg px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100">Close</button>
        </div>
        <div id="adminModalBody" class="mt-4 space-y-2 text-sm text-slate-600"></div>
      </div>
    </div>`
  );
  document.getElementById("adminModalClose")?.addEventListener("click", closeAdminModal);
  document.getElementById("adminPropertyModal")?.addEventListener("click", (e) => {
    if (e.target.id === "adminPropertyModal") closeAdminModal();
  });
}

function openAdminModal() {
  ensureAdminModal();
  const modal = document.getElementById("adminPropertyModal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeAdminModal() {
  const modal = document.getElementById("adminPropertyModal");
  modal?.classList.add("hidden");
  modal?.classList.remove("flex");
}

async function viewPropertyDetail(propertyId) {
  ensureAdminModal();
  const body = document.getElementById("adminModalBody");
  const title = document.getElementById("adminModalTitle");
  if (body) body.innerHTML = `<p class="text-indigo-600">Loading...</p>`;
  openAdminModal();
  try {
    const res = await api.request(`/admin/properties/${propertyId}`);
    const { property, images } = res.data;
    const e = ui.escapeHtml;
    if (title) title.textContent = property.title || "Property details";
    if (body) {
      body.innerHTML = `
        <p><strong>Status:</strong> ${e(property.status)}</p>
        <p><strong>Seller:</strong> ${e(property.seller_name)} (${e(property.seller_email)})</p>
        <p><strong>Price:</strong> INR ${Number(property.price).toLocaleString("en-IN")}</p>
        <p><strong>City:</strong> ${e(property.city)}</p>
        <p><strong>Type:</strong> ${e(property.property_type)}${property.bhk ? ` · ${e(property.bhk)} BHK` : ""} · ${e(property.area_sqft)} sqft</p>
        <p><strong>Furnishing:</strong> ${e(property.furnishing)}</p>
        <p class="mt-2"><strong>Description:</strong></p>
        <p class="text-slate-700">${e(property.description)}</p>
        <p class="mt-2"><strong>Images:</strong> ${images?.length || 0}</p>
        ${
          images?.length
            ? `<div class="mt-2 grid grid-cols-2 gap-2">${images
                .map(
                  (img) =>
                    `<img loading="lazy" class="h-24 w-full rounded-lg object-cover" src="${ui.safeImageSrc(img.image_url)}" alt="Property">`
                )
                .join("")}</div>`
            : '<p class="text-slate-500">No images</p>'
        }`;
    }
  } catch (err) {
    if (body) body.innerHTML = `<p class="text-rose-600">${ui.escapeHtml(err.message)}</p>`;
    ui.showToast(err.message, "error");
  }
}

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

    const e = ui.escapeHtml;
    document.getElementById("adminPropertyList").innerHTML = properties.length
      ? properties
          .map(
            (item) => `
            <li class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div class="flex flex-wrap items-center justify-between gap-2"><strong class="text-base font-semibold text-slate-800">${e(item.title)}</strong> ${statusBadge(item.status)}</div>
              <div class="mt-2 text-sm text-slate-600">Seller: ${e(item.seller_name)} (${e(item.seller_email)})</div>
              <div class="mt-1 text-sm text-slate-600">INR ${Number(item.price).toLocaleString("en-IN")} | ${e(item.city)} | ${e(item.property_type)}</div>
              <div class="mt-3 flex flex-wrap gap-2">
                <button type="button" class="admin-view-btn rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100" data-id="${item.id}">View</button>
                <button class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100" data-action="approved" data-id="${item.id}" type="button">Approve</button>
                <button class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100" data-action="rejected" data-id="${item.id}" type="button">Reject</button>
              </div>
            </li>
          `
          )
          .join("")
      : `<li class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">No properties found for selected status.</li>`;
  } catch (error) {
    ui.setMessage("adminMessage", error.message, true);
    ui.showToast(error.message, "error");
  } finally {
    ui.setLoading("adminLoading", false);
  }
}

async function updateStatus(propertyId, status, btn) {
  const oldLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = status === "approved" ? "Approving..." : "Rejecting...";
  try {
    await api.request(`/properties/${propertyId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    ui.showToast(`Property ${status}.`, "success");
    await loadAdminProperties();
  } catch (error) {
    ui.showToast(error.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = oldLabel;
  }
}

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
  const viewBtn = event.target.closest(".admin-view-btn");
  if (viewBtn) {
    const propertyId = Number(viewBtn.dataset.id);
    if (propertyId) await viewPropertyDetail(propertyId);
    return;
  }
  const btn = event.target.closest("button[data-action]");
  if (!btn) return;
  const propertyId = Number(btn.dataset.id);
  const status = btn.dataset.action;
  await updateStatus(propertyId, status, btn);
});

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  auth.logout("./login.html");
});

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
        el.removeAttribute("title");
      }
    });
  } catch (e) {
    STAT_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = "—";
        el.setAttribute("title", "Failed to load");
      }
    });
    console.warn("Failed to load admin stats:", e.message);
  }
}

async function loadUsers() {
  ui.setLoading("userLoading", true, "Loading users...");
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
    const e = ui.escapeHtml;
    ui.setText(
      "userCount",
      `Showing ${users.length.toLocaleString("en-IN")} of ${Number(pagination.total).toLocaleString("en-IN")} users.`
    );
    document.getElementById("userList").innerHTML = users.length
      ? users
          .map(
            (u) => `
          <li class="user-card flex flex-wrap items-center justify-between gap-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <div class="text-sm font-semibold text-slate-800">${e(
                u.full_name
              )} <span class="badge-pill ml-2">${e(u.role)}</span></div>
              <div class="mt-1 text-xs text-slate-500">${e(u.email)} ${
              u.phone ? `| ${e(u.phone)}` : ""
            }</div>
              <div class="mt-1 text-xs text-slate-400">Joined ${new Date(
                u.created_at
              ).toLocaleDateString("en-IN")}</div>
            </div>
            <button type="button" class="toggle-user-btn rounded-full px-4 py-2 text-xs font-semibold transition ${
              u.is_active
                ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }" data-id="${u.id}" data-active="${u.is_active}">${
              u.is_active ? "Deactivate" : "Activate"
            }</button>
          </li>`
          )
          .join("")
      : `<li class="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">No users found.</li>`;
  } catch (e) {
    ui.showToast(e.message, "error");
  } finally {
    ui.setLoading("userLoading", false);
  }
}

document.getElementById("refreshAdmin")?.addEventListener("click", async () => {
  const refreshBtn = document.getElementById("refreshAdmin");
  if (!refreshBtn) return;
  refreshBtn.disabled = true;
  const prevText = refreshBtn.textContent;
  refreshBtn.textContent = "Refreshing...";
  try {
    await loadAdminProperties();
    await loadStats();
    await loadUsers();
    ui.showToast("Dashboard refreshed.", "success");
  } catch (err) {
    ui.showToast(err.message, "error");
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.textContent = prevText;
  }
});

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

(function init() {
  const user = auth.requireAuth(["admin"]);
  if (!user) return;
  ui.setText("adminName", user.full_name);
  loadAdminProperties();
  loadStats();
  loadUsers();
})();
