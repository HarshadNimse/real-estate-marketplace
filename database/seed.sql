USE real_estate_marketplace;

INSERT INTO users (full_name, email, phone, password_hash, role, is_active, email_verified)
VALUES
  ('Admin User', 'admin@example.com', '9990000001', '$2b$12$2TRMbem9SjrfFqO9TyZecu4GQnw.X03x89Dik3FuvmkC4pK9JYQHK', 'admin', 1, 1),
  ('Seller One', 'seller1@example.com', '9990000002', '$2b$12$2TRMbem9SjrfFqO9TyZecu4GQnw.X03x89Dik3FuvmkC4pK9JYQHK', 'seller', 1, 1),
  ('Seller Two', 'seller2@example.com', '9990000003', '$2b$12$2TRMbem9SjrfFqO9TyZecu4GQnw.X03x89Dik3FuvmkC4pK9JYQHK', 'seller', 1, 1),
  ('Buyer One', 'buyer1@example.com', '9990000004', '$2b$12$2TRMbem9SjrfFqO9TyZecu4GQnw.X03x89Dik3FuvmkC4pK9JYQHK', 'buyer', 1, 1)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), phone = VALUES(phone), role = VALUES(role), is_active = 1;

INSERT INTO properties (
  seller_id, title, slug, description, price, city, address_line,
  latitude, longitude, property_type, bhk, area_sqft, furnishing,
  amenities, status, is_active, approved_by, approved_at
)
SELECT
  s.id,
  '2BHK Apartment in Pune',
  '2bhk-apartment-in-pune',
  'Spacious 2BHK apartment near metro station.',
  45000,
  'Pune',
  'Kothrud',
  18.5074,
  73.8077,
  'rent',
  2,
  920,
  'semi',
  JSON_ARRAY('Lift', 'Parking', 'Power Backup'),
  'approved',
  1,
  a.id,
  CURRENT_TIMESTAMP
FROM users s
CROSS JOIN users a
WHERE s.email = 'seller1@example.com' AND a.email = 'admin@example.com'
  AND NOT EXISTS (SELECT 1 FROM properties WHERE slug = '2bhk-apartment-in-pune');

INSERT INTO properties (
  seller_id, title, slug, description, price, city, address_line,
  latitude, longitude, property_type, bhk, area_sqft, furnishing,
  amenities, status, is_active
)
SELECT
  s.id,
  '3BHK Villa in Bangalore',
  '3bhk-villa-in-bangalore',
  'Independent villa with private garden.',
  12500000,
  'Bangalore',
  'Whitefield',
  12.9698,
  77.7500,
  'sale',
  3,
  2100,
  'furnished',
  JSON_ARRAY('Garden', 'Security', 'Parking'),
  'pending',
  1
FROM users s
WHERE s.email = 'seller2@example.com'
  AND NOT EXISTS (SELECT 1 FROM properties WHERE slug = '3bhk-villa-in-bangalore');

INSERT INTO properties (
  seller_id, title, slug, description, price, city, address_line,
  latitude, longitude, property_type, bhk, area_sqft, furnishing,
  amenities, status, is_active, approved_by, approved_at
)
SELECT
  s.id,
  '1BHK Studio in Mumbai',
  '1bhk-studio-in-mumbai',
  'Compact studio suitable for working professionals.',
  32000,
  'Mumbai',
  'Andheri East',
  19.1136,
  72.8697,
  'rent',
  1,
  520,
  'unfurnished',
  JSON_ARRAY('Lift', 'CCTV'),
  'approved',
  1,
  a.id,
  CURRENT_TIMESTAMP
FROM users s
CROSS JOIN users a
WHERE s.email = 'seller1@example.com' AND a.email = 'admin@example.com'
  AND NOT EXISTS (SELECT 1 FROM properties WHERE slug = '1bhk-studio-in-mumbai');

INSERT INTO property_images (property_id, image_url, cloudinary_public_id, is_primary, sort_order)
SELECT p.id, 'https://placehold.co/700x450?text=Pune+2BHK', NULL, 1, 0
FROM properties p
WHERE p.slug = '2bhk-apartment-in-pune'
  AND NOT EXISTS (SELECT 1 FROM property_images pi WHERE pi.property_id = p.id);

INSERT INTO property_images (property_id, image_url, cloudinary_public_id, is_primary, sort_order)
SELECT p.id, 'https://placehold.co/700x450?text=Bangalore+Villa', NULL, 1, 0
FROM properties p
WHERE p.slug = '3bhk-villa-in-bangalore'
  AND NOT EXISTS (SELECT 1 FROM property_images pi WHERE pi.property_id = p.id);

INSERT INTO property_images (property_id, image_url, cloudinary_public_id, is_primary, sort_order)
SELECT p.id, 'https://placehold.co/700x450?text=Mumbai+Studio', NULL, 1, 0
FROM properties p
WHERE p.slug = '1bhk-studio-in-mumbai'
  AND NOT EXISTS (SELECT 1 FROM property_images pi WHERE pi.property_id = p.id);

INSERT INTO properties (
  seller_id, title, slug, description, price, city, address_line,
  latitude, longitude, property_type, bhk, area_sqft, furnishing,
  amenities, status, is_active, approved_by, approved_at
)
SELECT
  s.id,
  'Luxury 4BHK Penthouse in Pune',
  'luxury-4bhk-penthouse-pune',
  'Premium penthouse with city skyline view and private terrace.',
  35000000,
  'Pune',
  'Baner',
  18.5590,
  73.7868,
  'sale',
  4,
  2800,
  'furnished',
  JSON_ARRAY('Lift', 'Security', 'Gym', 'Clubhouse', 'Power Backup'),
  'approved',
  1,
  a.id,
  CURRENT_TIMESTAMP
