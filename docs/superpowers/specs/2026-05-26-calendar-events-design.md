# ZealHub Calendar Events Integration — Design Spec

**Date:** 2026-05-26
**Status:** Approved
**Author:** Brooke Bergin + Claude

---

## Overview

Update ZealHub's CalendarView to display real Google Calendar events (fetched via API) instead of tasks. Users connect their Google account via OAuth. Events appear as colored chips in day cells; clicking a chip opens a detail popup. A second calendar (Google or Microsoft) can be connected later — events from both merge into the same view.

---

## Architecture

```
User clicks "Connect Google Calendar"
        ↓
Google OAuth popup (@react-oauth/google)
  → returns access_token + refresh_token
        ↓
Tokens stored in Supabase: user_calendars table
        ↓
useGoogleCalendar hook (React)
  → reads user_calendars
  → refreshes token if expired
  → fetches events from Google Calendar API
  → normalizes timezones
  → returns sorted event list
        ↓
CalendarView renders events as chips in day cells
  → click chip → EventDetailModal popup
        ↓
(Future) Second calendar: second row in user_calendars
  → hook merges events from both accounts
```

No backend code (Edge Functions) required. Google Calendar API is called directly from the React app using the stored access token.

---

## Data Model

### New table: `user_calendars`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | primary key, default gen_random_uuid() |
| `user_id` | uuid | FK → auth.users, not null |
| `provider` | text | `'google'` or `'microsoft'` |
| `email` | text | connected account email |
| `access_token` | text | short-lived (~1hr) |
| `refresh_token` | text | long-lived, used to get new access tokens |
| `expires_at` | timestamptz | when access_token expires |
| `calendar_color` | text | hex color pulled from Google calendar metadata |
| `created_at` | timestamptz | default now() |

Row-level security: users can only read/write their own rows (`user_id = auth.uid()`).

### Existing table: `settings` (future)

A `user_settings` table (to be created in a later Settings sprint) will store:
- `timezone` — IANA timezone string (e.g. `'America/Chicago'`), defaults to browser timezone on first use

---

## OAuth Flow

### Prerequisites (one-time setup)
1. Create a Google Cloud project
2. Enable Google Calendar API
3. Create OAuth 2.0 credentials → get Client ID
4. Add authorized JavaScript origins (localhost + production URL)
5. Add `VITE_GOOGLE_CLIENT_ID` to `.env`

### Connect flow
1. User clicks "Connect Google Calendar" (banner in CalendarView or Settings page)
2. `@react-oauth/google` opens a Google popup
3. User selects account and approves `calendar.readonly` scope
4. App receives an authorization code
5. Code exchanged for `access_token` + `refresh_token` via `https://oauth2.googleapis.com/token`
6. Tokens + email + expiry saved to `user_calendars`
7. CalendarView re-renders with events

### Token refresh (automatic, invisible to user)
1. `useGoogleCalendar` checks `expires_at` on mount and before each fetch
2. If expired: POST to `https://oauth2.googleapis.com/token` with `refresh_token`
3. New `access_token` and `expires_at` written back to Supabase
4. Events fetched with fresh token

### Disconnect
1. Delete row from `user_calendars`
2. POST to `https://oauth2.googleapis.com/revoke` with the token (best practice)
3. CalendarView shows "Connect" banner again

---

## Components & Files

### New: `src/hooks/useGoogleCalendar.js`

Owns all calendar data logic:
- Reads `user_calendars` from Supabase to check connection status
- Handles token refresh
- Fetches events from Google Calendar API for the current month view
- Normalizes all event times to display timezone
- Returns: `{ events, isConnected, isLoading, connectCalendar, disconnectCalendar }`

### New: `src/components/EventChip.jsx`

Small colored pill displayed in a day cell:
- Shows event title (truncated to ~20 chars)
- Background color from `calendar_color`
- Click → opens `EventDetailModal`

### New: `src/components/EventDetailModal.jsx`

Popup shown when clicking an event chip:
- Event name
- Start time – End time (formatted in display timezone)
- Google Meet / Zoom join link (button, if present in event)
- Meeting room / location (if present)
- Invited participants (name + email list)
- Which calendar account the event belongs to
- Close button (click outside or ✕)

### Modified: `src/views/CalendarView.jsx`

- Replace task dot indicator in day cells with `EventChip` components
- Show "Connect Google Calendar" banner if `!isConnected`
- Right panel (selected day): show event list with full details instead of task list
- Keep tasks accessible — move task view to a separate tab or section within the right panel

---

## UI Design

### Day cell (month grid)
```
┌──────────────────┐
│  26              │
│ ┌──────────────┐ │
│ │ 9am Team     │ │  ← blue chip
│ └──────────────┘ │
│ ┌──────────────┐ │
│ │ 2pm 1:1      │ │  ← green chip (second calendar)
│ └──────────────┘ │
│ +2 more          │  ← overflow indicator if >3 events
└──────────────────┘
```

### Right panel (selected day)
```
Tuesday, May 26
────────────────────────
● 9:00am – 10:00am
  Team Standup
  👤 alice@co.com, bob@co.com
  🎥 Join Google Meet →

● 2:00pm – 3:00pm
  1:1 with Manager
  📍 Conference Room B
  👤 manager@co.com
────────────────────────
```

### Event detail modal (click chip in day cell)
```
┌─────────────────────────────────┐
│ Team Standup               [✕]  │
├─────────────────────────────────┤
│ Tuesday, May 26                 │
│ 9:00am – 10:00am (CT)           │
│                                 │
│ 📍 Google Meet                  │
│ [Join Meeting →]                │
│                                 │
│ 👥 Participants                 │
│    Alice Smith · alice@co.com   │
│    Bob Jones  · bob@co.com      │
│                                 │
│ 🗓 brooke@zealitconsultants.ai  │
└─────────────────────────────────┘
```

---

## Timezone Handling

- Google Calendar API returns all times in UTC (ISO 8601)
- Display timezone stored in `user_settings.timezone` (IANA format, e.g. `'America/Chicago'`)
- Default: browser's local timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`) on first use
- Conversion uses native `Intl.DateTimeFormat` — no extra library needed
- All events from all connected calendars use the same display timezone
- Settings page (future sprint): dropdown to change timezone

---

## Multi-Calendar Extensibility

The `user_calendars` table supports multiple rows per user. Adding a second calendar:

1. Same "Connect" flow, second row inserted with `provider = 'google'` or `'microsoft'`
2. `useGoogleCalendar` fetches from all connected rows, merges and sorts by start time
3. Each calendar gets a distinct chip color (from `calendar_color` column)
4. Event detail modal shows which account the event belongs to
5. Microsoft Calendar (MSAL): different OAuth library, same hook interface, same table structure

---

## Out of Scope (this sprint)

- Creating, editing, or deleting Google Calendar events
- Microsoft Calendar / MSAL integration (future)
- Settings page for timezone (future sprint — timezone defaults to browser for now)
- Push notifications for upcoming events
- Recurring event expansion beyond current month
- Searching events

---

## Open Questions

- None — all resolved during design session.

---

## Implementation Notes

- `VITE_GOOGLE_CLIENT_ID` must be added to `.env` and `.env.example` (no value)
- Google OAuth requires the app to be served over HTTPS in production (localhost works without)
- The `user_calendars` table should be created via Supabase migration, not the dashboard UI, so it's reproducible
- Token storage in Supabase (not localStorage) means tokens survive page refreshes and are protected by RLS
