# ZealHub — Claude Code context

Single-user React webapp for Zeal IT Consultants. Built to practice React fundamentals. No backend — all state lives in `localStorage`.

---

## Stack

- **React 19** + **Vite 6**
- **Tailwind CSS v4** — configured via `@tailwindcss/vite` plugin, no `tailwind.config.js`. CSS entry point is `src/index.css` with `@import "tailwindcss"`.
- **`@react-oauth/google`** — Google OAuth for login. Client ID comes from `VITE_GOOGLE_CLIENT_ID` in `.env.local`.
- No routing library — view state is plain `useState` in `App.jsx`.
- No state management library — all state is lifted to `App.jsx > MainApp` and passed as props.

---

## Architecture

### State lives in `App.jsx > MainApp`

All hooks are called at the `MainApp` level and passed down as props. Do not move state into child components or introduce context unless explicitly asked.

```
App (auth gate + GoogleOAuthProvider)
└── MainApp (all hooks, routing state)
    ├── Sidebar        (desktop nav)
    ├── BottomNav      (mobile nav)
    ├── MainHeader     (view title + date nav)
    ├── DailyView / CalendarView / ProjectView
    └── AddProjectModal (conditional)
```

### Routing

Three-state system in `MainApp`:
- `view`: `'daily' | 'calendar' | 'project'`
- `activeProjectId`: `string | null`

Navigate with `navigateToView(v)` or `navigateToProject(id)` — never set these independently.

### Persistence pattern

Every hook (`useTasks`, `useNotes`, `useProjects`) uses the same pattern:
- `useState` initialised from `localStorage` via a lazy initialiser
- A single `persist(updater)` function that calls `setX` with a functional updater AND writes to `localStorage` inside the same call — they cannot diverge
- All CRUD goes through `persist`

Do not add direct `localStorage.setItem` calls outside of these hooks.

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
  createdAt: string,        // ISO datetime
  updatedAt: string,
}
```

### Project
```js
{
  id: string,           // "proj_<timestamp>_<random>"
  name: string,
  startDate: string,    // YYYY-MM-DD
  endDate: string|null, // YYYY-MM-DD
  teamMembers: string[],
  notes: string,
  color: string,        // hex, auto-assigned from PALETTE in useProjects.js
  createdAt: string,
  updatedAt: string,
}
```

### Notes
Stored as a flat object: `{ "YYYY-MM-DD": "note text" }`. Accessed via `notes[dateStr] ?? ''`.

### User (auth)
```js
{ name: string, email: string, picture: string }
```
Stored in `localStorage` under `zealhub_user`. Reading from `useAuth()` anywhere always reflects the same localStorage value.

---

## Key conventions

### Date strings
Always use `toDateString(date)` from `src/utils/dateUtils.js` to convert a `Date` to `YYYY-MM-DD`. Never use `date.toISOString().split('T')[0]` directly — timezone handling differs.

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
The left/right and notes/calendar splits use `let latest` inside drag closures to avoid stale closure issues when persisting on mouseup. Do not refactor this to use `useRef` without testing — the current pattern is intentional.

---

## Styling rules

- Use Tailwind utility classes. For dynamic colours (project colours), use inline `style={{ color: p.color }}` — dynamic Tailwind class names won't be included in the build.
- `accentColor` on checkboxes is set via `style={{ accentColor: ... }}` for the same reason.
- The `.scrollbar-hide` utility is defined in `src/index.css` (not a Tailwind plugin).
- Mobile-first: default styles are mobile, `md:` prefix adds desktop overrides.
- The breakpoint for desktop layout is `md` (768px). Below this: stacked layout + bottom nav. Above: sidebar + split panels.

### Design tokens (`src/index.css` `@theme` block)

All brand colours are defined as CSS custom properties in the `@theme` block and exposed as Tailwind utilities (`bg-brand-*`, `text-brand-*`, `border-brand-*`, `ring-brand-*`). To change the brand colour, edit only `src/index.css`:

```css
@theme {
  --color-brand-50:  #eef2ff;
  --color-brand-100: #e0e7ff;
  --color-brand-300: #c7d2fe;
  --color-brand-400: #818cf8;
  --color-brand-600: #6366f1;
  --color-brand-700: #4f46e5;
  --font-sans: 'Inter', sans-serif;
}
```

- Never use `indigo-*` classes — use `brand-*` equivalents.
- `var(--color-brand-600)` is used in inline styles where Tailwind classes can't reach (e.g. checkbox `accentColor`).
- Per-project palette colours in `useProjects.js` and inline `style={{ backgroundColor: project.color }}` are intentionally separate — they are dynamic per-project values, not theme tokens.

---

## What's intentionally simple / not yet built

- **No React Router** — intentional, view routing is a learning exercise
- **No Context API** — props are passed down explicitly; good for learning data flow
- **No backend** — all data in localStorage; a backend + auth iteration is planned
- **Google Calendar** — iframe embed only (uses browser session); Calendar API not integrated
- **Long-term goals** — deferred to a future iteration
- **Project progress tracking** — deferred
- **Multi-user** — deferred

Do not introduce abstractions or patterns not already present unless the task explicitly requires it.
