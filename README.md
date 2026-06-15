# Real Estate Marketplace

Full-stack Housing.com-style platform: Node/Express API, MySQL, vanilla HTML/CSS/JS frontend.

## Project Structure

```text
/real-estate-marketplace
  /frontend
    /css
    /js
    /pages
  /backend
    /config
    /controllers
    /models
    /routes
    /middlewares
    /services
  /database
    schema.sql
  server.js
  .env.example
```

### Structure Purpose

- `frontend`: HTML/CSS/Vanilla JS app (pages, scripts, and styles).
- `backend`: Express app split by concern:
  - `config`: db/env/app configuration
  - `controllers`: request handlers
  - `models`: SQL access layer
  - `routes`: API endpoints
  - `middlewares`: auth/validation/errors
  - `services`: reusable business logic (JWT, uploads, etc.)
- `database/schema.sql`: MySQL schema with keys, checks, and indexes.
- `server.js`: backend startup entry point.

## MySQL Schema

Schema file: `database/schema.sql`

### Tables

- `users`
  - Stores buyers, sellers, and admins.
  - `role`: `buyer | seller | admin`.
  - Unique email with role and active-status indexes.

- `properties`
  - Core property record owned by a seller.
  - Includes `city`, coordinates, `property_type`, `bhk`, `amenities` (JSON), and approval status.
  - Approval fields: `status`, `approved_by`, `approved_at`.
  - Check constraints for price, lat/lng, and bhk range.

- `property_images`
  - One-to-many images per property.
  - Stores image URL and optional Cloudinary public id.
  - Supports primary image and order.

- `inquiries`
  - Contact messages from buyer to seller for a property.
  - Tracks status (`open | responded | closed`).

### Relationships (Foreign Keys)

- `properties.seller_id -> users.id` (`RESTRICT` delete): prevents deleting sellers with active properties.
- `properties.approved_by -> users.id` (`SET NULL` delete): keeps property history even if admin is removed.
- `property_images.property_id -> properties.id` (`CASCADE` delete): removes property images if property is deleted.
- `inquiries.property_id -> properties.id` (`CASCADE` delete): removes linked inquiries when property is deleted.
- `inquiries.buyer_id -> users.id` (`RESTRICT` delete): keeps inquiry integrity.
- `inquiries.seller_id -> users.id` (`RESTRICT` delete): keeps inquiry integrity.

### Indexing Strategy

- `users`: email uniqueness, role-based filtering, active-status lookup.
- `properties`: composite index for listing visibility (`status`, `is_active`), city+type filter, price sorting/filtering, bhk filter, and created date ordering.
- `property_images`: fast fetch for gallery, primary image retrieval, and ordered display.
- `inquiries`: fast dashboard queries by property, buyer, seller, and status timeline.

## Setup Instructions

### 1) Create and import DB

1. Start MySQL.
2. Run:

```sql
SOURCE /absolute/path/to/real-estate-marketplace/database/schema.sql;
```

Or from terminal:

```bash
mysql -u root -p < database/schema.sql
```

### 2) Prepare environment file

1. Copy `.env.example` to `.env`.
2. Update MySQL credentials and secrets.
3. Minimum required values:
   - `DB_HOST`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
   - `JWT_SECRET`

### 3) Verify schema

Run:

```sql
USE real_estate_marketplace;
SHOW TABLES;
```

Expected key tables:
- `users`
- `properties`
- `property_images`
- `inquiries`

### 4) Install backend dependencies

```bash
npm install
```

### 5) Run API server

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Health endpoint:

```http
GET /api/health
```

---

## Step 2: Backend + Auth

### Implemented Components

- Express server boot in `server.js`.
- DB pooling in `backend/config/db.js` using `mysql2/promise`.
- JWT and bcrypt services:
  - `backend/services/jwtService.js`
  - `backend/services/passwordService.js`
- Auth model/controller/routes:
  - `backend/models/userModel.js`
  - `backend/controllers/authController.js`
  - `backend/routes/authRoutes.js`
- Auth and role middlewares:
  - `backend/middlewares/authMiddleware.js`
  - `backend/middlewares/roleMiddleware.js`
- Shared app setup:
  - `backend/app.js`
  - `backend/middlewares/notFoundMiddleware.js`
  - `backend/middlewares/errorMiddleware.js`

### Auth Token Flow

1. Client calls `POST /api/auth/register` or `POST /api/auth/login`.
2. API validates payload and role.
3. Password is hashed/verified using bcrypt.
4. On success, server signs JWT with:
   - `sub` (user id)
   - `role`
5. Client stores token and sends:
   - `Authorization: Bearer <token>`
6. `requireAuth` middleware verifies token and fetches current user from DB.
7. `requireRole` enforces role permissions on protected routes.

