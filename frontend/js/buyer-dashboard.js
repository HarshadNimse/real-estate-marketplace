const buyerState = { limit: 10, offset: 0, total: 0 };

function buyerInquiryActions(item) {
  const chatButton = `<button type="button" class="buyer-chat-inquiry rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100" data-inquiry-id="${item.id}" data-title="${ui.escapeHtml(item.property_title)}" data-seller="${ui.escapeHtml(item.seller_name)}" data-status="${item.status}">Chat</button>`;
  if (item.status === "closed") return `<div class="mt-3 flex flex-wrap gap-2">${chatButton}</div>`;
  return `
    <div class="mt-3 flex flex-wrap gap-2">
      ${chatButton}
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
  const closeBtn = event.target.closest(".buyer-close-inquiry");
  const chatBtn = event.target.closest(".buyer-chat-inquiry");

  if (chatBtn) {
    const inquiryId = Number(chatBtn.dataset.inquiryId);
    const title = chatBtn.dataset.title;
    const seller = chatBtn.dataset.seller;
    const status = chatBtn.dataset.status;
    openChatModal(inquiryId, title, seller, status);
    return;
  }

  if (!closeBtn) return;
  const inquiryId = Number(closeBtn.dataset.inquiryId);
  if (!inquiryId) return;
  if (!window.confirm("Close this inquiry?")) return;

  const prev = closeBtn.textContent;
  closeBtn.disabled = true;
  closeBtn.textContent = "Closing...";
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
    closeBtn.disabled = false;
    closeBtn.textContent = prev;
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
  document.getElementById("chatSubtitle").textContent = `Chatting with owner: ${secondPartyName}`;
  
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
    
    if (window.loadBuyerInquiries) loadBuyerInquiries();
  } catch (err) {
    ui.showToast(err.message, "error");
  } finally {
    submitBtn.disabled = false;
    input.disabled = false;
    input.focus();
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
