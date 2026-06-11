(function initNavbar() {
  const user = auth.getCurrentUser();
  const role = user?.role || null;

  document.querySelectorAll("[data-auth='guest']").forEach((el) => {
    el.style.display = user ? "none" : "";
  });
  document.querySelectorAll("[data-auth='user']").forEach((el) => {
    el.style.display = user ? "" : "none";
  });

  document.querySelectorAll("[data-role]").forEach((el) => {
    if (!user) {
      el.style.display = "none";
      return;
    }
    if (role === "admin") {
      el.style.display = "";
      return;
    }
    const allowedRoles = String(el.dataset.role)
      .split(",")
      .map((item) => item.trim());
    el.style.display = allowedRoles.includes(role) ? "" : "none";
  });

  const mobileMenuBtn = document.querySelector("#mobileMenuBtn");
  const mobileMenu = document.querySelector("#mobileMenu");

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
      const expanded = mobileMenuBtn.getAttribute("aria-expanded") === "true";
      mobileMenuBtn.setAttribute("aria-expanded", String(!expanded));
    });
  }
})();
