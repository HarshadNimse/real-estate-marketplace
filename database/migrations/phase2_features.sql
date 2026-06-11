-- Run on existing databases: mysql -u root -p real_estate_marketplace < database/migrations/phase2_features.sql

USE real_estate_marketplace;

-- Refresh token rotation / reuse detection (safe to re-run: ignore duplicate column error)
ALTER TABLE refresh_tokens
  ADD COLUMN used_at TIMESTAMP NULL DEFAULT NULL AFTER expires_at;

-- Full-text search on listings
ALTER TABLE properties
  ADD FULLTEXT INDEX ft_properties_title_description (title, description);

-- Email verification tokens (same pattern as password reset)
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_evt_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_evt_hash (token_hash)
) ENGINE=InnoDB;
