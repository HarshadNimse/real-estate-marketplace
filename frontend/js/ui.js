let activeToast = null;

const PLACEHOLDER_IMAGE = "https://placehold.co/600x400?text=No+Image";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeImageSrc(url) {
  const u = String(url || "").trim();
  if (/^https:\/\//i.test(u) || /^http:\/\//i.test(u)) return u;
  return PLACEHOLDER_IMAGE;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setMessage(id, message, isError) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message || "";
  el.className = `mt-2 text-sm ${isError ? "text-rose-600" : "text-emerald-600"}`;
}

function setLoading(id, isLoading, label = "Loading...") {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = isLoading ? label : "";
  el.className = "mt-2 text-sm text-indigo-600";
}

function showToast(message, type = "success") {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "fixed right-4 top-4 z-[9999] grid gap-2";
    document.body.appendChild(container);
  }

  if (activeToast) {
    activeToast.remove();
    activeToast = null;
  }

  const toast = document.createElement("div");
  const palette = {
    success: "bg-emerald-600",
    error: "bg-rose-600",
    info: "bg-indigo-600",
  };
  toast.className = `toast-animate rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg ${palette[type] || palette.info}`;
  toast.textContent = message;
  container.appendChild(toast);
  activeToast = toast;

  setTimeout(() => {
    toast.classList.add("hide");
    setTimeout(() => {
      toast.remove();
      if (activeToast === toast) {
        activeToast = null;
      }
    }, 250);
  }, 2600);
}

function propertyCard(item) {
  const image = safeImageSrc(item.primary_image_url);
  const slugUrl = `./property.html?slug=${encodeURIComponent(item.slug || "")}`;
  return `
    <article class="property-card group overflow-hidden rounded-xl bg-white shadow-md transition duration-300 hover:scale-[1.02] hover:shadow-lg">
      <img src="${image}" alt="${escapeHtml(item.title)}" class="h-48 w-full object-cover" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}';" />
      <div class="space-y-2 p-4">
        <h3 class="line-clamp-1 text-lg font-semibold text-slate-800">${escapeHtml(item.title)}</h3>
        <p class="text-xl font-bold text-purple-700">INR ${Number(item.price).toLocaleString("en-IN")}</p>
        <p class="text-sm text-slate-600">${escapeHtml(item.city)}</p>
        <div class="flex flex-wrap gap-2">
          <span class="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">${escapeHtml(item.bhk)} BHK</span>
          <span class="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">${escapeHtml(item.property_type)}</span>
        </div>
        <div class="flex items-center justify-between gap-2">
          <a class="inline-flex items-center rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90" href="${slugUrl}">View Details</a>
          <button type="button" class="list-fav-btn rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-300 hover:text-rose-600" data-property-id="${Number(
            item.id
          )}">♡ Save</button>
        </div>
      </div>
    </article>
  `;
}

window.ui = {
  setText,
  setMessage,
  setLoading,
  showToast,
  propertyCard,
  escapeHtml,
  safeImageSrc,
  PLACEHOLDER_IMAGE,
};
