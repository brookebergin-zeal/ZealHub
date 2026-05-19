# ZealHub — Claude Code context

Single-user React webapp for Zeal IT Consultants. Built to practice React fundamentals. Supabase backend (Postgres + RLS). Deployed on Vercel.

---

## Stack

- **React 19** + **Vite 6**
- **Tailwind CSS v4** — configured via `@tailwindcss/vite` plugin, no `tailwind.config.js`. CSS entry point is `src/index.css` with `@import "tailwindcss"`.
- **Supabase** — Postgres database + Auth (Google OAuth). Client lives in `src/lib/supabase.js`. Schema in `supabase/schema.sql`.
- No routing library — view state is plain `useState` in `App.jsx`.
- No state management library — all state is lifted to `App.jsx > MainApp` and passed as props.

---

## Architecture

### State lives in `App.jsx > MainApp`

All hooks are called at the `MainApp` level and passed down as props. Do not move state into child components or introduce context unless explicitly asked.

```
App (auth gate — shows LoadingScreen / WelcomePage / MainApp)
└── MainApp (all hooks, routing state)
    ├── Sidebar        (desktop nav)
    ├── BottomNav      (mobile nav)
    ├── MainHeader     (view title + date nav + Today button)
    ├── DailyView / CalendarView / ProjectView
    ├── AddProjectModal (conditional)
    └── SearchModal    (conditional, ⌘K)
```

### Routing

Three-state system in `MainApp`:
- `view`: `'daily' | 'calendar' | 'project'`
- `activeProjectId`: `string | null`

Navigate with `navigateToView(v)` or `navigateToProject(id)` — never set these independently.

### Data persistence — Supabase

Each hook (`useTasks`, `useNotes`, `useProjects`) follows the same pattern:
- `useState` starts empty (`[]` or `{}`)
- A `useEffect` on `userId` fetches the user's rows from Supabase on mount
- All mutations update local state **optimistically first**, then fire a Supabase call fire-and-forget
- A `useRef` (e.g. `tasksRef`) keeps a current snapshot of state for operations that need to read state outside of a `setState` call (e.g. `reorderTasks`, `addProject` color picker)

Do **not** add direct `localStorage` calls — data lives in Supabase.

### Auth — Supabase Google OAuth

`useAuth()` returns `{ user, loading, login, logout }`:
- `user` shape: `{ id: uuid, name: string, email: string, picture: string }`
- `loading`: true while `getSession()` is resolving on initial load
- `login()` calls `supabase.auth.signInWithOAuth({ provider: 'google' })` — redirect-based
- `logout()` calls `supabase.auth.signOut()`

`App` shows `<LoadingScreen />` while `loading`, then `<WelcomePage onLogin={login} />` or `<MainApp user={user} onLogout={logout} />`.

---

## Data models

### Task
```js
{
  id: string,          // "task_<timestamp>_<random>"
  title: string,
  description: string,
  status: 'todo' | 'in_progress' | 'done',
  priority: 'low' | 'medium' | 'high',
  date: string | null,      // YYYY-MM-DD — which day this appears on
  projectId: string | null, // null = general task
  tags: string[],
  sortOrder: number,        // for drag-to-reorder; fractional approach (avg of neighbours)
  createdAt: string,        // ISO datetime
  updatedAt: string,
}
```
DB column names are snake_case (`project_id`, `sort_order`, etc.). `dbToTask()` in `useTasks.js` maps db → app shape.

### Project
```js
{
  id: string,           // "proj_<timestamp>_<random>"
  name: string,
  startDate: string,    // YYYY-MM-DD
  endDate: string|null, // YYYY-MM-DD
  teamMembers: string[],
  notes: string,
  color: string,        // hex, auto-assigned from PALETTE or changed via color picker
  archived: boolean,
  createdAt: string,
  updatedAt: string,
}
```
DB column names are snake_case. `dbToProject()` in `useProjects.js` maps db → app shape.

### Notes
Stored in Supabase `notes` table as `(user_id, date, text)`. In app state: flat object `{ "YYYY-MM-DD": "note text" }`. Accessed via `notes[dateStr] ?? ''`.

### User (auth)
```js
{ id: string, name: string, email: string, picture: string }
```
Comes from Supabase session `user_metadata`. Not stored in localStorage.

---

## Key conventions

### Date strings
Always use `toDateString(date)` from `src/utils/dateUtils.js` to convert a `Date` to `YYYY-MM-DD`. Never use `date.toISOString().split('T')[0]` directly — timezone handling differs.

### `addMonths` — always sets date to 1st first
`addMonths` calls `d.setDate(1)` before `d.setMonth(...)`. This prevents month overflow (e.g. Jan 31 + 1 month would otherwise land in March). Do not remove this.

