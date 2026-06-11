document.getElementById("loginForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  ui.setMessage("formMessage", "");
  ui.setLoading("loadingState", true, "Signing in...");
  const submitBtn = event.target.querySelector("button[type='submit']");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Signing in...";
  }

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const response = await api.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    auth.setSession(response.data);
    ui.showToast("Login successful.", "success");
    const role = response.data.user.role;
    if (role === "seller") window.location.href = "./seller-dashboard.html";
    else if (role === "buyer") window.location.href = "./buyer-dashboard.html";
    else if (role === "admin") window.location.href = "./admin-panel.html";
    else window.location.href = "./index.html";
  } catch (error) {
    const message =
      error.status === 401
        ? "Login failed. Check email/password."
        : error.message;
    ui.setMessage("formMessage", message, true);
    ui.showToast(message, "error");
  } finally {
    ui.setLoading("loadingState", false);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Login";
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