### Role-based Access

- Registration allows only:
  - `buyer`
  - `seller`
- `admin` can be created directly in DB/seed scripts.
- `requireRole(...roles)` blocks unauthorized users with HTTP `403`.
- Demo protected admin route:
  - `GET /api/admin/health` (admin only)

### Auth & account API (summary)

- `POST /api/auth/register` | `POST /api/auth/login`
- `POST /api/auth/refresh` | `POST /api/auth/logout`
- `POST /api/auth/forgot-password` | `POST /api/auth/reset-password`
- `POST /api/auth/send-verification-email` | `POST /api/auth/verify-email`
- `GET /api/auth/me` | `PUT /api/auth/me` | `POST /api/auth/me/change-password`

### Favourites (buyer)

- `GET /api/favourites` | `POST /api/favourites/:propertyId` | `DELETE /api/favourites/:propertyId`

### Admin

- `GET /api/admin/stats` | `GET /api/admin/users` | `PATCH /api/admin/users/:id/toggle-status`
- `GET /api/properties/admin/all` (property moderation)

### Public listing query params

`GET /api/properties` supports: `q`, `city` (partial match), `property_type`, `bhk`, `minPrice`, `maxPrice`, `minArea`, `maxArea`, `furnishing`, `sortBy`, `sortOrder`, `limit`, `offset`.

### Step 2 API Endpoints

- `POST /api/auth/register`
  - body:
    ```json
    {
      "fullName": "Harshad Nimse",
      "email": "harshad@example.com",
      "phone": "9999999999",
      "password": "StrongPass123",
      "role": "seller"
    }
    ```
- `POST /api/auth/login`
  - body:
    ```json
    {
      "email": "harshad@example.com",
      "password": "StrongPass123"
    }
    ```
- `GET /api/auth/me`
  - header: `Authorization: Bearer <token>`
- `GET /api/admin/health`
  - header: `Authorization: Bearer <admin_token>`

### Error Handling Rules Implemented

- `400`: invalid request payload
- `401`: invalid/missing token or bad credentials
- `403`: authenticated but not authorized
- `404`: route not found
- `409`: duplicate email on registration
- `500`: unhandled server errors (safe message)

### Login Security Notes

- Inactive users do not receive tokens; login returns `401 Invalid credentials`.
- Successful login updates `users.last_login_at` for audit/analytics.
- If your DB was created before this change, run:

```sql
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL DEFAULT NULL;
```

---

## Step 3: Property Module

### Architecture Compliance

- Controllers remain thin (`backend/controllers/propertyController.js`).
- Business logic lives in services (`backend/services/propertyService.js`).
- SQL queries are in models only:
  - `backend/models/propertyModel.js`
  - `backend/models/propertyImageModel.js`

### Property APIs

- `POST /api/properties` (seller only) - create property (status defaults to `pending`).
- `GET /api/properties` (public) - only `approved`, `is_active=1`, `deleted_at IS NULL`.
- `GET /api/properties/:id` (public/private visibility rules applied).
- `PUT /api/properties/:id` (owner or admin) - updates property and resets status to `pending`.
- `DELETE /api/properties/:id` (owner or admin) - soft delete (`deleted_at`, `is_active=0`).
- `PATCH /api/properties/:id/status` (admin only) - approve/reject.
- `GET /api/properties/mine` (seller only) - includes own pending properties.

### Filters, Sorting, Pagination

`GET /api/properties` query params:
- `city`
- `property_type` (`rent` or `sale`)
- `bhk`
- `minPrice`
- `maxPrice`
- `limit` (1-50, default 10)
- `offset` (>=0, default 0)
- `sortBy` (`price` or `created_at`, default `created_at`)
- `sortOrder` (`asc` or `desc`, default `desc`)

### Validation Rules

All inputs validated before DB operations:
- coordinates (`latitude`, `longitude`) ranges enforced
- `price >= 0`
- `bhk` integer between 1 and 20
- `area_sqft` integer >= 100
- valid enums (`property_type`, `furnishing`, admin status payload)
- clear `400` errors for bad payloads

### Image Uploads

- Upload middleware: Multer memory storage, image-only files, max 10 files.
- Cloudinary uploader stores files and returns:
  - `image_url`
  - `cloudinary_public_id`
- DB persistence in `property_images`.
- First uploaded image is marked `is_primary=1`.
- On image replacement, the service enforces exactly one primary image (first in uploaded order).
- Current soft-delete flow keeps Cloudinary files (intentional for audit/recovery). If you later add hard delete, remove Cloudinary assets using stored `cloudinary_public_id`.

### Update Status Rule (Seller vs Admin)

