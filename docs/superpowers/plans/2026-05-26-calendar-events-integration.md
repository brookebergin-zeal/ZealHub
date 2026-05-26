# Calendar Events Integration — Google Calendar API

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the CalendarView month grid's static task dots with live Google Calendar events fetched via OAuth, and add an Events tab to the right panel alongside the existing Tasks tab.

**Architecture:** Client-side OAuth via `@react-oauth/google` (implicit flow) stores access tokens in a new `user_calendars` Supabase table with RLS. A `useGoogleCalendar` hook called from `MainApp` uses the existing `date` state to determine the fetch month and returns normalized events. `CalendarView` receives events as props and renders `EventChip` in day cells and `EventDetailModal` on chip click.

**Tech Stack:** React 19, `@react-oauth/google`, Google Calendar API (REST v3), Supabase JS v2, Vitest + jsdom

> **Token refresh note:** The implicit OAuth flow returns an `access_token` (valid 1 hour) but no `refresh_token`. When the token expires, the hook clears the stored connection and CalendarView shows the Connect banner again — the user re-authenticates with one click. Invisible auto-refresh requires a backend and is a future sprint.

---

## File Map

| Path | Status | Responsibility |
|------|--------|----------------|
| `ZealHub/supabase/schema.sql` | Modify | Add `user_calendars` table + RLS policy |
| `ZealHub/.env.example` | Modify | Document `VITE_GOOGLE_CLIENT_ID` |
| `ZealHub/.env` | Modify (local, not committed) | Add actual `VITE_GOOGLE_CLIENT_ID` value |
| `ZealHub/vite.config.js` | Modify | Add Vitest test configuration |
| `ZealHub/src/utils/calendarUtils.js` | Create | Pure functions: format event times, extract date string, check token expiry |
| `ZealHub/src/utils/calendarUtils.test.js` | Create | Vitest unit tests for calendarUtils |
| `ZealHub/src/hooks/useGoogleCalendar.js` | Create | Owns connection state, token lifecycle, event fetching; called from MainApp |
| `ZealHub/src/components/EventChip.jsx` | Create | Colored pill rendered in a day cell for one event |
| `ZealHub/src/components/EventDetailModal.jsx` | Create | Popup with full event details when a chip is clicked |
| `ZealHub/src/App.jsx` | Modify | Wrap in `GoogleOAuthProvider`, add `useGoogleCalendar` call, pass new props to CalendarView |
| `ZealHub/src/views/CalendarView.jsx` | Modify | Accept new props, restructure day cells for chips, add Events/Tasks tabs to right panel |

`ZealHub/src/components/GoogleCalendarEmbed.jsx` — **do not touch.** It is used by DailyView, not CalendarView.

---

### Task 1: DB Schema — `user_calendars` Table

**Files:**
- Modify: `ZealHub/supabase/schema.sql`

- [ ] **Step 1: Append the table to schema.sql**

Open `ZealHub/supabase/schema.sql`. At the end of the file, add:

