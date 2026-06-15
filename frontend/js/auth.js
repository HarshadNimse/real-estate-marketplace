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
  if (token) localStorage.setItem(window.APP_CONFIG.TOKEN_KEY, token);
  if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
  if (data.user) localStorage.setItem(window.APP_CONFIG.USER_KEY, JSON.stringify(data.user));
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
