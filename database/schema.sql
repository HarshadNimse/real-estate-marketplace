CREATE DATABASE IF NOT EXISTS real_estate_marketplace
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE real_estate_marketplace;

-- =========================
-- USERS
-- =========================
CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(191) NOT NULL,
  phone VARCHAR(20) NULL,
  password_hash VARCHAR(255) NOT NULL,

  role ENUM('buyer', 'seller', 'admin') NOT NULL DEFAULT 'buyer',

  email_verified TINYINT(1) DEFAULT 0,
  phone_verified TINYINT(1) DEFAULT 0,

  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at TIMESTAMP NULL DEFAULT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_users_email (email),
  INDEX idx_users_role (role),
  INDEX idx_users_active (is_active)
) ENGINE=InnoDB;

-- =========================
-- REFRESH TOKENS
-- =========================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_refresh_tokens_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_rt_user (user_id),
  INDEX idx_rt_hash (token_hash)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_prt_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_prt_hash (token_hash)
) ENGINE=InnoDB;

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


-- =========================
-- PROPERTIES
-- =========================
CREATE TABLE properties (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  seller_id BIGINT UNSIGNED NOT NULL,

  title VARCHAR(180) NOT NULL,
  slug VARCHAR(255) UNIQUE,

  description TEXT NOT NULL,
  price DECIMAL(12, 2) NOT NULL,

  city VARCHAR(100) NOT NULL,
  address_line VARCHAR(255) NULL,

  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,

  property_type ENUM('rent', 'sale') NOT NULL,
  bhk TINYINT UNSIGNED NOT NULL,

  area_sqft INT UNSIGNED NOT NULL,

  furnishing ENUM('furnished','semi','unfurnished') DEFAULT 'unfurnished',

  amenities JSON NULL,

  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  is_active TINYINT(1) NOT NULL DEFAULT 1,

  approved_by BIGINT UNSIGNED NULL,
  approved_at TIMESTAMP NULL DEFAULT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL,

  CONSTRAINT fk_properties_seller
    FOREIGN KEY (seller_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT fk_properties_approved_by
    FOREIGN KEY (approved_by) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL,

  CONSTRAINT chk_properties_price CHECK (price >= 0),
  CONSTRAINT chk_properties_lat CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT chk_properties_lng CHECK (longitude BETWEEN -180 AND 180),
  CONSTRAINT chk_properties_bhk CHECK (bhk BETWEEN 1 AND 20),

  INDEX idx_properties_seller_id (seller_id),
  INDEX idx_properties_status_active (status, is_active),
  INDEX idx_properties_city_type (city, property_type),
  INDEX idx_properties_status_active_city_type (status, is_active, city, property_type),
  INDEX idx_properties_price (price),
  INDEX idx_properties_bhk (bhk),
  INDEX idx_properties_created_at (created_at),
  FULLTEXT INDEX ft_properties_title_description (title, description)

) ENGINE=InnoDB;


-- =========================
-- PROPERTY IMAGES
-- =========================
CREATE TABLE property_images (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  property_id BIGINT UNSIGNED NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  cloudinary_public_id VARCHAR(191) NULL,

  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_property_images_property
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  INDEX idx_property_images_property_id (property_id),
  INDEX idx_property_images_primary (property_id, is_primary),
  INDEX idx_property_images_sort (property_id, sort_order)

) ENGINE=InnoDB;


-- =========================
-- INQUIRIES
-- =========================
CREATE TABLE inquiries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  property_id BIGINT UNSIGNED NOT NULL,
  buyer_id BIGINT UNSIGNED NOT NULL,
  seller_id BIGINT UNSIGNED NOT NULL,

  message TEXT NOT NULL,
  contact_phone VARCHAR(20) NULL,

  status ENUM('open', 'responded', 'closed') NOT NULL DEFAULT 'open',

  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_inquiries_property
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT fk_inquiries_buyer
    FOREIGN KEY (buyer_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT fk_inquiries_seller
    FOREIGN KEY (seller_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  INDEX idx_inquiries_property_id (property_id),
  INDEX idx_inquiries_buyer_id (buyer_id),
  INDEX idx_inquiries_seller_id (seller_id),
  INDEX idx_inquiries_seller_status (seller_id, status),
  INDEX idx_inquiries_buyer_status (buyer_id, status),
  INDEX idx_inquiries_status_created (status, created_at)

) ENGINE=InnoDB;


-- =========================
-- FAVORITES (Wishlist)
-- =========================
CREATE TABLE favorites (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  user_id BIGINT UNSIGNED NOT NULL,
  property_id BIGINT UNSIGNED NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_favorites_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_favorites_property
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE CASCADE,

  UNIQUE KEY uk_user_property (user_id, property_id),

  INDEX idx_favorites_user (user_id),
  INDEX idx_favorites_property (property_id)

) ENGINE=InnoDB;


-- =========================
-- PROPERTY VIEWS (Analytics)
-- =========================
CREATE TABLE property_views (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  property_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,

  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_views_property
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_views_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL,

  INDEX idx_views_property (property_id),
  INDEX idx_views_user (user_id)

) ENGINE=InnoDB;