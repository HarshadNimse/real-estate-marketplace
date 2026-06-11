(function () {
  const isLocalhost =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const apiBase = isLocalhost
    ? "http://localhost:5000/api"
    : `${window.location.origin}/api`;

  window.APP_CONFIG = {
    API_BASE_URL: apiBase,
    TOKEN_KEY: "rem_jwt_token",
    USER_KEY: "rem_user",
  };
})();
