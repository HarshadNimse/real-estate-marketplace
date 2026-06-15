USE real_estate_marketplace;

-- ==========================================
-- CHAT MESSAGES FOR INQUIRIES
-- ==========================================
CREATE TABLE IF NOT EXISTS inquiry_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  inquiry_id BIGINT UNSIGNED NOT NULL,
  sender_id BIGINT UNSIGNED NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_im_inquiry
    FOREIGN KEY (inquiry_id) REFERENCES inquiries(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_im_sender
    FOREIGN KEY (sender_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX idx_im_inquiry (inquiry_id),
  INDEX idx_im_created (created_at)
) ENGINE=InnoDB;

-- ==========================================
-- SYSTEM SETTINGS FOR ADMIN
-- ==========================================
CREATE TABLE IF NOT EXISTS admin_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Seed default settings
INSERT IGNORE INTO admin_settings (setting_key, setting_value)
VALUES ('platform_commission', '5.0');
