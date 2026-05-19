# ZealHub

A single-user productivity webapp for Zeal IT Consultants staff. Track daily tasks, take notes, manage projects, and view your Google Calendar — all in one place.

Built as a React fundamentals learning project.

---

## Tech stack

| Layer | Choice |
|---|---|
| Bundler | Vite 6 |
| UI | React 19 |
| Styling | Tailwind CSS v4 |
| Auth | Google OAuth 2.0 via `@react-oauth/google` |
| Persistence | `localStorage` (no backend) |

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → **APIs & Services → OAuth consent screen**
   - User type: **Internal** (locks login to your Google Workspace domain)
3. **Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Authorised JavaScript origins: `http://localhost:5173`
4. Copy the client ID

### 3. Configure environment

Create `.env.local` in the project root:

```
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Features

### Views
- **Daily** — tasks checklist + notes + embedded Google Calendar for a selected day. Panels are drag-resizable.
- **Calendar** — monthly grid with project span bars. Click any day to jump to Daily view for that date.
- **Project pages** — one page per project, accessible from the sidebar.

### Tasks
- Tasks belong to a specific day (`date` field, `YYYY-MM-DD`)
- General tasks have no project association (`projectId: null`)
- Project tasks are linked to a project (`projectId`)
- On the Daily view, active projects for that day get their own task section alongside the general one

### Projects
- Each project has a name, start date, optional end date, team members, and notes
- Auto-assigned a colour from a fixed palette
- Span bars appear on the Calendar view across their date range
- Deleting a project also deletes all associated tasks

### Notes
- Per-day rich-text-free notes, stored separately from tasks
- Persisted to `localStorage` keyed by date string

### Google Calendar embed
- Automatically constructed from the logged-in user's email — no manual setup required
- Uses the browser's existing Google session

---

## Project structure

```
src/
├── App.jsx                      # Root — auth gate + main layout + routing state
├── main.jsx
├── index.css
│
├── pages/
│   └── WelcomePage.jsx          # Login screen (shown when not authenticated)
│
├── views/
│   ├── DailyView.jsx            # Tasks + notes + calendar for one day
│   ├── CalendarView.jsx         # Monthly grid with project spans
│   └── ProjectView.jsx          # Editable project detail page
│
├── components/
│   ├── Sidebar.jsx              # Desktop left nav (Daily, Calendar, projects, logout)
│   ├── BottomNav.jsx            # Mobile bottom nav (scrollable, includes projects)
│   ├── MainHeader.jsx           # Top bar: view title | date  ← →
│   ├── TaskChecklist.jsx        # Reusable task list with add/toggle/delete
│   ├── Notes.jsx                # Textarea that saves on change
│   ├── GoogleCalendarEmbed.jsx  # iframe built from user email + local timezone
│   └── AddProjectModal.jsx      # New project form (modal)
│
├── hooks/
│   ├── useAuth.js               # Google user profile in localStorage
│   ├── useTasks.js              # Task CRUD, localStorage-backed
│   ├── useNotes.js              # Per-day notes, localStorage-backed
│   └── useProjects.js           # Project CRUD, localStorage-backed
│
└── utils/
    └── dateUtils.js             # toDateString, calendarGrid, addDays, addMonths, etc.
```

---

## localStorage keys

| Key | Contents |
|---|---|
| `zealhub_user` | Logged-in user profile `{ name, email, picture }` |
| `zealhub_tasks` | Array of task objects |
| `zealhub_notes` | Map of `{ "YYYY-MM-DD": "note text" }` |
| `zealhub_projects` | Array of project objects |
| `zealhub_hsplit` | Daily view left/right split percentage |
| `zealhub_vsplit` | Daily view notes/calendar split percentage |

---

## Planned / not yet built

- User login (currently Google OAuth profile is used; no session management)
- Long-term goals view
- Project progress tracking on Calendar
- Multi-user / backend persistence