```sql
-- Calendar OAuth tokens — one row per user per provider (google, microsoft)
create table if not exists user_calendars (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users(id) on delete cascade,
  provider       text        not null check (provider in ('google', 'microsoft')),
  email          text        not null,
  access_token   text        not null,
  refresh_token  text,
  expires_at     timestamptz not null,
  calendar_color text        not null default '#4285F4',
  created_at     timestamptz not null default now(),
  unique (user_id, provider)
);

alter table user_calendars enable row level security;

create policy "Users manage their own calendar connections"
  on user_calendars for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

- [ ] **Step 2: Run the SQL in Supabase**

Open Supabase dashboard → SQL Editor → paste the block above → Run. No errors expected.

- [ ] **Step 3: Verify the table exists**

In the SQL Editor, run:

```sql
select column_name, data_type
from information_schema.columns
where table_name = 'user_calendars'
order by ordinal_position;
```

Expected: 9 rows — `id`, `user_id`, `provider`, `email`, `access_token`, `refresh_token`, `expires_at`, `calendar_color`, `created_at`.

- [ ] **Step 4: Commit**

```bash
git add ZealHub/supabase/schema.sql
git commit -m "feat: add user_calendars table for OAuth token storage"
```

---

### Task 2: Install Dependencies + Environment Variables

**Files:**
- Modify: `ZealHub/package.json` (via npm)
- Modify: `ZealHub/.env.example`
- Modify: `ZealHub/.env` (local, never committed)

- [ ] **Step 1: Install @react-oauth/google**

```bash
cd ZealHub
npm install @react-oauth/google
```

Expected: `@react-oauth/google` appears in `dependencies` in `package.json`.

- [ ] **Step 2: Install Vitest + testing libraries**

```bash
npm install --save-dev vitest @testing-library/react @testing-library/user-event jsdom
```

Expected: all four appear in `devDependencies`.

- [ ] **Step 3: Add env var to .env.example**

Open `ZealHub/.env.example`. Add this line (leave the value blank):

```
VITE_GOOGLE_CLIENT_ID=
```

- [ ] **Step 4: Add env var to .env**

Open `ZealHub/.env`. Add:

```
VITE_GOOGLE_CLIENT_ID=<your Google OAuth Client ID here>
```

Leave blank if you don't have the Client ID yet — the app loads fine, calendar connect just won't work until it's set.

- [ ] **Step 5: Verify .env is gitignored**

```bash
cat ZealHub/.gitignore | grep -E "^\.env$|^\.env\b"
```

Expected: `.env` is listed. If not, add it to `.gitignore` before committing.

- [ ] **Step 6: Commit**

```bash
git add ZealHub/.env.example ZealHub/package.json ZealHub/package-lock.json
git commit -m "feat: add @react-oauth/google + vitest deps, document VITE_GOOGLE_CLIENT_ID"
```

---

### Task 3: Configure Vitest

**Files:**
- Modify: `ZealHub/vite.config.js`

Current content of `ZealHub/vite.config.js`:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

- [ ] **Step 1: Add the Vitest reference and test config**

Replace `ZealHub/vite.config.js` with:

```js
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 2: Add test scripts to package.json**

Open `ZealHub/package.json`. In the `"scripts"` block, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Verify Vitest runs**

```bash
cd ZealHub && npm test
```

Expected: Vitest starts, reports no test files found, exits 0. No errors.

- [ ] **Step 4: Commit**

```bash
git add ZealHub/vite.config.js ZealHub/package.json
git commit -m "chore: configure vitest"
```

---

### Task 4: Calendar Utilities (TDD)

**Files:**
- Create: `ZealHub/src/utils/calendarUtils.js`
- Create: `ZealHub/src/utils/calendarUtils.test.js`

Four pure functions: format a single event time, format a time range with timezone abbreviation, extract a date string from a UTC ISO timestamp in a given timezone, and check whether a Supabase `expires_at` timestamp has passed.

- [ ] **Step 1: Write the failing tests**

Create `ZealHub/src/utils/calendarUtils.test.js`:

```js
import { describe, it, expect } from 'vitest'
import {
  formatEventTime,
  formatEventTimeRange,
  getEventDateStr,
  isTokenExpired,
} from './calendarUtils'

// 2026-05-26 09:00 CDT = 14:00 UTC
const UTC_9AM  = '2026-05-26T14:00:00Z'
const UTC_10AM = '2026-05-26T15:00:00Z'
const CHICAGO  = 'America/Chicago'

describe('formatEventTime', () => {
  it('converts UTC ISO to local time string', () => {
    expect(formatEventTime(UTC_9AM, CHICAGO)).toBe('9:00 AM')
  })
})

describe('formatEventTimeRange', () => {
  it('produces a start–end range with timezone abbreviation', () => {
    const result = formatEventTimeRange(UTC_9AM, UTC_10AM, CHICAGO)
    // CDT in May, CT in winter — accept either
    expect(result).toMatch(/^9:00 AM – 10:00 AM \(C[DS]T\)$/)
  })
})

describe('getEventDateStr', () => {
  it('returns YYYY-MM-DD in the given timezone', () => {
    expect(getEventDateStr(UTC_9AM, CHICAGO)).toBe('2026-05-26')
  })

  it('uses the timezone to determine the date, not UTC', () => {
    // 2026-05-27T03:00:00Z = 2026-05-26T22:00:00 CDT → date is May 26 in Chicago
    expect(getEventDateStr('2026-05-27T03:00:00Z', CHICAGO)).toBe('2026-05-26')
  })
})

describe('isTokenExpired', () => {
  it('returns true for a past timestamp', () => {
    expect(isTokenExpired('2020-01-01T00:00:00Z')).toBe(true)
  })

  it('returns false for a future timestamp', () => {
    const future = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    expect(isTokenExpired(future)).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests — expect failures**

```bash
cd ZealHub && npm test
```

Expected: 5 test failures, all `Error: Cannot find module './calendarUtils'`.

- [ ] **Step 3: Implement calendarUtils.js**

Create `ZealHub/src/utils/calendarUtils.js`:

```js
export function formatEventTime(isoString, timezone) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  }).format(new Date(isoString))
}

