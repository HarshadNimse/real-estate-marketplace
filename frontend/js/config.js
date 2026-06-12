(function () {
  const isLocalDevelopment =
    window.location.protocol === "file:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const apiBase = isLocalDevelopment
    ? "http://localhost:5000/api"
    : `${window.location.origin}/api`;

  window.APP_CONFIG = {
    API_BASE_URL: apiBase,
    TOKEN_KEY: "rem_jwt_token",
    USER_KEY: "rem_user",
  };
})();
