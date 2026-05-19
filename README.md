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
| Auth | Google OAuth via Supabase Auth |
| Database | Supabase (Postgres + RLS) |
| Deployment | Vercel |

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run the contents of `supabase/schema.sql` to create the tables
3. Go to **Authentication → Providers → Google** and enable it
   - You'll need a Google OAuth Client ID and Secret from [Google Cloud Console](https://console.cloud.google.com)
   - Add `https://<your-project>.supabase.co/auth/v1/callback` as an Authorized redirect URI in Google Cloud Console
4. Copy your **Project URL** and **anon public key** from Project Settings → API

### 3. Configure environment

Create `.env.local` in the project root:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Deploying to Vercel

1. Push the repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables
4. In Supabase: **Authentication → URL Configuration** → add your Vercel domain to **Redirect URLs** (e.g. `https://zealhub.vercel.app`)
5. In Google Cloud Console: add the Vercel domain to **Authorized JavaScript origins**

---

## Features

### Views
- **Daily** — tasks checklist + notes + embedded Google Calendar for a selected day. Panels are drag-resizable on desktop.
- **Calendar** — monthly grid with project span bars. Click any day to preview its tasks in a right-hand panel; click **Daily →** in the panel to navigate to that day.
- **Project pages** — one page per project, accessible from the sidebar.

### Tasks
- Tasks belong to a specific day (`date` field, `YYYY-MM-DD`)
- General tasks have no project association (`projectId: null`)
- Project tasks are linked to a project (`projectId`)
- On the Daily view, active projects for that day get their own task section alongside the general one
- **Inline editing** — click a task title to rename it; press Enter or click away to save
- **Drag to reorder** — drag the handle on the left of any task to reorder within its section
- **Copy unfinished tasks** — if yesterday has unfinished tasks not already present today, a banner appears with a one-click copy option

### Projects
- Each project has a name, start date, optional end date, team members, and notes
- Auto-assigned a colour from a fixed palette (can be changed via the colour picker on the project page)
- Span bars appear on the Calendar view across their date range
- Projects can be archived (hidden from nav and daily view) or deleted (also deletes all tasks)
- Deleting a project also deletes all associated tasks

### Notes
- Per-day notes, stored in Supabase keyed by user + date

### Search
- Press **⌘K** (Mac) or **Ctrl+K** (Windows) to open the search modal
- Searches all tasks across all days and projects
- Click a result to jump to that day

### Google Calendar embed
- Automatically constructed from the logged-in user's email — no manual setup required
- Uses the browser's existing Google session

### Design tokens
- Brand colours and font are defined as CSS custom properties in `src/index.css` under `@theme`
- To change the brand colour across the whole app, edit only the token values in `src/index.css`

---

## Project structure

```
src/
├── App.jsx                      # Root — auth gate + main layout + routing state
├── main.jsx
├── index.css                    # Tailwind import + @theme design tokens
│
├── lib/
│   └── supabase.js              # Supabase client (createClient)
│
├── pages/
│   └── WelcomePage.jsx          # Login screen (shown when not authenticated)
│
├── views/
│   ├── DailyView.jsx            # Tasks + notes + calendar for one day; drag-resize panels
│   ├── CalendarView.jsx         # Monthly grid with project spans + day task panel
│   └── ProjectView.jsx          # Editable project detail page
│
├── components/
│   ├── Sidebar.jsx              # Desktop left nav (Daily, Calendar, projects, logout)
│   ├── BottomNav.jsx            # Mobile bottom nav (scrollable, includes projects)
│   ├── MainHeader.jsx           # Top bar: view title | date  ← → | Today
│   ├── TaskChecklist.jsx        # Reusable task list with add/toggle/delete/edit/reorder
│   ├── Notes.jsx                # Textarea that saves on change
│   ├── GoogleCalendarEmbed.jsx  # iframe built from userEmail prop + local timezone
│   ├── AddProjectModal.jsx      # New project form (modal)
│   └── SearchModal.jsx          # ⌘K task search across all days
│
├── hooks/
│   ├── useAuth.js               # Supabase auth — session, login (Google OAuth), logout
│   ├── useTasks.js              # Task CRUD + copyTasks + reorderTasks, Supabase-backed
│   ├── useNotes.js              # Per-day notes, Supabase-backed
│   └── useProjects.js           # Project CRUD, Supabase-backed
│
└── utils/
    └── dateUtils.js             # toDateString, calendarGrid, addDays, addMonths, etc.

supabase/
└── schema.sql                   # Database schema — run once in Supabase SQL Editor
```

---

## Database tables

| Table | Primary key | Description |
|---|---|---|
| `tasks` | `id` (text) | Task rows with `user_id` RLS, `sort_order` for drag reorder |
| `projects` | `id` (text) | Project rows with `user_id` RLS |
| `notes` | `(user_id, date)` | One note per user per day |

All tables have Row Level Security enabled — users can only read and write their own data.

---

## Planned / not yet built

- **Project task completion %** — progress indicator on the project page
- **Add project on mobile** — the Add Project button is only on the desktop sidebar
- **Long-term goals view**
- **Multi-user** — currently each login is isolated; no sharing between users
- **Google Calendar API** — currently iframe embed only
- **Data migration from localStorage** — existing data from the old localStorage version cannot be automatically imported
