function buildQuery(params) {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, value);
    }
  });
  return search.toString();
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    if (err && (err.name === "QuotaExceededError" || err.code === 22)) {
      console.warn("localStorage quota exceeded for key:", key);
    } else {
      console.warn("localStorage setItem failed:", err);
    }
    return false;
  }
}

let isLoggingOut = false;
let isRefreshing = false;

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem(window.APP_CONFIG.TOKEN_KEY);
  const headers = {
    ...(options.headers || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let response;
  try {
    response = await fetch(`${window.APP_CONFIG.API_BASE_URL}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body,
    });
  } catch (networkError) {
    const error = new Error(
      "Cannot connect to API server. Please ensure backend is running on http://localhost:5000."
    );
    error.status = 0;
    console.error("API Network Error:", networkError);
    throw error;
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : { success: response.ok, message: await response.text() };

  if (response.ok && payload && payload.success === false) {
    const error = new Error(payload.message || "Request failed.");
    error.status = response.status;
    error.payload = payload;
    console.error("API Error:", error);
    throw error;
  }

  if (response.status === 401) {
    const skipRefresh =
      path.startsWith("/auth/login") ||
      path.startsWith("/auth/register") ||
      path.startsWith("/auth/refresh") ||
      path.startsWith("/auth/logout");

    if (!skipRefresh && !isRefreshing) {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          isRefreshing = true;
          const refreshResponse = await fetch(
            `${window.APP_CONFIG.API_BASE_URL}/auth/refresh`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken }),
            }
          );
          const refreshPayload = await refreshResponse.json();
          if (refreshResponse.ok && refreshPayload.success && window.auth?.setSession) {
            window.auth.setSession(refreshPayload.data);
            isRefreshing = false;
            return apiRequest(path, options);
          }
        } catch (refreshError) {
          console.error("Refresh token flow failed:", refreshError);
        } finally {
          isRefreshing = false;
        }
      }
    }

    const skipAutoLogout = path.startsWith("/auth/login") || path.startsWith("/auth/register");
    if (!skipAutoLogout && !isLoggingOut && window.auth && typeof window.auth.logout === "function") {
      isLoggingOut = true;
      window.auth.logout("./login.html");
      setTimeout(() => {
        isLoggingOut = false;
      }, 3000);
      const logoutError = new Error("Session expired. Please login again.");
      logoutError.status = 401;
      logoutError.payload = payload;
      throw logoutError;
    }

    const error = new Error(
      skipAutoLogout ? payload.message || "Invalid credentials." : "Session expired. Please login again."
    );
    error.status = 401;
    error.payload = payload;
    console.error("API Error:", error);
    throw error;
  }

  if (!response.ok) {
    let message = payload.message || "Request failed.";
    if (response.status === 403) {
      message = payload.message || "You are not authorized to perform this action.";
    } else if (response.status === 404) {
      message = payload.message || "Requested resource was not found.";
    }

    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    console.error("API Error:", error);
    throw error;
  }

  return payload;
}

window.api = {
  buildQuery,
  request: apiRequest,
  safeStorageSet,
};