export function getTimezoneAbbr(timezone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZoneName: 'short',
    timeZone: timezone,
  }).formatToParts(new Date())
  return parts.find(p => p.type === 'timeZoneName')?.value ?? ''
}

export function formatEventTimeRange(startISO, endISO, timezone) {
  const start = formatEventTime(startISO, timezone)
  const end   = formatEventTime(endISO, timezone)
  const abbr  = getTimezoneAbbr(timezone)
  return `${start} – ${end} (${abbr})`
}

export function getEventDateStr(isoString, timezone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    year:  'numeric',
    month: '2-digit',
    day:   '2-digit',
    timeZone: timezone,
  }).formatToParts(new Date(isoString))
  const year  = parts.find(p => p.type === 'year').value
  const month = parts.find(p => p.type === 'month').value
  const day   = parts.find(p => p.type === 'day').value
  return `${year}-${month}-${day}`
}

export function isTokenExpired(expiresAt) {
  return new Date(expiresAt) <= new Date()
}
```

- [ ] **Step 4: Run tests — expect all passing**

```bash
cd ZealHub && npm test
```

Expected: 5 tests pass, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add ZealHub/src/utils/calendarUtils.js ZealHub/src/utils/calendarUtils.test.js
git commit -m "feat: add calendar utility functions with tests"
```

---

### Task 5: `useGoogleCalendar` Hook

**Files:**
- Create: `ZealHub/src/hooks/useGoogleCalendar.js`

