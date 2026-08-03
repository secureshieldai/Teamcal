# TeamCal Backend

Node.js/Express REST API for TeamCal. It uses Supabase PostgreSQL for persistent data, Firebase Admin for OAuth token verification, AI vision for coach and meal-scanner features, and Open Food Facts for barcode nutrition.

## Stack

- **Runtime:** Node.js (CommonJS)
- **Framework:** Express 4
- **Database:** Supabase (Postgres via `@supabase/supabase-js`)
- **Auth:** JWT (email/password) + Firebase Admin (Google/Apple OAuth)
- **AI:** Google Gemini (`@google/generative-ai`)
- **File uploads:** Multer → `/uploads` static folder
- **Docs:** Swagger UI at `/api/docs`
- **Logging:** Winston + Morgan

---

## Getting Started

```bash
cd backend
npm install
cp .env.example .env   # fill in your values
npm run dev            # starts with nodemon on port 3001
```

For production:

```bash
npm start
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` \| `production` \| `test` |
| `PORT` | Server port (default `3001`) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (server-only) |
| `JWT_SECRET` | Secret for signing JWTs (min 64 chars) |
| `JWT_EXPIRES_IN` | JWT lifetime (default `30d`) |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime (default `90d`) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `SMTP_HOST` | SMTP server hostname, e.g. `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port, normally `587` or `465` |
| `SMTP_SECURE` | `true` for port 465; otherwise `false` |
| `SMTP_USER` | SMTP username/email |
| `SMTP_PASS` | SMTP password (for Gmail, use an App Password) |
| `EMAIL_FROM` | Sender identity, normally matching `SMTP_USER` |
| `OTP_SECRET` | Secret used to hash OTPs (falls back to `JWT_SECRET`) |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms (default `900000`) |
| `RATE_LIMIT_MAX` | Max general API requests per window (default `1000`) |
| `AUTH_RATE_LIMIT_MAX` | Failed authentication attempts per window (default `20`) |
| `AI_RATE_LIMIT_MAX` | Max AI requests per window (default `20`) |
| `UPLOAD_MAX_SIZE_MB` | Max upload file size in MB (default `10`) |

Firebase is optional — the server starts without it but `/api/auth/firebase` will return `503`.

## Supabase database

For a new project, run `supabase/schema.sql` in Supabase Dashboard → SQL Editor. It contains every table, relationship, index, trigger, and RLS setting required by the API.

For an existing TeamCal database, run `supabase/migrations.sql`. It adds normalized `post_comments` and `post_likes`, migrates legacy community data, and supplies the tables backing registered blog routes.

The backend must use `SUPABASE_SERVICE_KEY`. Never expose that key to the Expo client.

---

## Authentication

All routes except `/api/auth/*` require a Bearer token:

```
Authorization: Bearer <jwt>
```

Tokens are issued on register/login/firebase-auth and expire per `JWT_EXPIRES_IN`.

---

## API Reference

Base URL: `http://localhost:3001/api`

Interactive docs: `http://localhost:3001/api/docs`

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | No | Register with email + password |
| `POST` | `/login` | No | Login with email + password (verified accounts only) |
| `POST` | `/verification/verify` | No | Verify the six-digit email code |
| `POST` | `/verification/resend` | No | Send a replacement code (60-second cooldown) |
| `GET` | `/me` | Yes | Get current user |
| `POST` | `/firebase` | No | Sign in via Firebase ID token (Google/Apple) |

**POST /register**
```json
{ "email": "user@example.com", "password": "secret123", "name": "Jane" }
```

**POST /login**
```json
{ "email": "user@example.com", "password": "secret123" }
```

**POST /firebase**
```json
{ "idToken": "<firebase-id-token>" }
```

Registration returns `{ success, verificationToken, message }`. Submit that token with the code to
`/verification/verify`; successful verification returns `{ success, token, user }`.

Before enabling registration, run `supabase/migrations.sql` in the Supabase SQL Editor and configure
the SMTP variables plus `EMAIL_FROM`.

---

### User — `/api/user`

| Method | Path | Description |
|---|---|---|
| `PATCH` | `/profile` | Update profile fields |
| `POST` | `/avatar` | Upload avatar image (`multipart/form-data`, field `avatar`) |
| `GET` | `/goals` | Get user goals |
| `PATCH` | `/goals` | Update user goals |
| `PATCH` | `/notifications` | Update notification preferences |

**PATCH /profile** — updatable fields:
`name`, `bio`, `avatar`, `dm_enabled`, `age`, `height_cm`, `weight_kg`, `gender`, `goals`, `fasting_plan`, `fast_hours`, `eat_hours`, `onboarding_complete`

**PATCH /goals** — body fields:
`fastHours`, `waterMl`, `steps`, `sleepHours`, `kcal`, `proteinG`, `carbsG`, `fatsG`, `weightKg`, `focusAreas`

---

### Fasting — `/api/fasting`

| Method | Path | Description |
|---|---|---|
| `GET` | `/active` | Get current active fast (or `null`) |
| `POST` | `/start` | Start a new fast |
| `POST` | `/stop` | End the active fast |
| `PATCH` | `/extend` | Extend the active fast target |
| `GET` | `/history` | Paginated fast history |
| `GET` | `/analytics` | Aggregated fasting stats |

**POST /start**
```json
{ "protocol": "16:8", "targetHours": 16 }
```

**PATCH /extend**
```json
{ "hoursDelta": 2 }
```

**GET /history** — query params: `limit` (max 200), `skip`

**GET /analytics** — returns `longest`, `avg`, `total`, `successRate`, `totalHours`, `last30` (array), `protocolCounts`

---

### Tracker — `/api/tracker`

Generic tracker for water, steps, sleep, weight, etc.

| Method | Path | Description |
|---|---|---|
| `POST` | `/:tracker` | Add an entry |
| `GET` | `/:tracker` | Get entries (paginated) |
| `GET` | `/:tracker/today` | Today's entries + sum |
| `GET` | `/:tracker/lastn` | Last N days aggregated |
| `GET` | `/:tracker/streak` | Current daily streak |
| `DELETE` | `/:tracker/:id` | Delete a single entry |
| `DELETE` | `/:tracker` | Clear all entries for tracker |

`:tracker` examples: `water`, `steps`, `sleep`, `weight`

**POST /:tracker**
```json
{ "value": 250, "ts": 1700000000000, "meta": {} }
```

**GET /:tracker** — query: `limit` (max 500), `skip`

**GET /:tracker/lastn** — query: `days` (max 365, default 7)

**GET /:tracker/streak** — query: `dailyGoal` (default 1)

---

### Meals — `/api/meals`

| Method | Path | Description |
|---|---|---|
| `POST` | `/log` | Log a meal manually |
| `GET` | `/today` | Today's meals + macro totals |
| `POST` | `/scan-log` | Save a meal scan result |

**POST /log**
```json
{ "name": "Oatmeal", "kcal": 350, "protein": 12, "carbs": 58, "fats": 6, "ts": 1700000000000 }
```

**POST /scan-log**
```json
{
  "items": [{ "name": "Banana", "kcal": 89 }],
  "totals": { "kcal": 89, "protein": 1, "carbs": 23, "fats": 0 }
}
```

---

### Coach (AI) — `/api/coach`

Rate-limited separately (`AI_RATE_LIMIT_MAX`).

| Method | Path | Description |
|---|---|---|
| `POST` | `/chat` | Chat with AI health coach (Gemini) |
| `POST` | `/scan-meal` | Scan a meal photo for nutrition info |
| `POST` | `/barcode` | Look up product nutrition by barcode |

**POST /chat**
```json
{ "message": "How many calories should I eat today?" }
```

**POST /scan-meal** — `multipart/form-data` with field `image`

---

### Social — `/api/social`

| Method | Path | Description |
|---|---|---|
| `GET` | `/feed` | Get community post feed |
| `GET` | `/users` | Search users (query: `q`) |
| `GET` | `/leaderboard` | XP leaderboard |
| `GET` | `/users/:id` | Get a user's public profile |

---

### Posts — `/api/posts`

| Method | Path | Description |
|---|---|---|
| `POST` | `/` | Create a post |
| `POST` | `/image` | Upload post image (`multipart/form-data`, field `image`) |
| `GET` | `/mine` | Get own posts |
| `GET` | `/feed` | Get post feed |
| `POST` | `/:id/like` | Like/unlike a post |
| `GET` | `/:id/comments` | List persisted comments |
| `POST` | `/:id/comments` | Create a persisted comment |
| `DELETE` | `/:id/comments/:commentId` | Delete the current user's comment |
| `DELETE` | `/:id` | Delete a post |

---

### Goals — `/api/goals`

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Get goals |
| `PATCH` | `/` | Update goals |

---

### Earn — `/api/earn`

| Method | Path | Description |
|---|---|---|
| `GET` | `/entries` | Get earn history entries |
| `GET` | `/referrals` | Get referral list |
| `POST` | `/referrals` | Invite via referral code |
| `GET` | `/payout` | Get payout info |
| `POST` | `/payout/connect` | Connect a payout method |
| `POST` | `/payout/disconnect` | Disconnect payout method |
| `POST` | `/payout/withdraw` | Request withdrawal |

---

### Blog — `/api/blogs`

| Method | Path | Description |
|---|---|---|
| `GET` | `/sites` | Get user's blog sites |
| `POST` | `/sites` | Create a blog site |
| `PATCH` | `/sites/:id` | Update a blog site |
| `DELETE` | `/sites/:id` | Delete a blog site |
| `GET` | `/sites/:blogId/articles` | Get articles for a site |
| `GET` | `/articles` | Get all articles |
| `POST` | `/articles` | Create an article |
| `PATCH` | `/articles/:id` | Update an article |
| `DELETE` | `/articles/:id` | Delete an article |
| `POST` | `/articles/:id/view` | Record an article view |

---

### Notifications — `/api/notifications`

| Method | Path | Description |
|---|---|---|
| `GET` | `/prefs` | Get notification preferences |
| `PATCH` | `/prefs` | Update notification preferences |
| `GET` | `/` | Get notification inbox and unread count |
| `PATCH` | `/read-all` | Mark all notifications read |
| `PATCH` | `/:id/read` | Mark one notification read |

Preference fields: `milestones`, `streaks`, `hydration`, `insights`, `contests`, `social`, `commerce`, `updates`

---

### Health Team — `/api/health-team`

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Get health team members |
| `POST` | `/` | Invite a health team member |
| `PATCH` | `/:id` | Update an invite |
| `DELETE` | `/:id` | Remove a team member |

---

### Appointments — `/api/appointments`

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Get appointments |
| `POST` | `/` | Book an appointment |
| `PATCH` | `/:id` | Update an appointment |
| `DELETE` | `/:id` | Cancel an appointment |

---

### Shopping — `/api/shopping`

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Get shopping list items |
| `POST` | `/` | Add an item |
| `POST` | `/bulk` | Add multiple items |
| `PATCH` | `/:id` | Update an item |
| `DELETE` | `/:id` | Delete an item |
| `DELETE` | `/checked` | Clear all checked items |

---

### Challenges — `/api/challenges`

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | List challenges (query: `tab=discover\|my\|completed`) |
| `GET` | `/featured` | Get featured challenge for the hero card |
| `GET` | `/:id` | Get challenge detail + user membership |
| `POST` | `/` | Create a challenge |
| `POST` | `/:id/join` | Join a challenge |
| `DELETE` | `/:id/join` | Leave a challenge |
| `PATCH` | `/:id/progress` | Update current day progress |

**POST /** body: `title`, `description`, `photo`, `icon`, `iconColor`, `durationDays`, `totalDays`, `isPublic`, `startsAt`, `endsAt`

**PATCH /:id/progress** body: `{ "currentDay": 5 }`

---

### Groups — `/api/groups`

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Get user's groups |
| `POST` | `/` | Create a group |
| `GET` | `/:id` | Group detail + members |
| `PATCH` | `/:id` | Update group (owner/admin only) |
| `POST` | `/:id/join` | Join a public group |
| `DELETE` | `/:id/join` | Leave a group |
| `GET` | `/:id/activity` | Group post feed |

**POST /** body: `name`, `description`, `cover`, `isPrivate`

---

### Workouts — `/api/workouts`

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Browse workouts (query: `category`, `difficulty`) |
| `GET` | `/today` | Today's recommended workout template |
| `GET` | `/history` | Completed workout log history |
| `GET` | `/:id` | Get a single workout |
| `POST` | `/` | Create a workout |
| `POST` | `/log` | Log a completed workout session |
| `PATCH` | `/:id` | Update a workout |
| `DELETE` | `/:id` | Delete a workout |

**POST /log** body: `workoutId`, `title`, `duration`, `exercises`, `notes`, `startedAt`, `endedAt`

Logging a workout automatically awards 30 XP and records a `workouts` tracker entry.

---

### Marketplace — `/api/marketplace`

| Method | Path | Description |
|---|---|---|
| `GET` | `/products` | Browse products (query: `category`, `featured=true`) |
| `GET` | `/products/featured` | Featured products for hero section |
| `GET` | `/categories` | Category list |
| `GET` | `/search` | Search products (query: `q`) |
| `GET` | `/products/:id` | Get a product |
| `POST` | `/products` | Create a product listing |
| `PATCH` | `/products/:id` | Update a listing |
| `DELETE` | `/products/:id` | Soft-delete a listing |

All product responses include `price_display` formatted as `"$XX.XX"`.

### Stripe Connect production setup

Apply Migration 009, then configure `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `PUBLIC_APP_URL`, `STRIPE_PLATFORM_FEE_BPS`, and `STRIPE_DEFAULT_COUNTRY` from `.env.example`.

Create a Stripe webhook destination for `https://YOUR_API/api/stripe/webhook` and subscribe to platform plus connected-account events: `account.updated`, `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`, `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.closed`, `refund.updated`, `refund.failed`, `payout.paid`, and `payout.failed`.

Connect and payment endpoints:

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/earn/payout/connect` | Create/reuse an Express account and return hosted onboarding URL |
| `GET` | `/api/earn/payout/status` | Refresh capabilities and outstanding requirements |
| `POST` | `/api/earn/payout/login-link` | Return an Express Dashboard login link |
| `POST` | `/api/earn/payout/withdraw` | Create a payout on the connected account |
| `POST` | `/api/marketplace/checkout` | Create Stripe Checkout with destination transfer and platform fee |
| `POST` | `/api/marketplace/orders/:id/refund` | Seller-authorized refund with transfer and fee reversal |
| `GET` | `/api/marketplace/disputes` | Seller dispute list synchronized by webhooks |
| `POST` | `/api/stripe/webhook` | Signature-verified, idempotent Stripe event receiver |

---

## Error Responses

All errors follow:

```json
{ "success": false, "message": "Description of error" }
```

Common status codes:
- `400` — Validation error
- `401` — Missing/invalid/expired token
- `403` — Forbidden
- `404` — Not found
- `409` — Conflict (e.g. email already registered)
- `429` — Rate limit exceeded
- `500` — Internal server error

---

## Project Structure

```
backend/
├── src/
│   ├── app.js              # Express app setup, middleware, routes
│   ├── server.js           # Entry point — starts server
│   ├── config/
│   │   ├── firebase.js     # Firebase Admin init
│   │   ├── supabase.js     # Supabase client
│   │   ├── swagger.js      # Swagger/OpenAPI config
│   │   └── logger.js       # Winston logger
│   ├── controllers/        # Route handlers
│   ├── middleware/
│   │   ├── auth.js         # JWT protect middleware
│   │   ├── errorHandler.js # Global error handler
│   │   ├── upload.js       # Multer config
│   │   └── validate.js     # express-validator helper
│   └── routes/             # Express routers
├── uploads/                # Uploaded files (served statically)
├── logs/                   # Winston log files
├── supabase/
│   ├── schema.sql          # Complete new-project database schema
│   └── migrations.sql      # Idempotent existing-project upgrades
├── .env.example
└── package.json
```