- Seller update (`PUT /api/properties/:id`) resets listing to `pending`.
- Admin update (`PUT /api/properties/:id`) keeps current approval status unchanged.

### Postman Examples

#### 1) Create Property (Seller)

`POST /api/properties`

Headers:
- `Authorization: Bearer <seller_token>`
- `Content-Type: multipart/form-data`

Body (`form-data`):
- `title`: `2BHK Near Metro`
- `description`: `Well ventilated apartment`
- `price`: `42000`
- `city`: `Pune`
- `address_line`: `Kothrud`
- `latitude`: `18.5074`
- `longitude`: `73.8077`
- `property_type`: `rent`
- `bhk`: `2`
- `area_sqft`: `920`
- `furnishing`: `semi`
- `amenities`: `["Lift","Parking","Power Backup"]`
- `images`: select multiple image files

Sample response:

```json
{
  "success": true,
  "message": "Property created and submitted for approval.",
  "data": {
    "property": {
      "id": 10,
      "status": "pending"
    },
    "images": [
      {
        "image_url": "https://res.cloudinary.com/.../image/upload/...",
        "is_primary": 1
      }
    ]
  }
}
```

#### 2) Public List with Filters

`GET /api/properties?city=Pune&property_type=rent&minPrice=20000&maxPrice=60000&bhk=2&limit=10&offset=0&sortBy=price&sortOrder=asc`

Sample response:

```json
{
  "success": true,
  "message": "Properties fetched successfully.",
  "data": {
    "properties": [],
    "pagination": {
      "total": 0,
      "limit": 10,
      "offset": 0
    }
  }
}
```

#### 3) Get Single Property

`GET /api/properties/10`

Sample response:

```json
{
  "success": true,
  "message": "Property fetched successfully.",
  "data": {
    "property": {
      "id": 10,
      "title": "2BHK Near Metro"
    },
    "images": []
  }
}
```

#### 4) Update Property (Owner/Admin)

`PUT /api/properties/10`

Headers:
- `Authorization: Bearer <seller_or_admin_token>`
- `Content-Type: multipart/form-data`

Sample response:

```json
{
  "success": true,
  "message": "Property updated and moved to pending review.",
  "data": {
    "property": {
      "id": 10,
      "status": "pending"
    }
  }
}
```

#### 5) Soft Delete Property

`DELETE /api/properties/10`

Headers:
- `Authorization: Bearer <seller_or_admin_token>`

Sample response:

```json
{
  "success": true,
  "message": "Property deleted successfully."
}
```

#### 6) Admin Approve/Reject

`PATCH /api/properties/10/status`

Headers:
- `Authorization: Bearer <admin_token>`
- `Content-Type: application/json`

Body:

```json
{
  "status": "approved"
}
```

Sample response:

```json
{
  "success": true,
  "message": "Property status updated successfully.",
  "data": {
    "property": {
      "id": 10,
      "status": "approved"
    }
  }
}
```

#### 7) Seller Own Listings (includes pending)

`GET /api/properties/mine`

Headers:
- `Authorization: Bearer <seller_token>`

Sample response:

```json
{
  "success": true,
  "message": "Your properties fetched successfully.",
  "data": {
    "properties": []
  }
}
```

---

## Step 4: Inquiry Module

### Architecture Compliance

- Controllers are thin in `backend/controllers/inquiryController.js`.
- Business logic is in `backend/services/inquiryService.js`.
- SQL queries are only in `backend/models/inquiryModel.js`.

### Inquiry APIs

- `POST /api/inquiries` (buyer only)
  - validates `property_id` and message
  - blocks contacting own property
  - allows inquiries only on approved + active + non-deleted properties
- `GET /api/inquiries/seller` (seller only)
  - seller inbox across their listed properties
  - includes property + buyer details through JOINs
  - supports pagination (`limit`, `offset`)
- `GET /api/inquiries/buyer` (buyer only)
  - buyer inquiry history
  - includes property + seller details through JOINs
  - supports pagination (`limit`, `offset`)
- `PATCH /api/inquiries/:id/status` (buyer or seller)
  - seller can set `responded` or `closed`
  - buyer can set only `closed`
  - strict ownership checks enforced
  - transition rules enforced: `open -> responded/closed`, `responded -> closed`, `closed -> no change`

### Additional Inquiry Safeguards

- Duplicate active inquiry prevention: same buyer cannot create another inquiry for the same property while one is `open` or `responded`.
- `last_message_at` updates when inquiry status changes.
- Added query-performance indexes:
  - `(seller_id, status)`
  - `(buyer_id, status)`

### Postman Examples

#### 1) Create Inquiry (Buyer)

`POST /api/inquiries`

