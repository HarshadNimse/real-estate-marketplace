-- Refresh token rotation / reuse detection
-- mysql -u root -p real_estate_marketplace < database/migrations/refresh_token_used_at.sql

USE real_estate_marketplace;

ALTER TABLE refresh_tokens
  ADD COLUMN used_at TIMESTAMP NULL DEFAULT NULL AFTER expires_at;
