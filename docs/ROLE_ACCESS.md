# Role-based access (Fixora)

## Roles

| Role | Home page | Clean URL |
|------|-----------|-----------|
| `client` | `user-dashboard.html` | `/client/dashboard` |
| `provider` | `provider-dashboard.html` | `/provider/dashboard` |
| `admin` | `test-dashboard.html` | `/admin/panel` |

## Frontend

- **`files (2)/js/fxr-access.js`** — `guardPage()` (ProtectedRoute), `renderNav()`, JWT + session role.
- **`files (2)/unauthorized.html`** — blocked access UI.
- Include on every page: `api-config.js` → `fxr-api.js` → `fxr-access.js`.

## Backend

- **`middleware/authMiddleware.js`** — JWT verification.
- **`middleware/roleMiddleware.js`** — `requireRole('client' | 'provider' | 'admin')`.
- Apply `authMiddleware` then `requireRole(...)` on protected API routes.

## Page zones

**Public:** index, search, services, about, contact, login, register, privider (view profile).

**Client:** user-dashboard, user, booking, chat.

**Provider:** provider-dashboard, provider-jobs, provider-profile-edit.

**Admin:** test-dashboard.