This hook is called in `MainApp` alongside `useTasks`, `useNotes`, and `useProjects`. It accepts `userId` and `date` (the same `date` state already in MainApp that drives CalendarView's month display). It returns connection state and event data as props for CalendarView.

- [ ] **Step 1: Create the hook**

Create `ZealHub/src/hooks/useGoogleCalendar.js`:

```js
import { useState, useEffect, useCallback } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { supabase } from '../lib/supabase'
import { isTokenExpired, getEventDateStr } from '../utils/calendarUtils'

export function useGoogleCalendar({ userId, date }) {
  const [calendarAccount, setCalendarAccount] = useState(null)
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  // Load existing connection from Supabase on mount
  useEffect(() => {
    if (!userId) return
    supabase
      .from('user_calendars')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .maybeSingle()
      .then(({ data }) => setCalendarAccount(data))
  }, [userId])

  // Re-fetch events when the connected account or displayed month changes
  useEffect(() => {
    if (!calendarAccount || !date) return

    if (isTokenExpired(calendarAccount.expires_at)) {
      // Token expired — clear the row and let the connect banner reappear
      supabase
        .from('user_calendars')
        .delete()
        .eq('id', calendarAccount.id)
        .then(() => {})
      setCalendarAccount(null)
      setEvents([])
      return
    }

    const year  = date.getFullYear()
    const month = date.getMonth()
    const timeMin = new Date(year, month, 1).toISOString()
    const timeMax = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

    const url =
      `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
      `?timeMin=${encodeURIComponent(timeMin)}` +
      `&timeMax=${encodeURIComponent(timeMax)}` +
      `&singleEvents=true&orderBy=startTime`

    setIsLoading(true)
    fetch(url, {
      headers: { Authorization: `Bearer ${calendarAccount.access_token}` },
    })
      .then(r => r.json())
      .then(data => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        const normalized = (data.items || []).map(item => ({
          id:           item.id,
          title:        item.summary || '(No title)',
          startISO:     item.start?.dateTime ?? item.start?.date,
          endISO:       item.end?.dateTime   ?? item.end?.date,
          allDay:       !item.start?.dateTime,
          color:        calendarAccount.calendar_color,
          meetLink:     item.conferenceData?.entryPoints
                          ?.find(e => e.entryPointType === 'video')?.uri ?? null,
          location:     item.location ?? null,
          attendees:    (item.attendees ?? []).map(a => ({
                          name:  a.displayName ?? a.email,
                          email: a.email,
                        })),
          calendarEmail: calendarAccount.email,
          dateStr:       getEventDateStr(
                           item.start?.dateTime ?? item.start?.date,
                           timezone
                         ),
        }))
        setEvents(normalized)
      })
      .finally(() => setIsLoading(false))
  }, [calendarAccount, date])

  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    onSuccess: async tokenResponse => {
      const expiresAt = new Date(
        Date.now() + tokenResponse.expires_in * 1000
      ).toISOString()

      const userInfo = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
      ).then(r => r.json())

      const calMeta = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary',
        { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
      ).then(r => r.json())

      const row = {
        user_id:        userId,
        provider:       'google',
        email:          userInfo.email,
        access_token:   tokenResponse.access_token,
        refresh_token:  null,
        expires_at:     expiresAt,
        calendar_color: calMeta.backgroundColor ?? '#4285F4',
      }

      const { data } = await supabase
        .from('user_calendars')
        .upsert(row, { onConflict: 'user_id,provider' })
        .select()
        .single()

      setCalendarAccount(data)
    },
    onError: error => {
      console.error('Google Calendar connect failed:', error)
    },
  })

  const connectCalendar = useCallback(() => login(), [login])

  const disconnectCalendar = useCallback(async () => {
    if (!calendarAccount) return
    await fetch(
      `https://oauth2.googleapis.com/revoke?token=${calendarAccount.access_token}`,
      { method: 'POST' }
    )
    await supabase
      .from('user_calendars')
      .delete()
      .eq('id', calendarAccount.id)
      .then(() => {})
    setCalendarAccount(null)
    setEvents([])
  }, [calendarAccount])

  return {
    events,
    isConnected:       !!calendarAccount && !isTokenExpired(calendarAccount.expires_at),
    isLoading,
    connectCalendar,
    disconnectCalendar,
  }
}
```

- [ ] **Step 2: Verify no syntax errors**

```bash
cd ZealHub && npm run build 2>&1 | head -30
```

Expected: build fails only because the hook isn't imported yet — no syntax errors in the new file itself.

- [ ] **Step 3: Commit**

```bash
git add ZealHub/src/hooks/useGoogleCalendar.js
git commit -m "feat: add useGoogleCalendar hook"
```

---

### Task 6: `EventChip` Component

**Files:**
- Create: `ZealHub/src/components/EventChip.jsx`

A small colored pill rendered inside a day cell. Clicking it stops the cell's click handler and opens the event detail modal.

- [ ] **Step 1: Create the component**

Create `ZealHub/src/components/EventChip.jsx`:

```jsx
export function EventChip({ event, onClick }) {
  const title =
    event.title.length > 18
      ? event.title.slice(0, 18) + '…'
      : event.title

  return (
    <button
      onClick={e => {
        e.stopPropagation()
        onClick(event)
      }}
      className="w-full text-left text-[10px] px-1 py-0.5 rounded leading-tight text-white truncate"
      style={{ backgroundColor: event.color }}
      title={event.title}
    >
      {title}
    </button>
  )
}
```

- [ ] **Step 2: Verify no syntax errors**

```bash
cd ZealHub && npm run build 2>&1 | head -20
```

Expected: no errors in EventChip.jsx.

- [ ] **Step 3: Commit**

```bash
git add ZealHub/src/components/EventChip.jsx
git commit -m "feat: add EventChip component"
```

---

### Task 7: `EventDetailModal` Component

**Files:**
- Create: `ZealHub/src/components/EventDetailModal.jsx`

Modal popup showing full event details. Renders nothing when `event` is `null`. Closes when the overlay is clicked or the ✕ button is pressed.

- [ ] **Step 1: Create the component**

Create `ZealHub/src/components/EventDetailModal.jsx`:

```jsx
import { formatEventTimeRange } from '../utils/calendarUtils'