FROM users s
CROSS JOIN users a
WHERE s.email = 'seller1@example.com' AND a.email = 'admin@example.com'
  AND NOT EXISTS (SELECT 1 FROM properties WHERE slug = 'luxury-4bhk-penthouse-pune');

INSERT INTO properties (
  seller_id, title, slug, description, price, city, address_line,
  latitude, longitude, property_type, bhk, area_sqft, furnishing,
  amenities, status, is_active
)
SELECT
  s.id,
  '2BHK Family Flat in Thane',
  '2bhk-family-flat-thane',
  'Well-connected family apartment close to schools and metro.',
  52000,
  'Mumbai',
  'Thane West',
  19.2183,
  72.9781,
  'rent',
  2,
  980,
  'semi',
  JSON_ARRAY('Parking', 'Lift', 'CCTV'),
  'pending',
  1
FROM users s
WHERE s.email = 'seller2@example.com'
  AND NOT EXISTS (SELECT 1 FROM properties WHERE slug = '2bhk-family-flat-thane');

INSERT INTO properties (
  seller_id, title, slug, description, price, city, address_line,
  latitude, longitude, property_type, bhk, area_sqft, furnishing,
  amenities, status, is_active, approved_by, approved_at
)
SELECT
  s.id,
  '3BHK Smart Home in Bangalore',
  '3bhk-smart-home-bangalore',
  'Modern smart-home apartment near IT corridor.',
  18000000,
  'Bangalore',
  'Whitefield',
  12.9716,
  77.5946,
  'sale',
  3,
  1680,
  'furnished',
  JSON_ARRAY('Smart Locks', 'Power Backup', 'Gym', 'Pool'),
  'approved',
  1,
  a.id,
  CURRENT_TIMESTAMP
FROM users s
CROSS JOIN users a
WHERE s.email = 'seller1@example.com' AND a.email = 'admin@example.com'
  AND NOT EXISTS (SELECT 1 FROM properties WHERE slug = '3bhk-smart-home-bangalore');

INSERT INTO properties (
  seller_id, title, slug, description, price, city, address_line,
  latitude, longitude, property_type, bhk, area_sqft, furnishing,
  amenities, status, is_active, approved_by, approved_at
)
SELECT
  s.id,
  'Affordable 1BHK in Pune',
  'affordable-1bhk-pune',
  'Budget-friendly starter home with excellent connectivity.',
  18000,
  'Pune',
  'Hadapsar',
  18.5089,
  73.9260,
  'rent',
  1,
  540,
  'unfurnished',
  JSON_ARRAY('CCTV', 'Water Supply'),
  'approved',
  1,
  a.id,
  CURRENT_TIMESTAMP
FROM users s
CROSS JOIN users a
WHERE s.email = 'seller2@example.com' AND a.email = 'admin@example.com'
  AND NOT EXISTS (SELECT 1 FROM properties WHERE slug = 'affordable-1bhk-pune');

INSERT INTO properties (
  seller_id, title, slug, description, price, city, address_line,
  latitude, longitude, property_type, bhk, area_sqft, furnishing,
  amenities, status, is_active
)
SELECT
  s.id,
  '2BHK Near Metro in Delhi',
  '2bhk-near-metro-delhi',
  'Metro-connected flat ideal for professionals.',
  42000,
  'Delhi',
  'Dwarka',
  28.5921,
  77.0460,
  'rent',
  2,
  890,
  'semi',
  JSON_ARRAY('Lift', 'Parking', 'Security'),
  'pending',
  1
FROM users s
WHERE s.email = 'seller1@example.com'
  AND NOT EXISTS (SELECT 1 FROM properties WHERE slug = '2bhk-near-metro-delhi');

INSERT INTO property_images (property_id, image_url, cloudinary_public_id, is_primary, sort_order)
SELECT p.id, 'https://placehold.co/700x450?text=Luxury+Penthouse+Pune', NULL, 1, 0
FROM properties p
WHERE p.slug = 'luxury-4bhk-penthouse-pune'
  AND NOT EXISTS (SELECT 1 FROM property_images pi WHERE pi.property_id = p.id);

INSERT INTO property_images (property_id, image_url, cloudinary_public_id, is_primary, sort_order)
SELECT p.id, 'https://placehold.co/700x450?text=2BHK+Thane', NULL, 1, 0
FROM properties p
WHERE p.slug = '2bhk-family-flat-thane'
  AND NOT EXISTS (SELECT 1 FROM property_images pi WHERE pi.property_id = p.id);

INSERT INTO property_images (property_id, image_url, cloudinary_public_id, is_primary, sort_order)
SELECT p.id, 'https://placehold.co/700x450?text=Smart+Home+Bangalore', NULL, 1, 0
FROM properties p
WHERE p.slug = '3bhk-smart-home-bangalore'
  AND NOT EXISTS (SELECT 1 FROM property_images pi WHERE pi.property_id = p.id);

INSERT INTO property_images (property_id, image_url, cloudinary_public_id, is_primary, sort_order)
SELECT p.id, 'https://placehold.co/700x450?text=Affordable+1BHK+Pune', NULL, 1, 0
FROM properties p
WHERE p.slug = 'affordable-1bhk-pune'
  AND NOT EXISTS (SELECT 1 FROM property_images pi WHERE pi.property_id = p.id);

INSERT INTO property_images (property_id, image_url, cloudinary_public_id, is_primary, sort_order)
SELECT p.id, 'https://placehold.co/700x450?text=2BHK+Delhi', NULL, 1, 0
FROM properties p
WHERE p.slug = '2bhk-near-metro-delhi'
  AND NOT EXISTS (SELECT 1 FROM property_images pi WHERE pi.property_id = p.id);
