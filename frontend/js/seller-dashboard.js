const sellerState = { limit: 10, offset: 0, total: 0 };
const sellerPropsState = { limit: 8, offset: 0, total: 0 };

function sellerInquiryActions(item) {
  const chatButton = `<button type="button" class="seller-chat-inquiry rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100" data-inquiry-id="${item.id}" data-title="${ui.escapeHtml(item.property_title)}" data-buyer="${ui.escapeHtml(item.buyer_name)}" data-status="${item.status}">Chat</button>`;
  if (item.status === "closed") {
    return `<div class="mt-3 flex flex-wrap gap-2">${chatButton}</div>`;
  }
  if (item.status === "open") {
    return `
    <div class="mt-3 flex flex-wrap gap-2">
      ${chatButton}
      <button type="button" class="seller-inquiry-action rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100" data-inquiry-id="${item.id}" data-next-status="responded">Mark responded</button>
      <button type="button" class="seller-inquiry-action rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50" data-inquiry-id="${item.id}" data-next-status="closed">Close</button>
    </div>`;
  }
  if (item.status === "responded") {
    return `
    <div class="mt-3 flex flex-wrap gap-2">
      ${chatButton}
      <button type="button" class="seller-inquiry-action rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50" data-inquiry-id="${item.id}" data-next-status="closed">Close</button>
    </div>`;
  }
  return "";
}

async function loadMyProperties() {
  ui.setLoading("sellerPropsLoading", true);
  try {
    const query = api.buildQuery({
      limit: sellerPropsState.limit,
      offset: sellerPropsState.offset,
    });
    const response = await api.request(`/properties/mine?${query}`);
    const properties = response.data.properties || [];
    sellerPropsState.total = Number(response.data.pagination?.total || properties.length);
    const e = ui.escapeHtml;
    document.getElementById("myProperties").innerHTML = properties.length
      ? properties
          .map(
            (item) => `
              <li class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <strong class="text-base font-semibold text-slate-800">${e(item.title)}</strong>
                  <span class="rounded-full px-3 py-1 text-xs font-semibold ${
                    item.status === "approved"
                      ? "bg-emerald-100 text-emerald-700"
                      : item.status === "rejected"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-amber-100 text-amber-700"
                  }">${e(item.status)}</span>
                </div>
                <div class="mt-2 text-sm text-slate-600">INR ${Number(item.price).toLocaleString("en-IN")} | ${e(item.city)}</div>
                <div class="mt-3 flex flex-wrap gap-2">
                  <a class="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50" href="./seller-property-form.html?id=${Number(item.id)}">Edit</a>
                  <button class="delete-property-btn rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-500" type="button" data-id="${Number(item.id)}">Delete</button>
                </div>
              </li>`
          )
          .join("")
      : `<li class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">No properties posted yet. Create your first listing to get started.</li>`;
  } catch (error) {
    ui.setMessage("sellerMessage", error.message, true);
    ui.showToast(error.message, "error");
  } finally {
    ui.setLoading("sellerPropsLoading", false);
  }
}

document.getElementById("propsPrev")?.addEventListener("click", () => {
  if (sellerPropsState.offset === 0) return;
  sellerPropsState.offset = Math.max(0, sellerPropsState.offset - sellerPropsState.limit);
  loadMyProperties();
});

document.getElementById("propsNext")?.addEventListener("click", () => {
  if (sellerPropsState.offset + sellerPropsState.limit >= sellerPropsState.total) return;
  sellerPropsState.offset += sellerPropsState.limit;
  loadMyProperties();
});

async function loadSellerInquiries() {
  ui.setLoading("sellerInboxLoading", true);
  try {
    const query = api.buildQuery({
      limit: sellerState.limit,
      offset: sellerState.offset,
    });
    const response = await api.request(`/inquiries/seller?${query}`);
    const { inquiries, pagination } = response.data;
    sellerState.total = pagination.total;
    const e = ui.escapeHtml;
    document.getElementById("sellerInbox").innerHTML = inquiries.length
      ? inquiries
          .map(
            (item) => `
              <li class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <strong class="text-base font-semibold text-slate-800">${e(item.property_title)}</strong>
                  <span class="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">${e(item.status)}</span>
                </div>
                <div class="mt-2 text-sm text-slate-600">Buyer: ${e(item.buyer_name)} | ${e(item.buyer_email)} | ${e(item.buyer_phone || "-")}</div>
                <div class="mt-2 text-sm text-slate-700">Message: ${e(item.message)}</div>
                ${sellerInquiryActions(item)}
              </li>`
          )
          .join("")
      : `<li class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">No inquiries received yet. Once buyers contact your listings, they will appear here.</li>`;
  } catch (error) {
    ui.setMessage("sellerMessage", error.message, true);
    ui.showToast(error.message, "error");
  } finally {
    ui.setLoading("sellerInboxLoading", false);
  }
}

