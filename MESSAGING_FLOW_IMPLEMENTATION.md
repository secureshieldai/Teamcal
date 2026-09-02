# Messaging & Discover People — Implementation

Full scope (spec sections 1–5) on a dedicated messages table.
**Calls decision: Option A** — signaling + UI + call history now; real audio/video
streaming is stubbed until `react-native-webrtc` is added.

## Status — built

- [x] **DB** — `dm_conversations` + `dm_messages` (Migration 018 in `migrations.sql`,
      mirrored in `schema.sql`). **Run Migration 018 on Supabase before deploying.**
- [x] **Backend** — `message.controller.js` rewritten on the new tables; 3-message request
      cap returns `409 {code:'REQUEST_LIMIT'}`; recipient reply auto-accepts; image/voice
      via `POST /messages/:userId/media`; voice-to-text via `POST /messages/transcribe`
      (Gemini); `POST /messages/:userId/read`, `POST /messages/:userId/call`.
- [x] **Realtime** — `dm:message` / `dm:read` / `dm:typing` + `call:*` signaling relays in
      `realtime.js`; client helpers in `src/services/realtime.ts` (shared ref-counted socket).
- [x] **Upload** — `dmMediaUpload` (image+audio) and `audioUpload` multer configs; audio
      mimetypes + `uploadPublicAudio` in `storage.service.js`.
- [x] **Messages page** — tabs are now **Read / Unread / Requests**
      (`communityData.ts`, `SocialChatsTab.tsx`); live refresh via `subscribeToInbox`;
      `RequestRow` shows the `N of 3 messages used` status + dots.
- [x] **Thread** — `DirectMessageScreen` rebuilt: text / image / voice bubbles
      (`MessageBubble`, `VoiceNotePlayer`), image picker, hold-free voice recorder with
      send / voice-to-text / cancel, typing indicator, request banner + accept/decline,
      read receipts, image lightbox, call buttons in the header.
- [x] **Calls** — `CallScreen` (outgoing/incoming, ringing→connected→ended, mute/speaker,
      30s no-answer), `IncomingCallManager` at app root via `navigationRef`, every call
      logged to the thread as a `call` message.
- [x] **Discover People** — `DiscoverPeopleScreen` (search + suggested, inline Follow +
      Message, row → `UserProfile`); reached from the Chats tab FAB + empty state.
- [x] **Wiring** — `Call` + `DiscoverPeople` routes in `types.ts` / `RootNavigator.tsx`;
      `client.ts` interceptor now preserves `error.code` / `error.status`.

## Connect + weekly request limit — built (spec §1–4)

- [x] **DB** — `connections` table (Migration 019 in `migrations.sql`, mirrored in
      `schema.sql`). **Run Migration 019 on Supabase before deploying.** It backfills
      existing mutual `tracker_entries` `friend` pairs into `accepted` connections.
- [x] **Connect = Friend** — an accepted connection now *is* a "friend" everywhere:
      `getFriends`, `getFriendsProgress`, and the leaderboard `friends` scope read
      accepted connections; the legacy `POST /users/:id/friend` toggle now creates /
      removes a connection request.
- [x] **Backend** — `connection.controller.js`: `POST /social/connections/:id`
      (send request — also follows the target; auto-accepts a reverse pending request),
      `/accept`, `/decline` (follow left intact), `DELETE /social/connections/:id`
      (remove / withdraw — follow left intact), `GET /social/connections?box=`.
      `getProfile` now returns `connectionStatus` + `connectionId`.
      Notifications: `connect_request`, `connect_accepted`.
- [x] **Weekly limit** — `message.controller.js` blocks starting a 6th brand-new
      request in any rolling 7 days with `409 {code:'WEEKLY_REQUEST_LIMIT'}`
      (`WEEKLY_REQUEST_LIMIT = 5`). Existing/accepted threads are unaffected.
- [x] **Frontend** — `social.service.ts` connect methods + types; `UserProfileScreen`
      Connect button (states: Connect / Requested / Accept / Connected) + optional-note
      modal; `DiscoverPeopleScreen` inline connect action; new `ConnectionsScreen`
      (Requests / Sent / Connections tabs) on route `Connections`, reached from the
      Community header people icon and from connect notifications; `DirectMessageScreen`
      surfaces `WEEKLY_REQUEST_LIMIT`.

## Follow-ups / not done

- Real WebRTC media (add `react-native-webrtc` + config plugin + dev-client rebuild;
  wire offer/answer/ICE through the `call:sdp` / `call:ice` relays already in place).
- Old `tracker_entries` rows with `tracker='direct-message'` are **not migrated** — the
  new store starts empty. Add a backfill script if history must carry over.
- `getConversations` unread badge on the tab bar (only the Chats sub-tab reflects it now).

---
_Original plan below._

## Core rule
Never chatted before → **Message Request** → max **3 messages** from the initiator →
recipient **Accepts** → conversation moves to **Inbox** → unlimited messaging + all features.
Recipient can **Decline** (deletes request) or **Block**.

---

## Phase 1 — Data model + backend core

**Migration (`backend/supabase/migrations.sql` + mirror in `schema.sql`)**

- `dm_conversations`
  - `id`, `user_lo` / `user_hi` (canonical-ordered user ids, `unique(user_lo,user_hi)`)
  - `status` `pending | accepted | blocked`
  - `initiator_id`, `request_message_count int default 0`
  - `last_message_at`, `last_message_preview`, `last_message_type`
  - `blocked_by`, timestamps
