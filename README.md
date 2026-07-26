# TeamCal

TeamCal is an Expo/React Native health and fitness application for Android, iOS, and web. It includes daily nutrition and activity tracking, meal planning, workouts, community features, teams, challenges, rewards, notifications, Firebase authentication, AI food-photo analysis, and barcode lookup.

The client lives at the repository root. The Express API and Supabase integration live in [`backend/`](backend/README.md).

## Technology

- Expo 57, React Native 0.86, React 19, and TypeScript
- React Navigation and Axios
- Firebase Authentication for Google and Apple identity
- Expo Camera and Image Picker
- Node/Express backend with Supabase PostgreSQL

## Requirements

- Node.js 20 or newer
- npm
- Android/iOS device, emulator, or modern browser
- A configured and running TeamCal backend

## Local setup

```powershell
npm install
Copy-Item .env.example .env
npm run web
```

The web client normally runs at `http://localhost:8081`.

```powershell
npm run android
npm run ios
npx tsc --noEmit
```

## Frontend environment

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend base URL including `/api` |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase web API key |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase application ID |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | OAuth web client ID for native Google sign-in |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Optional iOS OAuth client ID |

`EXPO_PUBLIC_*` values are included in the client bundle. Never put service-role keys, private keys, JWT secrets, SMTP passwords, or AI keys in them.

For a physical phone or APK, `localhost` will not reach your computer. Use a deployed HTTPS API URL or your development computer's LAN address.

## Application areas

- Dashboard, nutrition, hydration, activity, workouts, fasting, and quick logging
- Explore, search, meal planning, grocery lists, and progress analytics
- Camera-based AI food analysis and barcode scanning
- Community posts with persistent likes/comments, friends, creators, groups, challenges, and leaderboards
- Profile, rewards, invitations, notifications, marketplace, and order history

## Shareable Android APK

Deploy the backend first and set `EXPO_PUBLIC_API_URL` to its HTTPS address. Then configure EAS:

```powershell
npm install --global eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

The `preview` EAS profile should use `"distribution": "internal"` and Android `"buildType": "apk"`. EAS returns an install link and QR code. Use an AAB for Google Play production submission.

## Project layout

```text
TeamCal/
├── App.tsx
├── app.json
├── assets/
├── src/
│   ├── components/
│   ├── config/
│   ├── context/
│   ├── hooks/
│   ├── navigation/
│   ├── screens/
│   ├── services/
│   └── theme/
└── backend/
    ├── src/
    └── supabase/
```

## Backend and database

See [backend/README.md](backend/README.md). For a new Supabase project, run `backend/supabase/schema.sql`. For an existing TeamCal database, run `backend/supabase/migrations.sql`.

## Security

- Keep `.env` files out of source control.
- Keep Supabase service keys, Firebase Admin credentials, JWT secrets, SMTP passwords, and AI keys on the backend.
- Use HTTPS and restricted CORS origins in production.