document.getElementById("sellerInbox")?.addEventListener("click", async (event) => {
  const btn = event.target.closest(".seller-inquiry-action");
  const chatBtn = event.target.closest(".seller-chat-inquiry");

  if (chatBtn) {
    const inquiryId = Number(chatBtn.dataset.inquiryId);
    const title = chatBtn.dataset.title;
    const buyer = chatBtn.dataset.buyer;
    const status = chatBtn.dataset.status;
    openChatModal(inquiryId, title, buyer, status);
    return;
  }

  if (!btn) return;
  const inquiryId = Number(btn.dataset.inquiryId);
  const nextStatus = btn.dataset.nextStatus;
  if (!inquiryId || !nextStatus) return;

  const prev = btn.textContent;
  btn.disabled = true;
  btn.textContent = nextStatus === "responded" ? "Updating..." : "Closing...";
  try {
    await api.request(`/inquiries/${inquiryId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus }),
    });
    ui.showToast(nextStatus === "responded" ? "Marked as responded." : "Inquiry closed.", "success");
    await loadSellerInquiries();
  } catch (error) {
    ui.showToast(error.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = prev;
  }
});

let activeInquiryId = null;
let chatInterval = null;
let activeInquiryStatus = null;

function openChatModal(inquiryId, title, secondPartyName, status) {
  activeInquiryId = inquiryId;
  activeInquiryStatus = status;
  
  const modal = document.getElementById("chatModal");
  document.getElementById("chatTitle").textContent = title;
  document.getElementById("chatSubtitle").textContent = `Chatting with buyer: ${secondPartyName}`;
  
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  
  if (status === "closed") {
    chatInput.disabled = true;
    chatInput.placeholder = "Inquiry is closed. Read-only history.";
    chatForm.querySelector("button[type='submit']").disabled = true;
  } else {
    chatInput.disabled = false;
    chatInput.placeholder = "Type your message...";
    chatForm.querySelector("button[type='submit']").disabled = false;
  }
  
  modal.classList.remove("hidden");
  
  loadChatMessages();
  clearInterval(chatInterval);
  chatInterval = setInterval(loadChatMessages, 4000);
}

function closeChatModal() {
  document.getElementById("chatModal").classList.add("hidden");
  activeInquiryId = null;
  clearInterval(chatInterval);
}

document.getElementById("closeChatBtn")?.addEventListener("click", closeChatModal);

async function loadChatMessages() {
  if (!activeInquiryId) return;
  try {
    const res = await api.request(`/inquiries/${activeInquiryId}/messages`);
    const messages = res.data.messages || [];
    const chatContainer = document.getElementById("chatMessages");
    const e = ui.escapeHtml;
    const currentUser = auth.getUser();
    
    chatContainer.innerHTML = messages.length
      ? messages.map(msg => {
          const isMe = Number(msg.sender_id) === Number(currentUser.id);
          const alignClass = isMe ? "justify-end" : "justify-start";
          const bgClass = isMe ? "bg-indigo-600 text-white rounded-br-none" : "bg-slate-200 text-slate-800 rounded-bl-none";
          return `
            <div class="flex ${alignClass}">
              <div class="max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${bgClass}">
                ${isMe ? "" : `<div class="text-[10px] font-semibold opacity-75 mb-1">${e(msg.sender_name)}</div>`}
                <div class="break-words">${e(msg.message)}</div>
                <div class="text-[9px] text-right mt-1 opacity-60">${new Date(msg.created_at).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          `;
        }).join("")
      : `<div class="text-center py-8 text-xs text-slate-400">No messages yet. Send a message to start the conversation!</div>`;
      
    chatContainer.scrollTop = chatContainer.scrollHeight;
  } catch (err) {
    console.error("Failed to load messages:", err.message);
  }
}

document.getElementById("chatForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!activeInquiryId || activeInquiryStatus === "closed") return;
  
  const input = document.getElementById("chatInput");
  const msgText = input.value.trim();
  if (!msgText) return;
  
  const submitBtn = event.target.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  input.disabled = true;
  
  try {
    await api.request(`/inquiries/${activeInquiryId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message: msgText }),
    });
    input.value = "";
    await loadChatMessages();
    
    if (window.loadSellerInquiries) loadSellerInquiries();
  } catch (err) {
    ui.showToast(err.message, "error");
  } finally {
    submitBtn.disabled = false;
    input.disabled = false;
    input.focus();
  }
});

document.getElementById("sellerPrev")?.addEventListener("click", () => {
  if (sellerState.offset === 0) return;
  sellerState.offset = Math.max(0, sellerState.offset - sellerState.limit);
  loadSellerInquiries();
});

document.getElementById("sellerNext")?.addEventListener("click", () => {
  if (sellerState.offset + sellerState.limit >= sellerState.total) return;
  sellerState.offset += sellerState.limit;
  loadSellerInquiries();
});

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  auth.logout("./login.html");
});

document.getElementById("myProperties")?.addEventListener("click", async (event) => {
  const btn = event.target.closest(".delete-property-btn");
  if (!btn) return;
  const propertyId = Number(btn.dataset.id);
  if (!propertyId) return;
  if (!window.confirm("Are you sure you want to delete this property?")) return;

  const previousLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Deleting...";
  try {
    await api.request(`/properties/${propertyId}`, { method: "DELETE" });
    ui.showToast("Property deleted successfully.", "success");
    await loadMyProperties();
  } catch (error) {
    ui.showToast(error.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = previousLabel;
  }
});

(function init() {
  const user = auth.requireAuth(["seller"]);
  if (!user) return;
  ui.setText("sellerName", user.full_name);
  loadMyProperties();
  loadSellerInquiries();
})();
