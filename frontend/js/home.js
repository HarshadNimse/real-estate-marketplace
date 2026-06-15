const state = {
  limit: 9,
  offset: 0,
  total: 0,
  loading: false,
  latestProperties: [],
};

const megaMenuData = {
  buyers: [
    {
      title: "Property type",
      items: ["Flats", "Houses", "Builder floors", "Plots", "Villas"],
    },
    {
      title: "Popular areas",
      items: ["Kothrud", "Wakad", "Baner", "Hadapsar", "Ravet"],
    },
    {
      title: "Search by BHK",
      items: ["1 RK Properties", "1 BHK Properties", "2 BHK Properties", "3 BHK Properties"],
    },
    {
      title: "Popular searches",
      items: ["Affordable projects", "Ready to move projects", "Properties without brokerage"],
    },
  ],
  tenants: [
    {
      title: "Property type",
      items: ["Flats", "Houses", "Villas", "Commercial properties"],
    },
    {
      title: "Popular areas",
      items: ["Kharadi", "Wakad", "Shaniwar Peth", "Kasba Peth"],
    },
    {
      title: "Search by BHK",
      items: ["1 RK Flats", "1 BHK Flats", "2 BHK Flats", "3 BHK Flats"],
    },
    {
      title: "Popular searches",
      items: ["Fully furnished rentals", "Semi furnished rentals", "No brokerage rentals"],
    },
  ],
  sellers: [
    {
      title: "Packages for",
      items: ["Developers", "Brokers", "Owners"],
    },
    {
      title: "Quick actions",
      items: ["Post property", "Track leads", "Promote listing"],
    },
  ],
  services: [
    {
      title: "Housing Edge",
      items: ["Home loan", "Housing Protect", "Housing Premium"],
    },
    {
      title: "Tools",
      items: ["EMI calculator", "Property value calculator", "Rent receipt generator"],
    },
  ],
  news: [
    {
      title: "Property market guide",
      items: ["Real Estate News", "Buying Guide", "Housing Research", "Pune Overview"],
    },
  ],
};

function debounce(fn, delay = 500) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function setControlsDisabled(disabled) {
  ["applyFilters", "clearFilters", "prevPage", "nextPage"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.disabled = disabled;
  });
}

function collectFilters() {
  return {
    q: document.getElementById("filterKeyword")?.value.trim() || "",
    city: document.getElementById("filterCity").value.trim(),
    property_type: document.getElementById("filterType").value,
    furnishing: document.getElementById("filterFurnishing")?.value || "",
    bhk: document.getElementById("filterBhk").value,
    minPrice: document.getElementById("filterMinPrice").value,
    maxPrice: document.getElementById("filterMaxPrice").value,
    minArea: document.getElementById("filterMinArea")?.value || "",
    maxArea: document.getElementById("filterMaxArea")?.value || "",
    limit: state.limit,
    offset: state.offset,
    sortBy: document.getElementById("filterSortBy").value,
    sortOrder: document.getElementById("filterSortOrder").value,
  };
}