Headers:
- `Authorization: Bearer <buyer_token>`
- `Content-Type: application/json`

Body:

```json
{
  "property_id": 10,
  "message": "I am interested. Is this available for immediate move-in?",
  "contact_phone": "9999999999"
}
```

Sample response:

```json
{
  "success": true,
  "message": "Inquiry created successfully.",
  "data": {
    "inquiry": {
      "id": 3,
      "property_id": 10,
      "buyer_id": 12,
      "seller_id": 5,
      "status": "open"
    }
  }
}
```

#### 2) Seller Inbox

`GET /api/inquiries/seller`

Headers:
- `Authorization: Bearer <seller_token>`

Sample response:

```json
{
  "success": true,
  "message": "Seller inquiries fetched successfully.",
  "data": {
    "inquiries": []
  }
}
```

#### 3) Buyer History

`GET /api/inquiries/buyer`

Headers:
- `Authorization: Bearer <buyer_token>`

Sample response:

```json
{
  "success": true,
  "message": "Buyer inquiries fetched successfully.",
  "data": {
    "inquiries": []
  }
}
```

#### 4) Update Inquiry Status

`PATCH /api/inquiries/3/status`

Headers:
- `Authorization: Bearer <seller_or_buyer_token>`
- `Content-Type: application/json`

Body:

```json
{
  "status": "responded"
}
```

---

## Step 5: Frontend Integration (HTML/CSS/Vanilla JS)

### Frontend Structure

```text
/frontend
  /pages
  /css
  /js
```

### Implemented Pages

- `frontend/pages/index.html` - home + property listing with filters/pagination.
- `frontend/pages/login.html` - login page.
- `frontend/pages/register.html` - register page.
- `frontend/pages/property.html` - property details + contact owner form.
- `frontend/pages/buyer-dashboard.html` - buyer inquiry history.
- `frontend/pages/seller-dashboard.html` - seller properties + seller inbox.

### Implemented JS Modules

- `frontend/js/config.js` - API base URL and auth storage keys.
- `frontend/js/api.js` - reusable `fetch` wrapper + query builder.
- `frontend/js/auth.js` - token/user storage, guards, role redirects.
- `frontend/js/ui.js` - reusable UI helpers and property card renderer.
- page-level scripts for each page in `frontend/js/*.js`.

### Backend API Wiring

- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- Properties:
  - `GET /api/properties`
  - `GET /api/properties/:id`
  - `GET /api/properties/slug/:slug`
  - `GET /api/properties/mine`
- Inquiries:
  - `POST /api/inquiries`
  - `GET /api/inquiries/buyer`
  - `GET /api/inquiries/seller`

### Frontend Behavior Rules Implemented

- JWT saved in `localStorage` after login/register.
- Auth header automatically added by API helper.
- Loading state + error message handling on all API calls.
- Role-based dashboard access checks in client (`buyer`/`seller` guards).
- Inquiry form integrated on property details page (buyer-only at runtime).

### Run Frontend

Use any static server (example):

```bash
npx serve frontend/pages
```

Then open the served URL in browser and ensure backend is running on `http://localhost:5000`.

### Seed Data (Demo Ready)

Load sample users and properties:

```bash
mysql -u root -p < database/seed.sql
```

Default demo logins (password for all: `Password123`):
- `admin@example.com`
- `seller1@example.com`
- `seller2@example.com`
- `buyer1@example.com`

### Verification checklist

See `IMPLEMENTATION_STATUS.md`. Quick API check: `npm run smoke` (with server + seed loaded).

### Existing database upgrades

If your DB was created before search/verification features:

```bash
mysql -u root -p real_estate_marketplace < database/migrations/phase2_features.sql
```


### Security note

Access tokens are stored in `localStorage` for the static frontend. This is fine for demos; production apps should prefer httpOnly cookies or a BFF to reduce XSS token theft risk.

JWT in `localStorage`, refresh token rotation, bcrypt passwords, Helmet, and auth rate limiting are implemented on the API.

### CORS and frontend ports

Set `CORS_ORIGIN` and `FRONTEND_URL` to match how you serve pages (e.g. Live Server `http://localhost:5500` or `npx serve frontend/pages`). The API allows localhost on any port in development.

### Backend `.env` (demo)

Create `.env` at the project root (you can start from `.env.example`). Set **`DB_PASSWORD`** to your real MySQL password; otherwise startup fails with “Access denied”.

After MySQL is up:

```bash
npm run dev
```

You should see:

- `Database connected.`
- `Server is running on port 5000`

### API smoke test

With the server running and seed loaded:

```bash
npm run smoke
```

Uses native `fetch` (Node 18+). Override base URL: `SMOKE_API_BASE=http://127.0.0.1:5000/api npm run smoke`.
