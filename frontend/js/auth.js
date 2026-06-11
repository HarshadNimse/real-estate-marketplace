function getToken() {
  return localStorage.getItem(window.APP_CONFIG.TOKEN_KEY);
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(window.APP_CONFIG.USER_KEY) || "null");
  } catch (error) {
    return null;
  }
}

function setSession(data) {
  const token = data.accessToken || data.token;
  const set =
    window.api?.safeStorageSet ||
    ((key, value) => {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    });
  let ok = true;
  if (token) ok = set(window.APP_CONFIG.TOKEN_KEY, token) && ok;
  if (data.refreshToken) ok = set("refreshToken", data.refreshToken) && ok;
  if (data.user) ok = set(window.APP_CONFIG.USER_KEY, JSON.stringify(data.user)) && ok;
  if (!ok) {
    console.warn("Session could not be saved to localStorage (quota or privacy mode).");
  }
  return ok;
}

function clearSession() {
  localStorage.removeItem(window.APP_CONFIG.TOKEN_KEY);
  localStorage.removeItem(window.APP_CONFIG.USER_KEY);
  localStorage.removeItem("refreshToken");
}

function isLoggedIn() {
  return Boolean(getToken() && getUser());
}

function logout(redirectTo) {
  const rt = localStorage.getItem("refreshToken");
  if (rt) {
    fetch(`${window.APP_CONFIG.API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: rt }),
    }).catch(() => {});
  }
  clearSession();
  if (redirectTo) window.location.href = redirectTo;
}

function requireAuth(allowedRoles) {
  const user = getUser();
  const token = getToken();
  if (!user || !token) {
    window.location.href = "./login.html";
    return null;
  }
  if (allowedRoles && allowedRoles.length && !allowedRoles.includes(user.role)) {
    window.location.href = "./login.html";
    return null;
  }
  return user;
}

window.auth = {
  getToken,
  getUser,
  getCurrentUser: getUser,
  setSession,
  saveAuth: setSession,
  clearSession,
  clearAuth: clearSession,
  isLoggedIn,
  logout,
  requireAuth,
};
