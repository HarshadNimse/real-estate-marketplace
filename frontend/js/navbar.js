(function initNavbar() {
  // Wait for document to load to ensure header is present
  document.addEventListener("DOMContentLoaded", () => {
    renderNavbar();
    setupModals();
  });

  // Also execute immediately in case DOMContentLoaded has already fired
  if (document.readyState === "interactive" || document.readyState === "complete") {
    renderNavbar();
    setupModals();
  }

  function getActivePage() {
    const path = window.location.pathname;
    return path.substring(path.lastIndexOf("/") + 1);
  }

  function renderNavbar() {
    const header = document.querySelector("header");
    if (!header) return;

    const user = window.auth?.getUser();
    const role = user?.role || null;
    const activePage = getActivePage();

    // 1. Build Middle links depending on role
    let middleLinksHTML = "";
    let mobileMiddleLinksHTML = "";

    const activeClass = "bg-indigo-50 text-indigo-700 font-semibold";
    const normalClass = "text-slate-600 hover:bg-slate-50 hover:text-slate-800";
    const linkBase = "rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2";
    const mobileLinkBase = "block rounded-xl px-4 py-2.5 text-base font-medium transition-all duration-200";

    if (!user) {
      // Guest
      const exploreActive = (activePage === "index.html" || activePage === "") ? activeClass : normalClass;
      middleLinksHTML = `
        <a href="./index.html" class="${linkBase} ${exploreActive}">
          <span>🔍</span> Browse Properties
        </a>
      `;
      mobileMiddleLinksHTML = `
        <a href="./index.html" class="${mobileLinkBase} ${exploreActive}">🔍 Browse Properties</a>
      `;
    } else if (role === "buyer") {
      // Buyer links
      const browseActive = (activePage === "index.html" || activePage === "") ? activeClass : normalClass;
      const dashboardActive = (activePage === "buyer-dashboard.html") ? activeClass : normalClass;

      middleLinksHTML = `
        <a href="./index.html" class="${linkBase} ${browseActive}">
          <span>🔍</span> Browse
        </a>
        <button id="navCompareBtn" class="${linkBase} ${normalClass}">
          <span>🔄</span> Compare
        </button>
        <button id="navRecommendedBtn" class="${linkBase} ${normalClass}">
          <span>✨</span> Recommended
        </button>
        <a href="./buyer-dashboard.html" class="${linkBase} ${dashboardActive}">
          <span>💬</span> Messages
        </a>
      `;

      mobileMiddleLinksHTML = `
        <a href="./index.html" class="${mobileLinkBase} ${browseActive}">🔍 Browse</a>
        <button id="navMobileCompareBtn" class="w-full text-left ${mobileLinkBase} ${normalClass}">🔄 Compare</button>
        <button id="navMobileRecommendedBtn" class="w-full text-left ${mobileLinkBase} ${normalClass}">✨ Recommended</button>
        <a href="./buyer-dashboard.html" class="${mobileLinkBase} ${dashboardActive}">💬 Messages</a>
      `;
    } else if (role === "seller") {
      // Seller links
      const postActive = (activePage === "seller-property-form.html") ? activeClass : normalClass;
      const dashboardActive = (activePage === "seller-dashboard.html") ? activeClass : normalClass;

      middleLinksHTML = `
        <a href="./seller-property-form.html" class="${linkBase} ${postActive} bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-indigo-700 hover:from-purple-500/20 hover:to-indigo-500/20 border border-indigo-100">
          <span>➕</span> Post Property
        </a>
        <button id="navInsightsBtn" class="${linkBase} ${normalClass}">
          <span>📈</span> Market Insights
        </button>
        <button id="navAnalyticsBtn" class="${linkBase} ${normalClass}">
          <span>📊</span> Analytics
        </button>
        <a href="./seller-dashboard.html" class="${linkBase} ${dashboardActive}">
          <span>💬</span> Messages
        </a>
      `;

      mobileMiddleLinksHTML = `
        <a href="./seller-property-form.html" class="${mobileLinkBase} ${postActive}">➕ Post Property</a>
        <button id="navMobileInsightsBtn" class="w-full text-left ${mobileLinkBase} ${normalClass}">📈 Market Insights</button>
        <button id="navMobileAnalyticsBtn" class="w-full text-left ${mobileLinkBase} ${normalClass}">📊 Analytics</button>
        <a href="./seller-dashboard.html" class="${mobileLinkBase} ${dashboardActive}">💬 Messages</a>
      `;
    } else if (role === "admin") {
      // Admin links
      middleLinksHTML = `
        <button id="navReportsBtn" class="${linkBase} ${normalClass}">
          <span>📋</span> Reports
        </button>
        <button id="navSupportBtn" class="${linkBase} ${normalClass}">
          <span>🛠️</span> Support
        </button>
        <button id="navLogsBtn" class="${linkBase} ${normalClass}">
          <span>📑</span> Audit Logs
        </button>
        <button id="navSettingsBtn" class="${linkBase} ${normalClass}">
          <span>⚙️</span> Settings
        </button>
      `;

      mobileMiddleLinksHTML = `
        <button id="navMobileReportsBtn" class="w-full text-left ${mobileLinkBase} ${normalClass}">📋 Reports</button>
        <button id="navMobileSupportBtn" class="w-full text-left ${mobileLinkBase} ${normalClass}">🛠️ Support</button>
        <button id="navMobileLogsBtn" class="w-full text-left ${mobileLinkBase} ${normalClass}">📑 Audit Logs</button>
        <button id="navMobileSettingsBtn" class="w-full text-left ${mobileLinkBase} ${normalClass}">⚙️ Settings</button>
      `;
    }

    // 2. Build Right Controls (Profile, Login/Register)
    let rightControlsHTML = "";
    let mobileControlsHTML = "";

    if (!user) {
      rightControlsHTML = `
        <a class="rounded-xl px-4 py-2 hover:bg-slate-50 transition-all font-semibold text-slate-700" href="./login.html">Login</a>
        <a class="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-white font-semibold shadow-md hover:opacity-95 transition-all" href="./register.html">Register</a>
      `;

      mobileControlsHTML = `
        <hr class="my-3 border-slate-100" />
        <a class="block rounded-xl px-4 py-2 text-center text-slate-700 font-semibold hover:bg-slate-50 transition-all" href="./login.html">Login</a>
        <a class="block rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-center text-white font-semibold shadow-md hover:opacity-95 transition-all mt-2" href="./register.html">Register</a>
      `;
    } else {
      const avatarChar = (user.full_name || "?")[0].toUpperCase();
      const profileActive = (activePage === "profile.html") ? "bg-indigo-50" : "";
      const dashboardPage = role === "admin" ? "./admin-panel.html" : (role === "seller" ? "./seller-dashboard.html" : "./buyer-dashboard.html");

      rightControlsHTML = `
        <div class="relative">
          <button id="navProfileDropdownTrigger" class="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/50 p-1.5 pr-3 hover:bg-white hover:border-slate-300 transition-all">
            <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-sm font-bold text-white shadow-sm">${avatarChar}</div>
            <span class="text-xs font-semibold text-slate-700 max-w-[120px] truncate">${ui.escapeHtml(user.full_name)}</span>
            <svg class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          
          <div id="navProfileDropdown" class="hidden absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-md p-2 shadow-xl z-50">
            <a href="./profile.html" class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-all ${profileActive}">
              👤 My Profile
            </a>
            <a href="${dashboardPage}" class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-all">
              💼 Dashboard
            </a>
            <hr class="my-2 border-slate-100" />
            <button id="navLogoutBtn" class="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-all">
              🚪 Log Out
            </button>
          </div>
        </div>
      `;

      mobileControlsHTML = `
        <hr class="my-3 border-slate-100" />
        <div class="flex items-center gap-3 px-4 py-2">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-base font-bold text-white shadow-md">${avatarChar}</div>
          <div>
            <div class="font-bold text-slate-800 text-sm leading-tight">${ui.escapeHtml(user.full_name)}</div>
            <div class="text-xs text-indigo-600 font-medium capitalize mt-0.5">${ui.escapeHtml(role)}</div>
          </div>
        </div>
        <a href="./profile.html" class="block rounded-xl px-4 py-2 text-slate-600 hover:bg-slate-50 transition-all mt-2">👤 My Profile</a>
        <a href="${dashboardPage}" class="block rounded-xl px-4 py-2 text-slate-600 hover:bg-slate-50 transition-all">💼 Dashboard</a>
        <button id="navMobileLogoutBtn" class="w-full text-left block rounded-xl px-4 py-2.5 text-rose-600 font-semibold hover:bg-rose-50 transition-all mt-1">🚪 Log Out</button>
      `;
    }

    // 3. Assemble and inject the header markup
    header.className = "sticky top-0 z-50 border-b border-slate-200/50 bg-white/80 backdrop-blur-lg transition-all duration-300";
    header.innerHTML = `
      <nav class="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
        <a href="./index.html" class="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-2xl font-black tracking-tight text-transparent hover:opacity-90 transition-all">
          EstateHub
        </a>
        
        <div class="hidden items-center gap-1.5 md:flex">
          ${middleLinksHTML}
        </div>
        
        <div class="hidden items-center justify-end gap-2 md:flex">
          ${rightControlsHTML}
        </div>
        
        <button id="navMobileBtn" type="button" class="md:hidden rounded-xl p-2 hover:bg-indigo-50/50 text-slate-600 transition-all">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path id="navMobileIconPath" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16m-7 6h7"></path>
          </svg>
        </button>
      </nav>
      
      <div id="navMobileMenu" class="hidden border-t border-slate-100 bg-white px-4 py-3 text-sm font-medium md:hidden overflow-hidden transition-all duration-300">
        <div class="space-y-1">
          ${mobileMiddleLinksHTML}
          ${mobileControlsHTML}
        </div>
      </div>
    `;

    // 4. Setup interaction event listeners
    setupInteractions();
  }

  function setupInteractions() {
    // Mobile Menu Toggle
    const mobileBtn = document.getElementById("navMobileBtn");
    const mobileMenu = document.getElementById("navMobileMenu");
    const mobilePath = document.getElementById("navMobileIconPath");

    if (mobileBtn && mobileMenu) {
      mobileBtn.addEventListener("click", () => {
        const isHidden = mobileMenu.classList.contains("hidden");
        if (isHidden) {
          mobileMenu.classList.remove("hidden");
          mobilePath.setAttribute("d", "M6 18L18 6M6 6l12 12");
        } else {
          mobileMenu.classList.add("hidden");
          mobilePath.setAttribute("d", "M4 6h16M4 12h16m-7 6h7");
        }
      });
    }

    // Profile Dropdown Toggle
    const dropdownTrigger = document.getElementById("navProfileDropdownTrigger");
    const dropdown = document.getElementById("navProfileDropdown");

    if (dropdownTrigger && dropdown) {
      dropdownTrigger.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("hidden");
      });

      document.addEventListener("click", () => {
        dropdown.classList.add("hidden");
      });
    }

    // Logout Click Listeners
    const triggerLogout = () => {
      if (window.auth) {
        window.auth.logout("./login.html");
      } else {
        localStorage.clear();
        window.location.href = "./login.html";
      }
    };

    document.getElementById("navLogoutBtn")?.addEventListener("click", triggerLogout);
    document.getElementById("navMobileLogoutBtn")?.addEventListener("click", triggerLogout);

    // Recommended items filter handler
    const triggerRecommended = () => {
      const isHome = window.location.pathname.endsWith("index.html") || window.location.pathname.endsWith("/");
      if (isHome) {
        // Find property filtering inputs and set BHK to 3 (recommended highlight)
        const bhkInput = document.getElementById("filterBhk");
        const priceMinInput = document.getElementById("filterMinPrice");
        if (bhkInput) {
          bhkInput.value = "3";
          if (priceMinInput) priceMinInput.value = "5000000"; // Premium price point
          const searchBtn = document.getElementById("applyFilters");
          searchBtn?.click();
          ui.showToast("Filtered by Recommended Listings (3+ BHK & Premium)", "info");
        }
      } else {
        window.location.href = "./index.html?filter=recommended";
      }
    };

    document.getElementById("navRecommendedBtn")?.addEventListener("click", triggerRecommended);
    document.getElementById("navMobileRecommendedBtn")?.addEventListener("click", triggerRecommended);
  }

  // Inject Custom Interactive Modals
  function setupModals() {
    const user = window.auth?.getUser();
    if (!user) return;

    // Create container if not exists
    let modalContainer = document.getElementById("navbarModalContainer");
    if (!modalContainer) {
      modalContainer = document.createElement("div");
      modalContainer.id = "navbarModalContainer";
      document.body.appendChild(modalContainer);
    }

    // Clear old elements if rendering again
    modalContainer.innerHTML = "";

    // A. BUYER MODAL: Property Comparison Drawer
    if (user.role === "buyer") {
      modalContainer.innerHTML += `
        <div id="compareDrawer" class="fixed inset-y-0 right-0 z-[1000] w-full max-w-xl bg-white shadow-2xl translate-x-full transition-transform duration-300 ease-in-out border-l border-slate-200 flex flex-col">
          <div class="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <h3 class="text-lg font-bold text-slate-800">Compare Properties</h3>
              <p class="text-xs text-slate-500 mt-0.5">Select and compare your saved properties side-by-side</p>
            </div>
            <button type="button" id="closeCompareDrawer" class="rounded-xl p-2 hover:bg-slate-200/80 text-slate-500 font-semibold text-lg transition-all">✕</button>
          </div>
          <div class="p-6 flex-1 overflow-y-auto space-y-6">
            <div id="comparePropertiesSelection" class="grid grid-cols-3 gap-3">
              <!-- Checkboxes dynamically populated -->
            </div>
            <div id="comparisonResultContainer" class="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
              <!-- Comparison Table -->
            </div>
          </div>
        </div>
      `;
    }

    // B. SELLER MODALS: Market Insights & Analytics Modals
    if (user.role === "seller") {
      modalContainer.innerHTML += `
        <!-- Market Insights Modal -->
        <div id="insightsModal" class="fixed inset-0 z-[1000] hidden items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div class="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 scale-95 opacity-0 transition-all duration-300">
            <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 class="text-xl font-bold text-slate-800">📈 Market Insights</h3>
              <button id="closeInsightsModal" class="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <div class="space-y-4">
              <p class="text-sm text-slate-600">Average residential prices and market demand status by city:</p>
              <div class="space-y-3">
                <div>
                  <div class="flex justify-between text-sm font-semibold text-slate-700"><span>Pune (High Demand)</span><span>₹7,200/sqft</span></div>
                  <div class="w-full bg-slate-100 h-2.5 rounded-full mt-1 overflow-hidden"><div class="bg-indigo-600 h-full rounded-full" style="width: 85%"></div></div>
                </div>
                <div>
                  <div class="flex justify-between text-sm font-semibold text-slate-700"><span>Mumbai (Premium Peak)</span><span>₹21,500/sqft</span></div>
                  <div class="w-full bg-slate-100 h-2.5 rounded-full mt-1 overflow-hidden"><div class="bg-purple-600 h-full rounded-full" style="width: 95%"></div></div>
                </div>
                <div>
                  <div class="flex justify-between text-sm font-semibold text-slate-700"><span>Bangalore (Steady Demand)</span><span>₹8,900/sqft</span></div>
                  <div class="w-full bg-slate-100 h-2.5 rounded-full mt-1 overflow-hidden"><div class="bg-blue-600 h-full rounded-full" style="width: 75%"></div></div>
                </div>
                <div>
                  <div class="flex justify-between text-sm font-semibold text-slate-700"><span>Delhi NCR (Moderate Growth)</span><span>₹6,100/sqft</span></div>
                  <div class="w-full bg-slate-100 h-2.5 rounded-full mt-1 overflow-hidden"><div class="bg-amber-600 h-full rounded-full" style="width: 60%"></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Seller Analytics Modal -->
        <div id="analyticsModal" class="fixed inset-0 z-[1000] hidden items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div class="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 scale-95 opacity-0 transition-all duration-300">
            <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 class="text-xl font-bold text-slate-800">📊 Listing Performance Analytics</h3>
              <button id="closeAnalyticsModal" class="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-indigo-50/50 border border-indigo-100/80 p-4 rounded-2xl text-center">
                <div class="text-2xl font-black text-indigo-700">1,429</div>
                <div class="text-xs font-semibold text-slate-500 mt-1">Total Views</div>
              </div>
              <div class="bg-emerald-50/50 border border-emerald-100/80 p-4 rounded-2xl text-center">
                <div class="text-2xl font-black text-emerald-700">12.4%</div>
                <div class="text-xs font-semibold text-slate-500 mt-1">Conversion Rate</div>
              </div>
              <div class="bg-amber-50/50 border border-amber-100/80 p-4 rounded-2xl text-center">
                <div class="text-2xl font-black text-amber-700">18</div>
                <div class="text-xs font-semibold text-slate-500 mt-1">Inquiries Received</div>
              </div>
              <div class="bg-purple-50/50 border border-purple-100/80 p-4 rounded-2xl text-center">
                <div class="text-2xl font-black text-purple-700">4.8 ★</div>
                <div class="text-xs font-semibold text-slate-500 mt-1">Seller Rating</div>
              </div>
            </div>
            <div class="mt-5 border-t border-slate-100 pt-4">
              <h4 class="text-sm font-bold text-slate-800 mb-2">Visitor Activity Trend</h4>
              <div class="h-32 w-full flex items-end justify-between gap-1 px-4 py-2 border border-slate-100 rounded-2xl bg-slate-50/50">
                <div class="w-8 bg-indigo-200 hover:bg-indigo-400 transition-all rounded-t-md" style="height: 30%" title="Mon: 120 views"></div>
                <div class="w-8 bg-indigo-200 hover:bg-indigo-400 transition-all rounded-t-md" style="height: 50%" title="Tue: 210 views"></div>
                <div class="w-8 bg-indigo-300 hover:bg-indigo-500 transition-all rounded-t-md" style="height: 85%" title="Wed: 340 views"></div>
                <div class="w-8 bg-indigo-200 hover:bg-indigo-400 transition-all rounded-t-md" style="height: 45%" title="Thu: 190 views"></div>
                <div class="w-8 bg-indigo-400 hover:bg-indigo-600 transition-all rounded-t-md" style="height: 95%" title="Fri: 410 views"></div>
                <div class="w-8 bg-indigo-300 hover:bg-indigo-500 transition-all rounded-t-md" style="height: 70%" title="Sat: 300 views"></div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // C. ADMIN MODALS: Reports, Support, Audit Logs, Settings
    if (user.role === "admin") {
      modalContainer.innerHTML += `
        <!-- Reports Modal -->
        <div id="adminReportsModal" class="fixed inset-0 z-[1000] hidden items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div class="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl scale-95 opacity-0 transition-all duration-300 border border-slate-100 animate-fade-in">
            <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 class="text-xl font-bold text-slate-800">📋 Flagged Listing Reports</h3>
              <button id="closeReportsModal" class="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <div class="space-y-3 max-h-80 overflow-y-auto pr-1">
              <div class="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 flex justify-between items-center">
                <div>
                  <h4 class="font-bold text-sm text-slate-800">2 BHK Flat Wakad</h4>
                  <p class="text-xs text-slate-500 mt-0.5">Reported for: Inaccurate pricing</p>
                </div>
                <span class="rounded-full bg-rose-100 text-rose-700 px-3 py-1 text-xs font-semibold">Flagged</span>
              </div>
              <div class="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex justify-between items-center">
                <div>
                  <h4 class="font-bold text-sm text-slate-800">Luxury Villa Pune</h4>
                  <p class="text-xs text-slate-500 mt-0.5">Reported for: Spam duplicate post</p>
                </div>
                <span class="rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-semibold">Under Review</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Support Tickets Modal -->
        <div id="adminSupportModal" class="fixed inset-0 z-[1000] hidden items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div class="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl scale-95 opacity-0 transition-all duration-300 border border-slate-100">
            <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 class="text-xl font-bold text-slate-800">🛠️ Active Support Tickets</h3>
              <button id="closeSupportModal" class="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <div class="space-y-3">
              <div class="p-4 rounded-2xl border border-slate-100 hover:bg-slate-50/50 transition-all">
                <div class="flex justify-between items-start">
                  <h4 class="font-bold text-sm text-slate-800">Cannot upload property image</h4>
                  <span class="text-xs text-indigo-600 font-semibold">Open</span>
                </div>
                <p class="text-xs text-slate-500 mt-1">Submitted by: amit.sharma@email.com (Seller)</p>
              </div>
              <div class="p-4 rounded-2xl border border-slate-100 hover:bg-slate-50/50 transition-all">
                <div class="flex justify-between items-start">
                  <h4 class="font-bold text-sm text-slate-800">Request for refund on Listing Package</h4>
                  <span class="text-xs text-emerald-600 font-semibold">Resolved</span>
                </div>
                <p class="text-xs text-slate-500 mt-1">Submitted by: riya.patel@email.com (Seller)</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Audit Logs Modal -->
        <div id="adminLogsModal" class="fixed inset-0 z-[1000] hidden items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div class="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl scale-95 opacity-0 transition-all duration-300 border border-slate-100">
            <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 class="text-xl font-bold text-slate-800">📑 System Audit Logs</h3>
              <button id="closeLogsModal" class="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <div class="space-y-3 font-mono text-xs max-h-80 overflow-y-auto">
              <div class="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span class="text-slate-400">[2026-06-14 15:10:04]</span> <span class="text-indigo-600 font-bold">USER_MGMT:</span> Activated user ID 142 (Buyer)
              </div>
              <div class="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span class="text-slate-400">[2026-06-14 14:45:19]</span> <span class="text-amber-600 font-bold">PROP_MOD:</span> Rejected property ID 88 - "Unverified contact details"
              </div>
              <div class="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span class="text-slate-400">[2026-06-14 13:22:50]</span> <span class="text-emerald-600 font-bold">SYS_CONF:</span> Updated platform fee from 1.5% to 2.0%
              </div>
            </div>
          </div>
        </div>

        <!-- Global Settings Modal -->
        <div id="adminSettingsModal" class="fixed inset-0 z-[1000] hidden items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div class="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl scale-95 opacity-0 transition-all duration-300 border border-slate-100">
            <div class="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 class="text-xl font-bold text-slate-800">⚙️ Platform Settings</h3>
              <button id="closeSettingsModal" class="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>
            <div class="space-y-4 text-sm">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-bold text-slate-800">Platform Listing Commission</h4>
                  <p class="text-xs text-slate-500 mt-0.5">Charged per finalized property deal</p>
                </div>
                <input type="text" class="w-20 rounded-xl border border-slate-200 p-2 text-center text-sm font-semibold focus:outline-none focus:border-indigo-500" value="2.0%">
              </div>
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-bold text-slate-800">Seller Verification Policy</h4>
                  <p class="text-xs text-slate-500 mt-0.5">Require identity/phone checks before posting</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" class="sr-only peer" checked>
                  <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              <button class="w-full bg-indigo-600 py-3 rounded-2xl text-white font-bold text-sm shadow hover:bg-indigo-700 transition-all mt-4">Save Platform Settings</button>
            </div>
          </div>
        </div>
      `;
    }

    bindModalEvents();
  }

  function bindModalEvents() {
    // Modal Openers & Closers
    const setupModalTrigger = (btnId, modalId, closeId) => {
      const btn = document.getElementById(btnId);
      const modal = document.getElementById(modalId);
      const closeBtn = document.getElementById(closeId);
      
      if (btn && modal && closeBtn) {
        btn.addEventListener("click", () => {
          modal.classList.remove("hidden");
          modal.classList.add("flex");
          setTimeout(() => {
            modal.firstElementChild?.classList.remove("scale-95", "opacity-0");
          }, 50);
        });

        const closeFunc = () => {
          modal.firstElementChild?.classList.add("scale-95", "opacity-0");
          setTimeout(() => {
            modal.classList.add("hidden");
            modal.classList.remove("flex");
          }, 200);
        };

        closeBtn.addEventListener("click", closeFunc);
        modal.addEventListener("click", (e) => {
          if (e.target === modal) closeFunc();
        });
      }
    };

    // Buyer Compare Drawer Logic
    const compareBtn = document.getElementById("navCompareBtn");
    const mobileCompareBtn = document.getElementById("navMobileCompareBtn");
    const compareDrawer = document.getElementById("compareDrawer");
    const closeCompareDrawer = document.getElementById("closeCompareDrawer");

    if (compareDrawer && (compareBtn || mobileCompareBtn) && closeCompareDrawer) {
      const toggleCompare = async () => {
        const isHidden = compareDrawer.classList.contains("translate-x-full");
        if (isHidden) {
          compareDrawer.classList.remove("translate-x-full");
          await loadComparisonOptions();
        } else {
          compareDrawer.classList.add("translate-x-full");
        }
      };

      compareBtn?.addEventListener("click", toggleCompare);
      mobileCompareBtn?.addEventListener("click", toggleCompare);
      closeCompareDrawer.addEventListener("click", toggleCompare);
    }

    // Bind Seller Modal triggers
    setupModalTrigger("navInsightsBtn", "insightsModal", "closeInsightsModal");
    setupModalTrigger("navMobileInsightsBtn", "insightsModal", "closeInsightsModal");
    setupModalTrigger("navAnalyticsBtn", "analyticsModal", "closeAnalyticsModal");
    setupModalTrigger("navMobileAnalyticsBtn", "analyticsModal", "closeAnalyticsModal");

    // Bind Admin Modal triggers
    setupModalTrigger("navReportsBtn", "adminReportsModal", "closeReportsModal");
    setupModalTrigger("navMobileReportsBtn", "adminReportsModal", "closeReportsModal");
    setupModalTrigger("navSupportBtn", "adminSupportModal", "closeSupportModal");
    setupModalTrigger("navMobileSupportBtn", "adminSupportModal", "closeSupportModal");
    setupModalTrigger("navLogsBtn", "adminLogsModal", "closeLogsModal");
    setupModalTrigger("navMobileLogsBtn", "adminLogsModal", "closeLogsModal");
    setupModalTrigger("navSettingsBtn", "adminSettingsModal", "closeSettingsModal");
    setupModalTrigger("navMobileSettingsBtn", "adminSettingsModal", "closeSettingsModal");
  }

  // Load and Render Properties for Comparison (Buyer side)
  async function loadComparisonOptions() {
    const listContainer = document.getElementById("comparePropertiesSelection");
    const tableContainer = document.getElementById("comparisonResultContainer");
    if (!listContainer || !tableContainer) return;

    listContainer.innerHTML = `<p class="col-span-3 text-sm text-slate-500 text-center py-4">Loading saved properties...</p>`;
    tableContainer.classList.add("hidden");

    try {
      const res = await api.request("/favourites");
      const props = res.data.properties || [];
      
      if (!props.length) {
        listContainer.innerHTML = `<p class="col-span-3 text-sm text-slate-500 text-center py-4">No saved properties yet. Favorite properties to compare them.</p>`;
        return;
      }

      listContainer.innerHTML = props.map(p => `
        <label class="relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:border-indigo-400 cursor-pointer select-none">
          <input type="checkbox" class="compare-checkbox absolute top-2 right-2 rounded text-indigo-600 focus:ring-indigo-500" data-property-id="${p.id}" data-title="${ui.escapeHtml(p.title)}" data-price="${p.price}" data-bhk="${p.bhk}" data-area="${p.area_sqft || p.area || '-'}" data-city="${ui.escapeHtml(p.city)}">
          <div class="text-xs font-semibold text-slate-800 line-clamp-2 pr-4 mt-2">${ui.escapeHtml(p.title)}</div>
          <div class="text-xs text-indigo-600 font-bold mt-2">₹${Number(p.price).toLocaleString("en-IN")}</div>
        </label>
      `).join("");

      // Watch checkboxes
      const checkBoxes = listContainer.querySelectorAll(".compare-checkbox");
      checkBoxes.forEach(box => {
        box.addEventListener("change", () => {
          const selected = Array.from(checkBoxes).filter(c => c.checked);
          if (selected.length > 3) {
            box.checked = false;
            ui.showToast("You can compare up to 3 properties side-by-side", "error");
            return;
          }
          renderComparisonTable(selected);
        });
      });

    } catch (e) {
      listContainer.innerHTML = `<p class="col-span-3 text-sm text-rose-500 text-center py-4">Failed to load properties: ${e.message}</p>`;
    }
  }

  function renderComparisonTable(selectedNodes) {
    const container = document.getElementById("comparisonResultContainer");
    if (!container) return;

    if (selectedNodes.length < 2) {
      container.classList.add("hidden");
      container.innerHTML = "";
      return;
    }

    const properties = selectedNodes.map(node => ({
      title: node.dataset.title,
      price: Number(node.dataset.price),
      bhk: node.dataset.bhk,
      area: node.dataset.area,
      city: node.dataset.city,
    }));

    let columnsHTML = "";
    let priceRowHTML = "";
    let bhkRowHTML = "";
    let areaRowHTML = "";
    let cityRowHTML = "";

    properties.forEach(p => {
      columnsHTML += `<th class="px-4 py-3 text-sm font-bold text-slate-800 border border-slate-200 bg-indigo-50/50">${p.title}</th>`;
      priceRowHTML += `<td class="px-4 py-3 text-sm font-bold text-indigo-700 border border-slate-200">₹${p.price.toLocaleString("en-IN")}</td>`;
      bhkRowHTML += `<td class="px-4 py-3 text-sm text-slate-600 border border-slate-200">${p.bhk} BHK</td>`;
      areaRowHTML += `<td class="px-4 py-3 text-sm text-slate-600 border border-slate-200">${p.area} sqft</td>`;
      cityRowHTML += `<td class="px-4 py-3 text-sm text-slate-600 border border-slate-200">${p.city}</td>`;
    });

    container.innerHTML = `
      <table class="w-full border-collapse border border-slate-200 rounded-2xl overflow-hidden bg-white text-left">
        <thead>
          <tr>
            <th class="px-4 py-3 text-sm font-bold text-slate-500 border border-slate-200 bg-slate-50">Feature</th>
            ${columnsHTML}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="px-4 py-3 text-sm font-semibold text-slate-500 border border-slate-200 bg-slate-50/30">Price</td>
            ${priceRowHTML}
          </tr>
          <tr>
            <td class="px-4 py-3 text-sm font-semibold text-slate-500 border border-slate-200 bg-slate-50/30">BHK Type</td>
            ${bhkRowHTML}
          </tr>
          <tr>
            <td class="px-4 py-3 text-sm font-semibold text-slate-500 border border-slate-200 bg-slate-50/30">Carpet Area</td>
            ${areaRowHTML}
          </tr>
          <tr>
            <td class="px-4 py-3 text-sm font-semibold text-slate-500 border border-slate-200 bg-slate-50/30">City</td>
            ${cityRowHTML}
          </tr>
        </tbody>
      </table>
    `;
    container.classList.remove("hidden");
  }

})();