- `dm_messages`
  - `id`, `conversation_id` FK, `sender_id`
  - `type` `text | image | voice | call`
  - `body text`, `media_url`, `media_duration_ms`, `transcript`
  - `call_mode` `audio|video`, `call_outcome` `missed|declined|no_answer|ended`, `call_duration_s`
  - `read_at`, `created_at`
  - indexes on `(conversation_id, created_at)` and unread lookups

**`backend/src/controllers/message.controller.js`** — rewritten onto the new tables:

- `listConversations` — accepted convos, peer profile, unread count, preview
- `listRequests` — pending convos where `initiator_id <> me`; include first message + count
- `getMessages(:userId)` — messages + `conversation` meta (`status`, `isInitiator`,
  `messagesRemaining = 3 - request_message_count`); marks incoming read
- `sendMessage(:userId)` — create convo if none; **enforce 3-msg cap**: pending + sender is
  initiator + `request_message_count >= 3` → `409 {code:'REQUEST_LIMIT'}`; increment count;
  emit realtime `dm:message`
- `sendMediaMessage(:userId/media)` — multipart image/voice → storage → message row
- `transcribeAudio(/messages/transcribe)` — Gemini (`@google/generative-ai`, reuse coach
  client) audio → text, for voice-to-text
- `markRead(:userId/read)`, `logCall(:userId/call)` — call outcome → `type:'call'` message
- `actOnRequest` — accept / decline / block (unchanged semantics)

**Storage / upload** — `middleware/upload.js` gains `audioUpload` (m4a/mp3/webm/wav);
`storage.service.js` gains audio mimetypes + `uploadPublicAudio`.

**Realtime (`backend/src/realtime.js`)** — personal `user:<id>` room already exists. Add
emit helpers + socket handlers:
`dm:message`, `dm:read`, `dm:typing`, and call signaling relays
`call:invite | call:accept | call:decline | call:end | call:sdp | call:ice`.

**Routes (`social.routes.js`)** — add `POST /messages/:userId/media`,
`POST /messages/transcribe`, `POST /messages/:userId/read`, `POST /messages/:userId/call`.

---

## Phase 2 — Frontend data layer

- `src/services/api/social.service.ts` — extend `DirectMessage` / `SocialConversation` /
  `MessageRequest` types; add `sendImageMessage`, `sendVoiceMessage`, `transcribeAudio`,
  `markConversationRead`, `logCall`; surface `REQUEST_LIMIT`.
- `src/services/realtime.ts` — shared authed socket; `subscribeToConversation(peerId, h)`
  and `subscribeToInbox(onEvent)` (new message / read / typing); call-signaling channel.

---

## Phase 3 — Messages page

- `src/data/communityData.ts` — `chatsSubTabs = ['Read','Unread','Requests']`.
- `SocialChatsTab.tsx` — Read/Unread split by `unreadCount`; Requests tab passes count.
- `components/social/RequestRow.tsx` — show `N of 3 messages left` (recipient view) /
  `Waiting to be accepted` and per-request status.

---

## Phase 4 — DirectMessageScreen rich composer

Rebuild the (currently one-line) screen into real components:

- `components/social/MessageBubble.tsx` — text / image (tap to expand) / voice / call rows
- `components/social/VoiceNotePlayer.tsx` — `expo-audio` playback + duration
- Composer: text, 🎤 hold-to-record voice note, 🎤→text voice-to-text, 🖼 image picker, send
- Request banner: "You can send N more messages until {name} accepts." — composer disabled at 0
- Header: audio-call + video-call buttons → `CallScreen`
- Typing indicator via realtime

---

## Phase 5 — Calls  ⚠️ needs your decision

Signaling (over the existing socket.io) + full call UI + call history rows are buildable now.
**Actual audio/video media needs `react-native-webrtc`, which is not installed and does not
run in Expo Go — it requires a custom dev client and a native rebuild** (or a paid provider
SDK like Daily / Agora / LiveKit).

Options:
- **A. Signaling + UI now, media later** — build `CallScreen`, incoming-call provider,
  signaling, and call-history messages; leave one integration point that shows
  "Calls need the latest app build" until `react-native-webrtc` is added. *(default)*
- **B. Add `react-native-webrtc` now** — I add the dep + config plugin; you must run
  `npx expo prebuild` + build a dev client / EAS build before calls work on device.
- **C. Provider SDK (Daily/Agora/LiveKit)** — most reliable calls, adds an account +
  API keys + native rebuild.

---

## Phase 6 — Discover People

- `src/screens/DiscoverPeopleScreen.tsx` + route `DiscoverPeople`
  - search (`socialService.searchUsers`), suggested (`getCreators` / leaderboard)
  - rows: avatar, name, level, **Follow**, **Message** → row tap opens `UserProfile`
- Entry points: Chats tab empty state + header search icon + a `+` FAB → `DiscoverPeople`
  (currently these point at `GlobalSearch`).

---

## Phase 7 — Wiring & verification

- `src/navigation/types.ts` + `RootNavigator.tsx` — register `Call`, `DiscoverPeople`.
- `npx tsc --noEmit`, lint.
- Supabase migration SQL provided for you to run (no DB access from here).
