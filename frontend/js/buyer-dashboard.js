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
  loadBuyerInquiries();
})();
