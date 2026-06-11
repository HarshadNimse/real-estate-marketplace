(async function init() {
  const user = auth.requireAuth();
  if (!user) return;

  // Set dashboard link based on role
  const dashboardLink = document.getElementById("dashboardLink");
  if (dashboardLink) {
    if (user.role === "seller") {
      dashboardLink.href = "./seller-dashboard.html";
      dashboardLink.textContent = "Seller Dashboard";
    } else if (user.role === "buyer") {
      dashboardLink.href = "./buyer-dashboard.html";
      dashboardLink.textContent = "Buyer Dashboard";
    } else if (user.role === "admin") {
      dashboardLink.href = "./admin-panel.html";
      dashboardLink.textContent = "Admin Panel";
    } else {
      dashboardLink.style.display = "none";
    }
  }

  document.getElementById("avatarInitials").textContent = (
    user.full_name || "?"
  )[0].toUpperCase();
  document.getElementById("profileName").textContent = user.full_name || "";
  document.getElementById("profileRole").textContent =
    user.role.charAt(0).toUpperCase() + user.role.slice(1);

  try {
    const res = await api.request("/auth/me");
    const u = res.data.user;
    document.getElementById("fullName").value = u.full_name || "";
    document.getElementById("profileEmail").value = u.email || "";
    document.getElementById("profilePhone").value = u.phone || "";
    const verified = Boolean(u.email_verified);
    const statusEl = document.getElementById("emailVerifyStatus");
    const verifyBtn = document.getElementById("sendVerifyEmailBtn");
    if (statusEl) {
      statusEl.textContent = verified
        ? "Email verified"
        : "Email not verified";
      statusEl.className = verified
        ? "mt-2 text-sm text-emerald-600"
        : "mt-2 text-sm text-amber-600";
    }
    if (verifyBtn) verifyBtn.classList.toggle("hidden", verified);
  } catch (e) {
    ui.setMessage("profileMessage", e.message, true);
    document.getElementById("profileMessage").classList.remove("hidden");
  }

  document.getElementById("sendVerifyEmailBtn")?.addEventListener("click", async () => {
    const btn = document.getElementById("sendVerifyEmailBtn");
    btn.disabled = true;
    btn.textContent = "Sending...";
    try {
      await api.request("/auth/send-verification-email", { method: "POST" });
      ui.showToast("Verification email sent. Check your inbox or server console in dev.", "success");
    } catch (e) {
      ui.showToast(e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Send verification email";
    }
  });

  document.getElementById("saveProfileBtn").addEventListener("click", async () => {
    const btn = document.getElementById("saveProfileBtn");
    btn.disabled = true;
    btn.textContent = "Saving...";
    try {
      const res = await api.request("/auth/me", {
        method: "PUT",
        body: JSON.stringify({
          fullName: document.getElementById("fullName").value.trim(),
          phone: document.getElementById("profilePhone").value.trim(),
        }),
      });
      const updated = res.data.user;
      const stored = auth.getUser() || {};
      stored.full_name = updated.full_name;
      stored.phone = updated.phone;
      localStorage.setItem(window.APP_CONFIG.USER_KEY, JSON.stringify(stored));
      ui.setMessage("profileMessage", "Profile updated successfully.", false);
      document.getElementById("profileMessage").classList.remove("hidden");
      document.getElementById("profileName").textContent = updated.full_name;
      document.getElementById("avatarInitials").textContent = (
        updated.full_name || "?"
      )[0].toUpperCase();
      ui.showToast("Profile saved.", "success");
    } catch (e) {
      ui.setMessage("profileMessage", e.message, true);
      document.getElementById("profileMessage").classList.remove("hidden");
    } finally {
      btn.disabled = false;
      btn.textContent = "Save changes";
    }
  });

  document
    .getElementById("changePasswordBtn")
    .addEventListener("click", async () => {
      const btn = document.getElementById("changePasswordBtn");
      const newPwd = document.getElementById("newPassword").value;
      const confirmPwd = document.getElementById("confirmPassword").value;
      if (newPwd !== confirmPwd) {
        ui.setMessage("passwordMessage", "New passwords do not match.", true);
        document.getElementById("passwordMessage").classList.remove("hidden");
        return;
      }
      btn.disabled = true;
      btn.textContent = "Updating...";
      try {
        await api.request("/auth/me/change-password", {
          method: "POST",
          body: JSON.stringify({
            currentPassword: document.getElementById("currentPassword").value,
            newPassword: newPwd,
          }),
        });
        document.getElementById("currentPassword").value = "";
        document.getElementById("newPassword").value = "";
        document.getElementById("confirmPassword").value = "";
        ui.setMessage("passwordMessage", "Password changed successfully.", false);
        document.getElementById("passwordMessage").classList.remove("hidden");
        ui.showToast("Password updated.", "success");
      } catch (e) {
        ui.setMessage("passwordMessage", e.message, true);
        document.getElementById("passwordMessage").classList.remove("hidden");
      } finally {
        btn.disabled = false;
        btn.textContent = "Change password";
      }
    });

  try {
    const res = await api.request("/favourites");
    const props = res.data.properties || [];
    const e = ui.escapeHtml;
    const ph = ui.PLACEHOLDER_IMAGE;
    document.getElementById("favouritesList").innerHTML = props.length
      ? props
          .map(
            (p) => `
          <li class="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
            <img class="h-16 w-20 rounded-lg object-cover flex-shrink-0" src="${
              ui.safeImageSrc(p.primary_image_url) || ph
            }" alt="Property" onerror="this.src='${ph}'">
            <div class="min-w-0">
              <a href="./property.html?slug=${e(
                p.slug
              )}" class="text-sm font-semibold text-slate-800 hover:text-indigo-600 truncate block">${e(
              p.title
            )}</a>
              <div class="text-xs text-slate-500 mt-0.5">${e(p.city)} | INR ${Number(
              p.price
            ).toLocaleString("en-IN")}</div>
            </div>
            <button class="remove-fav ml-auto flex-shrink-0 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100" data-id="${
              p.id
            }">Remove</button>
          </li>`
          )
          .join("")
      : `<li class="text-sm text-slate-500">No saved properties yet. Browse listings and click the heart icon to save.</li>`;
  } catch (e) {
    document.getElementById(
      "favouritesList"
    ).innerHTML = `<li class="text-sm text-slate-500">Could not load saved properties.</li>`;
  }

  document.getElementById("favouritesList").addEventListener("click", async (event) => {
    const btn = event.target.closest(".remove-fav");
    if (!btn) return;
    const id = btn.dataset.id;
    btn.disabled = true;
    btn.textContent = "Removing...";
    try {
      await api.request(`/favourites/${id}`, { method: "DELETE" });
      btn.closest("li").remove();
      ui.showToast("Removed from favourites.", "success");
    } catch (e) {
      ui.showToast(e.message, "error");
      btn.disabled = false;
      btn.textContent = "Remove";
    }
  });

  document
    .getElementById("logoutBtn")
    ?.addEventListener("click", () => auth.logout("./login.html"));
})();
