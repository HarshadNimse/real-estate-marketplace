document
  .getElementById("registerForm")
  ?.addEventListener("submit", async (event) => {
    event.preventDefault();
    ui.setMessage("formMessage", "");
    ui.setLoading("loadingState", true, "Creating account...");
    const submitBtn = event.target.querySelector("button[type='submit']");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Creating...";
    }

    const payload = {
      fullName: document.getElementById("fullName").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      password: document.getElementById("password").value,
      role: document.getElementById("role").value,
    };

    if (!payload.fullName) {
      ui.setMessage("formMessage", "Full name is required.", true);
      ui.setLoading("loadingState", false);
      submitBtn.disabled = false;
      submitBtn.textContent = "Create Account";
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      ui.setMessage("formMessage", "Please provide a valid email address.", true);
      ui.setLoading("loadingState", false);
      submitBtn.disabled = false;
      submitBtn.textContent = "Create Account";
      return;
    }
    if (payload.phone && !/^\d{10,15}$/.test(payload.phone)) {
      ui.setMessage("formMessage", "Phone should contain 10 to 15 digits.", true);
      ui.setLoading("loadingState", false);
      submitBtn.disabled = false;
      submitBtn.textContent = "Create Account";
      return;
    }
    if (payload.password.length < 8) {
      ui.setMessage("formMessage", "Password must be at least 8 characters.", true);
      ui.setLoading("loadingState", false);
      submitBtn.disabled = false;
      submitBtn.textContent = "Create Account";
      return;
    }

    try {
      const response = await api.request("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      auth.setSession(response.data);
      ui.showToast("Registration successful.", "success");
      if (payload.role === "seller") window.location.href = "./seller-dashboard.html";
      else window.location.href = "./buyer-dashboard.html";
    } catch (error) {
      ui.setMessage("formMessage", error.message, true);
      ui.showToast(error.message, "error");
    } finally {
      ui.setLoading("loadingState", false);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Create Account";
      }
    }
  });

(function redirectIfLoggedIn() {
  if (!auth.isLoggedIn()) return;
  const user = auth.getCurrentUser();
  if (!user) return;
  if (user.role === "seller") window.location.href = "./seller-dashboard.html";
  else if (user.role === "buyer") window.location.href = "./buyer-dashboard.html";
  else if (user.role === "admin") window.location.href = "./admin-panel.html";
  else window.location.href = "./index.html";
})();