export function EventDetailModal({ event, timezone, onClose }) {
  if (!event) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-96 max-w-[90vw] p-6 relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-brand-300 hover:text-brand-600 text-base leading-none"
        >
          ✕
        </button>

        <h2 className="text-base font-semibold pr-6 mb-1">{event.title}</h2>

        {event.allDay ? (
          <p className="text-sm text-brand-300 mb-3">All day</p>
        ) : (
          <p className="text-sm text-brand-300 mb-3">
            {formatEventTimeRange(event.startISO, event.endISO, timezone)}
          </p>
        )}

        {event.meetLink && (
          <a
            href={event.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline mb-3"
          >
            🎥 Join Meeting →
          </a>
        )}

        {event.location && !event.meetLink && (
          <p className="text-sm text-brand-300 mb-3">📍 {event.location}</p>
        )}

        {event.attendees.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-brand-300 uppercase tracking-wide mb-1">
              Participants
            </p>
            {event.attendees.slice(0, 5).map(a => (
              <p key={a.email} className="text-sm">
                {a.name} · <span className="text-brand-300">{a.email}</span>
              </p>
            ))}
            {event.attendees.length > 5 && (
              <p className="text-xs text-brand-300">+{event.attendees.length - 5} more</p>
            )}
          </div>
        )}

        <p className="text-xs text-brand-300 border-t border-brand-100 pt-2 mt-2">
          🗓 {event.calendarEmail}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify no syntax errors**

```bash
cd ZealHub && npm run build 2>&1 | head -20
```

Expected: no errors in EventDetailModal.jsx.

- [ ] **Step 3: Commit**

```bash
git add ZealHub/src/components/EventDetailModal.jsx
git commit -m "feat: add EventDetailModal component"
```

---

### Task 8: Wire Up in `App.jsx`

**Files:**
- Modify: `ZealHub/src/App.jsx`

Three changes: wrap the app in `GoogleOAuthProvider` (required for `useGoogleLogin` to work), call `useGoogleCalendar` in `MainApp`, and pass the new props to `CalendarView`.

The `date` state already in `MainApp` is used as-is — it drives month display for CalendarView and is what the hook uses to know which month to fetch.

- [ ] **Step 1: Add imports**

At the top of `ZealHub/src/App.jsx`, add these two imports after the existing imports:

```js
import { GoogleOAuthProvider } from '@react-oauth/google'
import { useGoogleCalendar } from './hooks/useGoogleCalendar'
```

- [ ] **Step 2: Call useGoogleCalendar in MainApp**

Inside `MainApp`, after the existing three hook calls on lines 32–34:

```js
const { tasks, addTask, updateTask, deleteTask, copyTasks, reorderTasks } = useTasks(user.id)
const { notes, setNote }                                                   = useNotes(user.id)
const { projects, addProject, updateProject, deleteProject }               = useProjects(user.id)
```

Add:

```js
const {
  events:            calendarEvents,
  isConnected:       isCalendarConnected,
  isLoading:         isCalendarLoading,
  connectCalendar,
  disconnectCalendar,
} = useGoogleCalendar({ userId: user.id, date })
```

- [ ] **Step 3: Pass new props to CalendarView**

Find the `<CalendarView>` render block (lines 143–149). Replace it with:

```jsx
{view === 'calendar' && (
  <CalendarView
    date={date}
    tasks={tasks}
    projects={projects}
    onSelectDay={handleSelectDay}
    onSelectProject={navigateToProject}
    calendarEvents={calendarEvents}
    isCalendarConnected={isCalendarConnected}
    isCalendarLoading={isCalendarLoading}
    connectCalendar={connectCalendar}
    disconnectCalendar={disconnectCalendar}
  />
)}
```

- [ ] **Step 4: Wrap App in GoogleOAuthProvider**

Find the `App` component at the bottom (lines 191–199):

```jsx
export default function App() {
  const { user, loading, login, logout } = useAuth()

  if (loading) return <LoadingScreen />

  return user
    ? <MainApp user={user} onLogout={logout} />
    : <WelcomePage onLogin={login} />
}
```

Replace with:

```jsx
export default function App() {
  const { user, loading, login, logout } = useAuth()

  if (loading) return <LoadingScreen />

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
      {user
        ? <MainApp user={user} onLogout={logout} />
        : <WelcomePage onLogin={login} />
      }
    </GoogleOAuthProvider>
  )
}
```

- [ ] **Step 5: Verify the app builds**

```bash
cd ZealHub && npm run build 2>&1 | head -30
```

Expected: build succeeds (or fails only on CalendarView prop mismatches — that's fine, we fix it next).

- [ ] **Step 6: Commit**

```bash
git add ZealHub/src/App.jsx
git commit -m "feat: wire GoogleOAuthProvider and useGoogleCalendar into MainApp"
```

---

### Task 9: Update `CalendarView.jsx`

**Files:**
- Modify: `ZealHub/src/views/CalendarView.jsx`

Three changes: (A) accept the new props, (B) restructure day cells to show EventChips, (C) add Events/Tasks tabs to the right panel.

- [ ] **Step 1: Add imports**

At the top of `ZealHub/src/views/CalendarView.jsx`, add after the existing import on line 2:

```js
import { EventChip } from '../components/EventChip'
import { EventDetailModal } from '../components/EventDetailModal'
import { formatEventTime } from '../utils/calendarUtils'
```

- [ ] **Step 2: Update the function signature**

Replace line 48:

```jsx
export default function CalendarView({ date, tasks, projects, onSelectDay, onSelectProject }) {
```

With:

```jsx
export default function CalendarView({
  date, tasks, projects, onSelectDay, onSelectProject,
  calendarEvents = [],
  isCalendarConnected = false,
  isCalendarLoading = false,
  connectCalendar,
  disconnectCalendar,
}) {
```

- [ ] **Step 3: Add new local state**

After line 54 (`const [panelDate, setPanelDate] = useState(date)`), add:

```js
const [selectedEvent, setSelectedEvent] = useState(null)
const [rightPanelTab, setRightPanelTab] = useState('events')
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
```

- [ ] **Step 4: Add the connect banner and restructure the outer wrapper**

The outer wrapper currently is `<div className="h-full flex overflow-hidden">`. Change it to a column layout so the banner sits above the calendar without overlapping it:

```jsx
<div className="h-full flex flex-col overflow-hidden">
  {!isCalendarConnected && (
    <div className="flex items-center justify-between px-4 py-2 bg-brand-50 border-b border-brand-100 text-sm shrink-0">
      <span className="text-brand-300">Connect Google Calendar to see your events here</span>
      <button
        onClick={connectCalendar}
        className="px-3 py-1 bg-brand-600 text-white text-xs rounded hover:bg-brand-700"
      >
        Connect
      </button>
    </div>
  )}
  <div className="flex-1 flex overflow-hidden min-h-0">
    {/* Left: calendar */}
    ...existing left panel...
    {/* Right: task panel */}
    ...existing right panel...
  </div>
  ...EventDetailModal...
</div>
```

In practice: wrap the existing `{/* Left: calendar */}` and `{/* Right: task panel */}` divs in a new `<div className="flex-1 flex overflow-hidden min-h-0">`, then place the banner before it. The EventDetailModal goes after this inner wrapper, still inside the outer column div.

- [ ] **Step 5: Restructure day cells to show EventChips**

Find the day cell `<button>` block (lines 116–135). Replace the entire button with:

```jsx
<button
  key={day}
  onClick={() => {
    setPanelDate(cellDate)
    if (window.innerWidth < 768) onSelectDay(cellDate)
  }}
  className={`flex flex-col rounded-xl m-0.5 p-1 min-h-14 transition-colors text-left w-full
    ${isSelected ? 'bg-brand-600 text-white' : ''}
    ${isToday && !isSelected ? 'bg-brand-50 font-semibold' : ''}
    ${!isToday && !isSelected ? 'text-gray-700 hover:bg-gray-100' : ''}
  `}
>
  <span className={`text-sm leading-none mb-0.5 self-start pl-0.5
    ${isToday && !isSelected ? 'text-brand-600' : ''}
  `}>
    {day}
  </span>
  {(() => {
    const dayEvents  = calendarEvents.filter(e => e.dateStr === dateStr)
    const visible    = dayEvents.slice(0, 3)
    const overflow   = dayEvents.length - visible.length
    return (
      <>
        <div className="flex flex-col gap-0.5 w-full">
          {visible.map(event => (
            <EventChip key={event.id} event={event} onClick={setSelectedEvent} />
          ))}
        </div>
        {overflow > 0 && (
          <span className={`text-[9px] px-0.5 mt-0.5 ${isSelected ? 'text-white/70' : 'text-brand-300'}`}>
            +{overflow} more
          </span>
        )}
      </>
    )
  })()}
</button>
```

Remove the old `taskCount` variable (line 111) — it is no longer used.

- [ ] **Step 6: Replace the right panel content with tabbed Events + Tasks**

Find the right panel content div (lines 159–177):

```jsx
<div className="flex-1 overflow-y-auto p-4 space-y-5">
  {!hasTasks && (
    <p className="text-sm text-gray-400 text-center pt-4">No tasks this day.</p>
  )}
  <TaskGroup title="Tasks" tasks={panelGeneralTasks} />
  {panelActiveProjects.map((p) => (
    <TaskGroup
      key={p.id}
      title={p.name || 'Untitled'}
      color={p.color}
      tasks={tasks.filter((t) => t.date === panelDateStr && t.projectId === p.id)}
    />
  ))}
</div>
```

Replace with:

```jsx
{/* Tab bar */}
<div className="flex border-b border-gray-100 shrink-0">
  <button
    onClick={() => setRightPanelTab('events')}
    className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
      rightPanelTab === 'events'
        ? 'border-brand-600 text-brand-600'
        : 'border-transparent text-gray-400 hover:text-gray-600'
    }`}
  >
    Events
  </button>
  <button
    onClick={() => setRightPanelTab('tasks')}
    className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
      rightPanelTab === 'tasks'
        ? 'border-brand-600 text-brand-600'
        : 'border-transparent text-gray-400 hover:text-gray-600'
    }`}
  >
    Tasks
  </button>
</div>

{/* Tab content */}
<div className="flex-1 overflow-y-auto p-4">
  {rightPanelTab === 'events' ? (
    <div className="space-y-3">
      {!isCalendarConnected ? (
        <div>
          <p className="text-sm text-gray-400 mb-2">No calendar connected.</p>
          <button
            onClick={connectCalendar}
            className="px-3 py-1.5 bg-brand-600 text-white text-sm rounded hover:bg-brand-700"
          >
            Connect Google Calendar
          </button>
        </div>
      ) : isCalendarLoading ? (
        <p className="text-sm text-gray-400">Loading events…</p>
      ) : (() => {
        const dayEvents = calendarEvents.filter(e => e.dateStr === panelDateStr)
        if (dayEvents.length === 0) {
          return <p className="text-sm text-gray-400">No events this day.</p>
        }
        return dayEvents.map(event => (
          <button
            key={event.id}
            onClick={() => setSelectedEvent(event)}
            className="flex gap-2.5 w-full text-left hover:bg-gray-50 rounded-lg p-1 -ml-1 transition-colors"
          >
            <div
              className="w-0.5 rounded-full flex-shrink-0 self-stretch"
              style={{ backgroundColor: event.color }}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{event.title}</p>
              {!event.allDay && (
                <p className="text-xs text-brand-300">
                  {formatEventTime(event.startISO, timezone)} – {formatEventTime(event.endISO, timezone)}
                </p>
              )}
              {event.meetLink && (
                <a
                  href={event.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="text-xs text-brand-600 hover:underline"
                >
                  🎥 Join →
                </a>
              )}
            </div>
          </button>
        ))
      })()}
    </div>
  ) : (
    <div className="space-y-5">
      {!hasTasks && (
        <p className="text-sm text-gray-400 text-center pt-4">No tasks this day.</p>
      )}
      <TaskGroup title="Tasks" tasks={panelGeneralTasks} />
      {panelActiveProjects.map((p) => (
        <TaskGroup
          key={p.id}
          title={p.name || 'Untitled'}
          color={p.color}
          tasks={tasks.filter((t) => t.date === panelDateStr && t.projectId === p.id)}
        />
      ))}
    </div>
  )}
</div>
```