function renderMegaMenu(menuKey) {
  const panel = document.getElementById("megaMenuPanel");
  const content = document.getElementById("megaMenuContent");
  if (!panel || !content) return;

  const sections = megaMenuData[menuKey];
  if (!sections || !sections.length) {
    panel.classList.add("hidden");
    content.innerHTML = "";
    return;
  }

  content.innerHTML = sections
    .map(
      (section) => `
      <section>
        <h4 class="mb-2 text-sm font-semibold text-slate-700">${ui.escapeHtml(section.title)}</h4>
        <ul class="space-y-2 text-sm text-slate-600">
          ${section.items
            .map(
              (item) =>
                `<li><button type="button" class="mega-menu-item w-full rounded px-2 py-1.5 text-left transition hover:bg-indigo-50" data-action="${ui.escapeHtml(
                  item
                )}" data-city="${ui.escapeHtml(item)}">${ui.escapeHtml(item)}</button></li>`
            )
            .join("")}
        </ul>
      </section>`
    )
    .join("");

  panel.classList.remove("hidden");
}

function setupMegaMenuInteractions() {
  const panel = document.getElementById("megaMenuPanel");
  const content = document.getElementById("megaMenuContent");
  const triggers = document.querySelectorAll(".mega-menu-trigger");
  if (!panel || !content || !triggers.length) return;

  let closeTimer = null;
  const openByKey = (menuKey) => {
    clearTimeout(closeTimer);
    renderMegaMenu(menuKey);
    triggers.forEach((trigger) => {
      if (trigger.dataset.megaMenu === menuKey) {
        trigger.classList.add("bg-indigo-50", "text-indigo-700");
      } else {
        trigger.classList.remove("bg-indigo-50", "text-indigo-700");
      }
    });
  };
  const closeMenu = () => {
    panel.classList.add("hidden");
    content.innerHTML = "";
    triggers.forEach((trigger) => trigger.classList.remove("bg-indigo-50", "text-indigo-700"));
  };
  const scheduleClose = () => {
    closeTimer = setTimeout(closeMenu, 160);
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("mouseenter", () => openByKey(trigger.dataset.megaMenu));
    trigger.addEventListener("focus", () => openByKey(trigger.dataset.megaMenu));
    trigger.addEventListener("click", () => openByKey(trigger.dataset.megaMenu));
    trigger.addEventListener("mouseleave", scheduleClose);
  });

  panel.addEventListener("mouseenter", () => clearTimeout(closeTimer));
  panel.addEventListener("mouseleave", scheduleClose);

  document.addEventListener("click", (event) => {
    if (!panel.contains(event.target) && !event.target.closest(".mega-menu-trigger")) {
      closeMenu();
    }
  });

  panel.addEventListener("click", (event) => {
    const item = event.target.closest(".mega-menu-item");
    if (!item) return;
    const label = item.dataset.action || item.dataset.city || item.textContent.trim();

    if (label === "Post property") {
      window.location.href = auth.isLoggedIn() && auth.getUser()?.role === "seller"
        ? "./seller-property-form.html"
        : "./register.html";
      closeMenu();
      return;
    }
    if (label === "Track leads") {
      window.location.href = auth.isLoggedIn() && auth.getUser()?.role === "seller"
        ? "./seller-dashboard.html"
        : "./login.html";
      closeMenu();
      return;
    }
    if (label === "EMI calculator") {
      openToolModal("emi");
      closeMenu();
      return;
    }
    if (label === "Property value calculator") {
      openToolModal("value");
      closeMenu();
      return;
    }
    if (label === "Rent receipt generator") {
      openToolModal("receipt");
      closeMenu();
      return;
    }

    const city = item.dataset.city || "";
    if (city) {
      document.getElementById("filterCity").value = city;
      state.offset = 0;
      loadProperties();
    }
    closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}

function renderTopPicks(properties) {
  const root = document.getElementById("topPicksList");
  if (!root) return;
  const picks = properties.slice(0, 8);
  root.innerHTML = picks.length
    ? picks
        .map((item) => {
          const image = ui.safeImageSrc(item.primary_image_url);
          return `
            <article class="overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md">
              <img class="h-32 w-full object-cover" src="${image}" alt="${ui.escapeHtml(item.title)}" onerror="this.onerror=null;this.src='${ui.PLACEHOLDER_IMAGE}';" />
              <div class="space-y-1 p-3">
                <h3 class="line-clamp-1 text-sm font-semibold text-slate-800">${ui.escapeHtml(item.title)}</h3>
                <p class="text-xs text-slate-500">${ui.escapeHtml(item.city)} | ${ui.escapeHtml(item.bhk)} BHK</p>
                <p class="text-base font-semibold text-indigo-700">INR ${Number(item.price).toLocaleString("en-IN")}</p>
                <a class="text-xs font-semibold text-indigo-600 hover:underline" href="./property.html?slug=${encodeURIComponent(item.slug || "")}">View details</a>
              </div>
            </article>
          `;
        })
        .join("")
    : `<p class="col-span-full text-sm text-slate-500">No featured properties available yet.</p>`;
}

function renderHighDemand(properties) {
  const root = document.getElementById("highDemandList");
  if (!root) return;
  const demand = properties
    .slice()
    .sort((a, b) => Number(b.price) - Number(a.price))
    .slice(0, 6);
  root.innerHTML = demand.length
    ? demand
        .map((item) => {
          const image = ui.safeImageSrc(item.primary_image_url);
          return `
            <article class="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:shadow-md">
              <img class="h-24 w-24 rounded-lg object-cover" src="${image}" alt="${ui.escapeHtml(item.title)}" onerror="this.onerror=null;this.src='${ui.PLACEHOLDER_IMAGE}';" />
              <div class="min-w-0 flex-1 space-y-1">
                <h3 class="line-clamp-1 font-semibold text-slate-800">${ui.escapeHtml(item.title)}</h3>
                <p class="line-clamp-1 text-xs text-slate-500">${ui.escapeHtml(item.city)} • ${ui.escapeHtml(item.property_type)}</p>
                <p class="text-sm font-semibold text-indigo-700">INR ${Number(item.price).toLocaleString("en-IN")}</p>
                <a class="text-xs font-semibold text-indigo-600 hover:underline" href="./property.html?slug=${encodeURIComponent(item.slug || "")}">Open property</a>
              </div>
            </article>
          `;
        })
        .join("")
    : `<p class="col-span-full text-sm text-slate-500">No demand insights available yet.</p>`;
}

function renderCityShowcase(properties) {
  const root = document.getElementById("cityShowcase");
  if (!root) return;
  const cityMap = new Map();
  properties.forEach((item) => {
    const city = String(item.city || "").trim();
    if (!city) return;
    if (!cityMap.has(city)) cityMap.set(city, 0);
    cityMap.set(city, cityMap.get(city) + 1);
  });
  const cities = Array.from(cityMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  root.innerHTML = cities.length
    ? cities
        .map(
          ([city, count]) => `
            <button type="button" class="city-showcase-item rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-indigo-300 hover:shadow-sm" data-city="${ui.escapeHtml(city)}">
              <p class="text-lg font-semibold text-slate-800">${ui.escapeHtml(city)}</p>
              <p class="text-sm text-slate-500">${count} listings</p>
            </button>
          `
        )
        .join("")
    : `<p class="col-span-full text-sm text-slate-500">No city metadata available yet.</p>`;
}

async function loadProperties() {
  if (state.loading) return;
  state.loading = true;
  setControlsDisabled(true);
  ui.setLoading("listLoading", true);
  ui.setMessage("listMessage", "");
  try {
    const query = api.buildQuery(collectFilters());
    const response = await api.request(`/properties?${query}`);
    const data = response.data;
    state.total = data.pagination.total;
    state.latestProperties = data.properties || [];
    document.getElementById("propertyList").innerHTML = data.properties.length
      ? data.properties.map(ui.propertyCard).join("")
      : `<p class="col-span-full rounded-xl bg-white p-6 text-center text-sm text-slate-500 shadow">No properties found. Try adjusting filters.</p>`;
    const currentUser = auth.getUser();
    document.querySelectorAll(".list-fav-btn").forEach((btn) => {
      btn.classList.toggle("hidden", !currentUser || currentUser.role !== "buyer");
    });
    renderTopPicks(state.latestProperties);
    renderHighDemand(state.latestProperties);
    renderCityShowcase(state.latestProperties);
    if (state.total === 0) ui.setText("pageInfo", "Showing 0 of 0");
    else {
      ui.setText(
        "pageInfo",
        `Showing ${state.offset + 1}-${Math.min(state.offset + state.limit, state.total)} of ${state.total}`
      );
    }
  } catch (error) {
    ui.setMessage("listMessage", error.message, true);
  } finally {
    ui.setLoading("listLoading", false);
    setControlsDisabled(false);
    state.loading = false;
  }
}

document.getElementById("applyFilters")?.addEventListener("click", () => {
  state.offset = 0;
  loadProperties();
});

function openToolModal(kind) {
  const modal = document.getElementById("toolModal");
  const title = document.getElementById("toolModalTitle");
  const body = document.getElementById("toolModalBody");
  if (!modal || !title || !body) return;

  if (kind === "emi") {
    title.textContent = "EMI calculator";
    body.innerHTML = `
      <label class="block">Loan amount (INR)<input id="emiPrincipal" type="number" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" value="5000000" /></label>
      <label class="block">Annual rate (%)<input id="emiRate" type="number" step="0.1" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" value="8.5" /></label>
      <label class="block">Tenure (years)<input id="emiYears" type="number" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" value="20" /></label>
      <button type="button" id="emiCalcBtn" class="w-full rounded-xl bg-indigo-600 py-2 font-semibold text-white">Calculate EMI</button>
      <p id="emiResult" class="font-semibold text-indigo-700"></p>`;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.getElementById("emiCalcBtn")?.addEventListener("click", () => {
      const p = Number(document.getElementById("emiPrincipal").value);
      const r = Number(document.getElementById("emiRate").value) / 12 / 100;
      const n = Number(document.getElementById("emiYears").value) * 12;
      if (!p || !r || !n) {
        document.getElementById("emiResult").textContent = "Enter valid numbers.";
        return;
      }
      const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      document.getElementById("emiResult").textContent = `Monthly EMI: INR ${Math.round(emi).toLocaleString("en-IN")}`;
    });
    return;
  }

  if (kind === "value") {
    title.textContent = "Property value estimator";
    body.innerHTML = `
      <label class="block">Area (sqft)<input id="valArea" type="number" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" value="1000" /></label>
      <label class="block">Rate per sqft (INR)<input id="valRate" type="number" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" value="5500" /></label>
      <button type="button" id="valCalcBtn" class="w-full rounded-xl bg-indigo-600 py-2 font-semibold text-white">Estimate</button>
      <p id="valResult" class="font-semibold text-indigo-700"></p>`;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.getElementById("valCalcBtn")?.addEventListener("click", () => {
      const area = Number(document.getElementById("valArea").value);
      const rate = Number(document.getElementById("valRate").value);
      document.getElementById("valResult").textContent =
        area && rate
          ? `Estimated value: INR ${(area * rate).toLocaleString("en-IN")}`
          : "Enter valid numbers.";
    });
    return;
  }

  title.textContent = "Rent receipt generator";
  body.innerHTML = `
    <label class="block">Tenant name<input id="rcTenant" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
    <label class="block">Landlord name<input id="rcLandlord" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
    <label class="block">Rent amount (INR)<input id="rcRent" type="number" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
    <label class="block">Month<input id="rcMonth" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" placeholder="June 2026" /></label>
    <button type="button" id="rcGenBtn" class="w-full rounded-xl bg-indigo-600 py-2 font-semibold text-white">Generate preview</button>
    <pre id="rcResult" class="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-700"></pre>`;
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  document.getElementById("rcGenBtn")?.addEventListener("click", () => {
    const tenant = document.getElementById("rcTenant").value.trim();
    const landlord = document.getElementById("rcLandlord").value.trim();
    const rent = document.getElementById("rcRent").value;
    const month = document.getElementById("rcMonth").value.trim();
    document.getElementById("rcResult").textContent = `RENT RECEIPT\nMonth: ${month || "—"}\nReceived from: ${tenant || "—"}\nPaid to: ${landlord || "—"}\nAmount: INR ${Number(rent || 0).toLocaleString("en-IN")}\n\n(This is a demo preview only.)`;
  });
}

document.getElementById("toolModalClose")?.addEventListener("click", () => {
  const modal = document.getElementById("toolModal");
  modal?.classList.add("hidden");
  modal?.classList.remove("flex");
});

document.getElementById("clearFilters")?.addEventListener("click", () => {
  const kw = document.getElementById("filterKeyword");
  if (kw) kw.value = "";
  document.getElementById("filterCity").value = "";
  document.getElementById("filterType").value = "";
  document.getElementById("filterFurnishing").value = "";
  document.getElementById("filterBhk").value = "";
  document.getElementById("filterMinPrice").value = "";
  document.getElementById("filterMaxPrice").value = "";
  document.getElementById("filterMinArea").value = "";
  document.getElementById("filterMaxArea").value = "";
  document.getElementById("filterSortBy").value = "created_at";
  document.getElementById("filterSortOrder").value = "desc";
  state.offset = 0;
  loadProperties();
});

document.getElementById("prevPage")?.addEventListener("click", () => {
  if (state.offset === 0) return;
  state.offset = Math.max(0, state.offset - state.limit);
  loadProperties();
});

document.getElementById("nextPage")?.addEventListener("click", () => {
  if (state.offset + state.limit >= state.total) return;
  state.offset += state.limit;
  loadProperties();
});

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  auth.logout();
  window.location.reload();
});

document.getElementById("propertyList")?.addEventListener("click", async (event) => {
  const btn = event.target.closest(".list-fav-btn");
  if (!btn) return;
  const propertyId = Number(btn.dataset.propertyId);
  if (!propertyId) return;
  try {
    await api.request(`/favourites/${propertyId}`, { method: "POST" });
    btn.textContent = "♥ Saved";
    btn.classList.add("text-rose-600");
    ui.showToast("Added to favourites.", "success");
  } catch (error) {
    ui.showToast(error.message, "error");
  }
});

(function init() {
  const triggerDebouncedLoad = debounce(() => {
    state.offset = 0;
    loadProperties();
  }, 500);
  ["filterKeyword", "filterCity", "filterMinPrice", "filterMaxPrice", "filterMinArea", "filterMaxArea", "filterBhk"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", triggerDebouncedLoad);
  });

  const user = auth.getCurrentUser();
  if (auth.isLoggedIn() && user) {
    ui.setText("authLinks", `${user.full_name} (${user.role})`);
  }

  document.querySelectorAll(".popular-city").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("filterCity").value = btn.dataset.city || "";
      state.offset = 0;
      loadProperties();
    });
  });

  document.getElementById("cityShowcase")?.addEventListener("click", (event) => {
    const btn = event.target.closest(".city-showcase-item");
    if (!btn) return;
    document.getElementById("filterCity").value = btn.dataset.city || "";
    state.offset = 0;
    loadProperties();
  });

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((item) => {
        item.classList.remove("bg-white", "text-indigo-700", "shadow");
        item.classList.add("bg-indigo-400/40", "text-white");
      });
      btn.classList.remove("bg-indigo-400/40", "text-white");
      btn.classList.add("bg-white", "text-indigo-700", "shadow");
      document.getElementById("filterType").value = btn.dataset.tab || "";
      state.offset = 0;
      loadProperties();
    });
  });

  setupMegaMenuInteractions();
  setupMobileMenu();
  loadProperties();
})();

function setupMobileMenu() {
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileMegaMenuPanel = document.getElementById("mobileMegaMenuPanel");
  const mobileMegaMenuContent = document.getElementById("mobileMegaMenuContent");
  const mobileTriggers = document.querySelectorAll(".mobile-mega-menu-trigger");
  const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");
  
  if (!mobileMenuBtn || !mobileMenu) return;

  mobileMenuBtn.addEventListener("click", () => {
    const isOpen = !mobileMenu.classList.contains("max-h-0");
    if (isOpen) {
      mobileMenu.classList.add("max-h-0");
      mobileMenu.style.maxHeight = "0";
    } else {
      mobileMenu.classList.remove("max-h-0");
      mobileMenu.style.maxHeight = mobileMenu.scrollHeight + "px";
    }
  });

  mobileTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const menuKey = trigger.dataset.megaMenu;
      const sections = megaMenuData[menuKey];
      
      if (!sections || !sections.length) {
        mobileMegaMenuPanel.classList.add("hidden");
        return;
      }

      mobileMegaMenuContent.innerHTML = sections
        .map(
          (section) => `
          <section>
            <h4 class="mb-2 text-sm font-semibold text-slate-700">${ui.escapeHtml(section.title)}</h4>
            <ul class="space-y-1 text-sm text-slate-600">
              ${section.items
                .map(
                  (item) =>
                    `<li><button type="button" class="mobile-mega-menu-item w-full rounded px-2 py-1 text-left transition hover:bg-indigo-50" data-action="${ui.escapeHtml(
                      item
                    )}" data-city="${ui.escapeHtml(item)}">${ui.escapeHtml(item)}</button></li>`
                )
                .join("")}
            </ul>
          </section>`
        )
        .join("");

      mobileMegaMenuPanel.classList.remove("hidden");
    });
  });

  mobileMegaMenuPanel?.addEventListener("click", (event) => {
    const item = event.target.closest(".mobile-mega-menu-item");
    if (!item) return;
    const label = item.dataset.action || item.dataset.city || item.textContent.trim();

    if (label === "Post property") {
      window.location.href = auth.isLoggedIn() && auth.getUser()?.role === "seller"
        ? "./seller-property-form.html"
        : "./register.html";
      return;
    }
    if (label === "Track leads") {
      window.location.href = auth.isLoggedIn() && auth.getUser()?.role === "seller"
        ? "./seller-dashboard.html"
        : "./login.html";
      return;
    }
    if (label === "EMI calculator") {
      openToolModal("emi");
      return;
    }
    if (label === "Property value calculator") {
      openToolModal("value");
      return;
    }
    if (label === "Rent receipt generator") {
      openToolModal("receipt");
      return;
    }

    const city = item.dataset.city || "";
    if (city) {
      document.getElementById("filterCity").value = city;
      state.offset = 0;
      loadProperties();
      mobileMegaMenuPanel.classList.add("hidden");
      mobileMenu.classList.add("max-h-0");
      mobileMenu.style.maxHeight = "0";
    }
  });

  mobileLogoutBtn?.addEventListener("click", () => {
    auth.logout();
    window.location.reload();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 768) {
      mobileMenu.classList.add("max-h-0");
      mobileMenu.style.maxHeight = "0";
      mobileMegaMenuPanel.classList.add("hidden");
    }
  });

  const user = auth.getCurrentUser();
  if (auth.isLoggedIn() && user) {
    const mobileAuthLinks = document.getElementById("mobileAuthLinks");
    if (mobileAuthLinks) {
      mobileAuthLinks.textContent = `${user.full_name} (${user.role})`;
    }
  }
}