### Project active-on-day check
```js
p.startDate && p.startDate <= dateStr && (!p.endDate || p.endDate >= dateStr)
```

### Deleting a project
Always delete associated tasks first, then delete the project:
```js
tasks.filter(t => t.projectId === id).forEach(t => deleteTask(t.id))
deleteProject(id)
```
This is handled in `handleDeleteProject` in `MainApp` — do not call `deleteProject` directly from child components.

### Resize handles (DailyView)
The left/right and notes/calendar splits use `let latest` inside drag closures to avoid stale closure issues when persisting on mouseup. The split percentages are stored in localStorage (not Supabase — UI preference, not data). Do not refactor the drag closure pattern.

### TaskChecklist keys in DailyView
All `<TaskChecklist>` instances in `DailyView` carry a `key` that includes `dateStr` (e.g. `key={dateStr}` for the general list, `key={`${project.id}-${dateStr}`}` for project lists). This forces React to remount them on day navigation, clearing any pending typed input. Do not remove these keys.

### copyTasks (useTasks)
`copyTasks(sourceTasks, targetDate)` batch-creates copies of an array of tasks, assigning each a new `id`, the given `targetDate`, and `status: 'todo'`. Used by DailyView's "copy unfinished tasks from yesterday" banner. The banner only appears for tasks that don't already have a matching title+projectId entry on `targetDate`.

### Task sort_order — fractional indexing
New tasks get `sort_order = Date.now()` (large integer, always grows). On drag-to-reorder, only the moved task's `sort_order` is updated — to `Math.floor((prevOrder + nextOrder) / 2)`. This means only one Supabase update per reorder. The gap between any two adjacent integers from Date.now() is large enough that bisecting will never run out of precision for any realistic usage.

### CalendarView panelDate
`CalendarView` manages a local `panelDate` state (the day whose tasks are shown in the right panel). Clicking a day sets `panelDate` but does NOT navigate. Navigation happens via the `Daily →` button in the panel, which calls `onSelectDay(panelDate)`. On mobile (`window.innerWidth < 768`), clicking a day still calls `onSelectDay` directly (no panel is shown on mobile).

### GoogleCalendarEmbed
`GoogleCalendarEmbed` accepts a `userEmail` prop (not `useAuth()` directly). `DailyView` receives `userEmail` from `MainApp` and passes it down.

---

## Styling rules

- Use Tailwind utility classes. For dynamic colours (project colours), use inline `style={{ color: p.color }}` — dynamic Tailwind class names won't be included in the build.
- `accentColor` on checkboxes is set via `style={{ accentColor: ... }}` for the same reason.
- The `.scrollbar-hide` utility is defined in `src/index.css` (not a Tailwind plugin).
- Mobile-first: default styles are mobile, `md:` prefix adds desktop overrides.
- The breakpoint for desktop layout is `md` (768px). Below this: stacked layout + bottom nav. Above: sidebar + split panels.

### Design tokens (`src/index.css` `@theme` block)

All brand colours are defined as CSS custom properties in the `@theme` block and exposed as Tailwind utilities (`bg-brand-*`, `text-brand-*`, `border-brand-*`, `ring-brand-*`). To change the brand colour across the whole app, edit only the token values in `src/index.css`. The current scale:

| Token | Value | Role |
|---|---|---|
| `brand-50` | `#F5F7F8` | Subtle backgrounds (nav highlights, banners) |
| `brand-100` | `#E6E7EB` | Hover backgrounds (resize handles) |
| `brand-300` | `#919AAB` | Muted text / borders |
| `brand-400` | `#0A76B7` | Focus rings, accent dots |
| `brand-600` | `#0A76B7` | Primary colour — buttons, logo, selected states |
| `brand-700` | `#000000` | Hover state on primary buttons |

- Never use `indigo-*` classes — use `brand-*` equivalents.
- `var(--color-brand-600)` is used in inline styles where Tailwind classes can't reach (e.g. checkbox `accentColor`).
- Per-project palette colours in `useProjects.js` and inline `style={{ backgroundColor: project.color }}` are intentionally separate — they are dynamic per-project values, not theme tokens.

---

## What's intentionally simple / not yet built

- **No React Router** — intentional, view routing is a learning exercise
- **No Context API** — props are passed down explicitly; good for learning data flow
- **Google Calendar** — iframe embed only (uses browser session); Calendar API not integrated
- **Project task completion %** — no progress indicator
- **Add project on mobile** — Add Project button only on desktop sidebar
- **Long-term goals** — deferred
- **Multi-user** — each login is isolated; no data sharing between users
- **Data migration** — no migration path from the old localStorage version

Do not introduce abstractions or patterns not already present unless the task explicitly requires it.