- [ ] **Step 7: Add EventDetailModal**

At the very end of CalendarView's JSX return, just before the final `</div>` (the one that closes `h-full flex overflow-hidden`), add:

```jsx
<EventDetailModal
  event={selectedEvent}
  timezone={timezone}
  onClose={() => setSelectedEvent(null)}
/>
```

- [ ] **Step 8: Remove unused `taskCount` and `hasTasks` if needed**

After the cell restructure in Step 5, `taskCount` on line 111 is unused. Verify `hasTasks` is still needed (it's used in the Tasks tab content — keep it).

- [ ] **Step 9: Start dev server and verify**

```bash
cd ZealHub && npm run dev
```

Open http://localhost:5173 → log in → navigate to Calendar view.

Manual checklist:
- [ ] Calendar grid renders, no console errors
- [ ] "Connect Google Calendar" banner appears at top (since no account connected)
- [ ] Day cells render with room for chips (taller than before)
- [ ] Right panel shows Events/Tasks tabs
- [ ] Clicking Tasks tab shows existing task data unchanged
- [ ] Month nav (prev/next in header) still works

- [ ] **Step 10: Commit**

```bash
git add ZealHub/src/views/CalendarView.jsx
git commit -m "feat: update CalendarView with event chips, connect banner, and Events tab"
```

---

### Task 10: End-to-End Test — Connect Google Calendar

This task requires `VITE_GOOGLE_CLIENT_ID` to be set. If you haven't done the Google Cloud Console setup yet, do it now:

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project (or use existing)
3. APIs & Services → Library → search "Google Calendar API" → Enable
4. APIs & Services → Credentials → Create OAuth 2.0 Client ID
   - Application type: **Web application**
   - Authorized JavaScript origins: `http://localhost:5173`
   - (No redirect URIs needed for implicit flow)
5. Copy the **Client ID** → add to `ZealHub/.env`:
   ```
   VITE_GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
   ```
6. Restart dev server: `npm run dev`

**Files:**
- Verify: all changed files

- [ ] **Step 1: Run all tests**

```bash
cd ZealHub && npm test
```

Expected: 5 calendarUtils tests pass.

- [ ] **Step 2: Full manual flow test**

Open http://localhost:5173 → log in → navigate to Calendar.

- [ ] Connect banner appears
- [ ] Click "Connect" → Google account picker popup opens
- [ ] Select account → approve calendar.readonly permission → popup closes
- [ ] Banner disappears, loading indicator shows briefly, then events appear as colored chips in day cells
- [ ] Click an event chip → EventDetailModal opens showing: title, time range, meet link (if present), attendees
- [ ] Click outside modal → modal closes; click ✕ → modal closes
- [ ] Click a day with events → right panel Events tab shows event list for that day
- [ ] Click an event in the right panel → EventDetailModal opens
- [ ] Click Tasks tab → existing task list appears unchanged
- [ ] Click prev/next month arrows → events reload for the new month
- [ ] Navigate to Daily view → existing behavior unchanged, no console errors
- [ ] Navigate to a Project → existing behavior unchanged

- [ ] **Step 3: Verify .env is not staged**

```bash
git status
```

Confirm `.env` does not appear in the output. If it does, add it to `.gitignore` and remove it from tracking: `git rm --cached ZealHub/.env`.

- [ ] **Step 4: Final commit**

```bash
git add ZealHub/src/App.jsx ZealHub/src/views/CalendarView.jsx
git status
git commit -m "feat: Google Calendar integration complete"
```

---

## Disconnect Button (Optional MVP Addition)

The spec includes a disconnect flow. To add a minimal "Disconnect" button to the right panel, add this below the `isCalendarConnected` events section in CalendarView's Events tab:

```jsx
{isCalendarConnected && (
  <button
    onClick={disconnectCalendar}
    className="mt-4 text-xs text-brand-300 hover:text-red-500 transition-colors"
  >
    Disconnect Google Calendar
  </button>
)}
```

Place it at the bottom of the Events tab content, after the event list.
