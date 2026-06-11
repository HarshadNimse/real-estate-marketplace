# Implementation Status Checklist

Run through this list after applying all changes. Automated checks: `npm test`, `npm run smoke` (API must be running).

## Security
- [x] Rate limiting: `POST /api/auth/login` limited to 30 requests / 15 min (31st → 429)
- [x] Helmet: security headers on API responses (`X-Frame-Options`, `X-Content-Type-Options`, etc.)
- [x] JWT secret: server refuses to start if `JWT_SECRET` missing or &lt; 32 chars
- [x] CORS: configure `CORS_ORIGIN` in `.env` (see README for Live Server ports)

## Authentication
- [x] Register → `accessToken` + `refreshToken`
- [x] Login → `accessToken` + `refreshToken`
- [x] `POST /api/auth/refresh` with valid refresh token
- [x] `POST /api/auth/logout` invalidates refresh token
- [x] `POST /api/auth/forgot-password` (dev: logs link to console when SMTP unset)
- [x] `POST /api/auth/reset-password` with valid token
- [x] `POST /api/auth/send-verification-email` (authenticated)
- [x] `POST /api/auth/verify-email` with token from email
- [x] Optional `REQUIRE_EMAIL_VERIFICATION=true` blocks login until verified

## User Profile
- [x] `PUT /api/auth/me` updates name and phone
- [x] `POST /api/auth/me/change-password`
- [x] `profile.html` loads user data and verification status
- [x] Saved properties on `profile.html`

## Admin
- [x] `GET /api/admin/stats` — users, properties, pending, inquiries, **totalViews**
- [x] `GET /api/admin/users` — paginated list with search
- [x] `PATCH /api/admin/users/:id/toggle-status`
- [x] Admin panel: stats, property moderation, user management

## Properties
- [x] Public search: `q` (FULLTEXT + LIKE fallback), partial `city` match, `furnishing`, `minArea`/`maxArea`
- [x] Cloudinary images removed on property update (replace) and soft delete
- [x] Property view tracking on public `GET /api/properties/:id` and slug route
- [x] Seller dashboard property list: Prev/Next pagination

## Favourites
- [x] `POST /api/favourites/:propertyId` (buyer, approved listings only)
- [x] `DELETE /api/favourites/:propertyId`
- [x] `GET /api/favourites` (listable properties only)
- [x] Save button on property detail (buyer)
- [x] MVC layer: controller → service → model

## Inquiries
- [x] Seller email notification on new inquiry (console in dev when SMTP unset)

## Frontend pages
- [x] `profile.html`, `forgot-password.html`, `reset-password.html`, `verify-email.html`
- [x] `property.html` — Leaflet map
- [x] `admin-panel.html`
- [x] `seller-property-form.html` — drag-and-drop images, primary badge, amenities checkboxes
- [x] Login — “Forgot password?” link
- [x] Navbar — “My Profile” when logged in
- [x] Home mega menu — EMI / value / receipt calculators; Post property / Track leads links
- [x] `test-checklist.html` removed (use this file + `npm run smoke`)

## Database
- [x] `refresh_tokens`, `password_reset_tokens`, `email_verification_tokens`
- [x] `property_views`, `favorites`, FULLTEXT on `properties(title, description)`
- [x] Existing DBs: run `database/migrations/phase2_features.sql`

## DevOps
- [x] `npm test` — unit tests (Node test runner)
- [x] `npm run smoke` — E2E API smoke test
- [x] `.github/workflows/ci.yml`
- [x] `Dockerfile` + `docker-compose.yml`

## Out of scope (future)
- In-app real-time notifications (WebSocket / polling)
- Phone OTP verification (`phone_verified` column exists; flow not built)
- httpOnly cookie session (frontend uses `localStorage` JWT today — see README security note)
