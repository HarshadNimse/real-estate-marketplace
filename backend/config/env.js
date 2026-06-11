const dotenv = require("dotenv");

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "real_estate_marketplace",
    connectionLimit: Number(process.env.DB_POOL_LIMIT || 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || "",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  },
  email: {
    host: process.env.EMAIL_HOST || "",
    port: Number(process.env.EMAIL_PORT || 587),
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
    from: process.env.EMAIL_FROM || "noreply@estatehub.com",
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  },
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5500",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5500",
  requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === "true",
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 12),
};

if (env.bcryptSaltRounds < 10) {
  throw new Error("BCRYPT_SALT_ROUNDS must be at least 10.");
}

if (!env.jwt.secret || env.jwt.secret.length < 32) {
  throw new Error(
    "JWT_SECRET must be set in .env and be at least 32 cryptographically random characters. " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  );
}

module.exports = env;
