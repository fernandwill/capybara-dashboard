
<img width="1000" height="1000" alt="capybara-dashboard" src="https://github.com/user-attachments/assets/c5afadbd-b799-41c7-8461-1dc0a48322f6" />

## Project Overview
Capybara Dashboard is a badminton match management platform delivered entirely through the `/frontend` Next.js application. The production build runs on Vercel and can be used for organizing matches, tracking player participation, monitoring payments, and visualizing activity. The Express server found in `/backend` is optional—available for bespoke local experiments—but it is not required for deploying, operating, or extending the production experience.

## Architecture
The production architecture revolves around Next.js 14 running in the App Router paradigm:

- **React UI & Client Components** – Pages such as `src/app/page.tsx` render the login form and hydrate the dashboard once a Supabase session is detected. Client components manage stateful experiences such as modals, charts, and match filtering.
- **Shared Layout & Context** – `src/app/layout.tsx` bootstraps fonts and wraps every route with `AuthProvider` so authentication state is globally available. `src/contexts/AuthContext.tsx` listens to Supabase's auth events and exposes `{ user, loading, setUser }` via React context hooks.
- **Server Actions & API Routes** – HTTP requests are handled by route handlers under `src/app/api/**`. Each handler runs inside Vercel's serverless functions, instantiates Prisma through `src/lib/database.ts`, and executes database queries directly against Supabase PostgreSQL.
- **Data Layer** – Prisma models defined in `prisma/schema.prisma` describe admins, players, matches, match-player join tables, and payments. `src/lib/database.ts` configures a singleton `PrismaClient` so the API handlers reuse connections across invocations when running locally.
- **Authentication & Authorization** – `src/lib/supabaseClient.ts` creates the Supabase JavaScript client with Vercel-managed environment variables. `src/lib/authService.ts` wraps Supabase auth helpers for signing in, signing up, signing out, and fetching the current user. Additional admin-only helpers in `src/lib/auth.ts` provide bcrypt-secured fallbacks for demo environments.

The dashboard is delivered through the Next.js App Router in `frontend/src/app`, where `AuthProvider` from the authentication context wraps the layout so every page can resolve the Supabase session before rendering protected content. The primary screen logic lives in `frontend/src/app/Dashboard.tsx`, which orchestrates data fetching, user interactions, and modal workflows. It issues fetches to the colocated API routes under `frontend/src/app/api/**` for matches, players, and aggregate statistics, while delegating Supabase sign-out to the shared auth service. Each route handler is implemented with Prisma, using the singleton client in `frontend/src/lib/database.ts` to query and mutate the Supabase-hosted Postgres schema that stores matches, players, match-player relationships, and derived stats.

The optional `/backend` Express server may be used in development when developers want to experiment with long-running background jobs or custom integrations. It does not participate in the deployed architecture.

## Deployment & Environment
Production deployments are orchestrated through Vercel with `/frontend` configured as the project root. Continuous deployment typically mirrors the main branch and produces immutable builds. The Prisma schema targets a Supabase-hosted PostgreSQL instance, and the following environment variables must be supplied in Vercel (and in local development):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`

These variables are consumed by the Supabase client in `src/lib/supabaseClient.ts` and by Prisma's connection logic in `src/lib/database.ts`, ensuring both browser-side and server-side data access operate inside Vercel's serverless environment.

## Database Models & Relationships

<img width="1000" height="1000" alt="capybara-dashboard-flow-diagram" src="https://github.com/user-attachments/assets/73aaca67-7258-40b4-9765-409a64e35321" />

Prisma models map directly to Supabase tables:

- **users** – Represents dashboard user. 
- **players** – Stores roster details, lifecycle status (`ACTIVE`, etc.), and payment status flags (`BELUM_SETOR` or `SUDAH_SETOR`).
- **matches** – Core event entity containing schedule, fee, status (`UPCOMING`/`COMPLETED`), and descriptive metadata.
- **match_players** – Join table tying players to matches while enforcing uniqueness per combination.
- **payments** – Tracks monetary transactions for players, optionally linked to matches.

These relationships allow Prisma to eagerly load players and payments alongside match data, which powers the dashboard's rich context cards and payment health indicators.

## Frontend Application Modules
### Routing & Layout
- `src/app/layout.tsx` defines HTML scaffolding, metadata, and wraps children with `AuthProvider`.
- `src/app/page.tsx` renders the login surface; if `AuthContext` exposes a user, it hydrates the `Dashboard` component instead of the login form.
- `src/app/login/page.tsx` and `src/app/signup/page.tsx` provide dedicated routes for traditional navigation flows; both reuse the shared login CSS located in `src/app/login/login.css`.
- `src/app/dashboard/page.tsx` renders the same `Dashboard` experience when accessed via `/dashboard`, while `src/app/dashboard/layout.tsx` guards access by redirecting unauthenticated visitors to `/login`.

### Authentication Flow
`AuthProvider` in `src/contexts/AuthContext.tsx` initializes Supabase, fetches the current session with `getCurrentUser`, and subscribes to `supabase.auth.onAuthStateChange` so UI state updates whenever a session starts or ends. The helper functions exported from `src/lib/authService.ts` are consumed by forms to sign in (`signInWithEmail`), sign up (`signUpWithEmail`), sign out (`signOut`), and query the authenticated user (`getCurrentUser`). Admin-only forms can additionally leverage `authenticateAdmin` and `createAdmin` from `src/lib/auth.ts` when demo credentials are needed.

```ts title="frontend/src/lib/authService.ts"
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ success: boolean; data?: AuthResponse['data']; error?: string }> {
  try {
    const { data, error }: AuthResponse = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: unknown) {
    console.error('Error signing in:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function getCurrentUser(): Promise<{
  success: boolean
  data?: UserResponse['data']['user']
  error?: string
}> {
  try {
    const { data, error }: UserResponse = await supabase.auth.getUser()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data.user }
  } catch (error: unknown) {
    console.error('Error getting current user:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
```

### Dashboard Experience
`src/app/Dashboard.tsx` orchestrates the core interface once a user is authenticated:

- Initializes local state for stats, match filters, modal visibility, theme, and destructive actions.
- Fetches aggregate stats from `/api/stats` and match collections from `/api/matches`, caching responses in component state.
- Triggers `/api/matches/auto-update` on mount so stale `UPCOMING` matches automatically transition to `COMPLETED` if their end time has passed.
- Provides handlers for creating and updating matches (`handleSubmitMatch`), deleting matches (`handleConfirmDeleteMatch`), and logging out (`handleLogout`).
- Computes derived values such as the closest upcoming match, countdown timers, formatted currency, and payment completion status.
- Filters and sorts match cards using helper functions (`sortMatches`, `formatDate`, `formatTimeWithDuration`, `areAllPlayersPaid`, etc.).

### System Flow Diagram

At runtime, `AuthProvider` performs a `getCurrentUser()` call so the UI knows whether a Supabase user session exists. Once authenticated, the dashboard triggers fetches such as `GET /api/matches`, `GET /api/players`, and `GET /api/stats` for read paths, while user actions lead to mutations including `POST /api/matches`, `PUT /api/matches/:id`, and `POST /api/matches/:id/players`. Each request lands in the corresponding `src/app/api/**` handler, where the Supabase client performs `select`, `insert`, or `update` operations against the `matches`, `players`, `match_players`, and `payments` tables (joined to `users` when user-specific data is required). Responses flow back up the stack so the UI can refresh state and modals with the latest data.

```tsx title="frontend/src/app/Dashboard.tsx"
const handleSubmitMatch = async (matchData: {
  title: string
  location: string
  courtNumber: string
  date: string
  time: string
  fee: number
  status: string
  description?: string
}) => {
  try {
    const isEditing = editingMatch !== null
    const url = isEditing ? `/api/matches/${editingMatch.id}` : "/api/matches"
    const method = isEditing ? "PUT" : "POST"

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(matchData),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    console.log(
      `Match ${isEditing ? "updated" : "created"} successfully:`,
      result
    )

    setIsModalOpen(false)
    setEditingMatch(null)
    fetchStats()
    fetchMatches()
    setSuccessModal({
      isOpen: true,
      title: "Success!",
      message: `Match ${isEditing ? "updated" : "created"} successfully!`,
    })
  } catch (error) {
    console.error(`Error ${editingMatch ? "updating" : "creating"} match:`, error)
    setErrorModal({
      isOpen: true,
      title: "Error!",
      message: `Failed to ${editingMatch ? "update" : "create"} match. Please try again.`,
    })
  }
}
```

The dashboard renders auxiliary components:

- **`StatsChart` (`src/components/StatsChart.tsx`)** – Fetches `/api/stats/monthly`, transforms results into 12-month chart data, and renders a responsive bar chart with Recharts while handling loading and empty states.
- **Modals** – `NewMatchModal`, `MatchDetailsModal`, `DeleteMatchModal`, `SuccessModal`, and `ErrorModal` control CRUD workflows. `NewMatchModal` assembles match payloads with start/end time parsing, `MatchDetailsModal` visualizes players and payments per match, `DeleteMatchModal` confirms destructive actions, and the success/error modals deliver consistent feedback messaging.
- **UI Utilities** – Components leverage a custom `Select` control and Tailwind utility helpers (`cn` in `src/lib/utils.ts`) for styling consistency.

### Styling & Theming
Dashboard components toggle dark/light themes by mutating the `dark` class on `<html>`. CSS modules in `src/app/login/login.css` and component-level styles deliver the branded experience and modal layout.

## API Surface & Business Logic
All HTTP endpoints live under `src/app/api` and run inside Vercel's serverless context:

- **Players (`api/players`)**
  - `GET /api/players` returns all players sorted alphabetically.
  - `POST /api/players` creates players with default status values.
  - `GET /api/players/:id`, `PUT /api/players/:id`, and `DELETE /api/players/:id` support record retrieval, updates (including payment status changes), and deletion.
- **Matches (`api/matches`)**
  - `GET /api/matches` fetches matches with related players and payments, sorted by date.
  - `POST /api/matches` creates matches, normalizes schedule metadata, and auto-derives completion state when the end time has elapsed.
  - `GET /api/matches/:id`, `PUT /api/matches/:id`, and `DELETE /api/matches/:id` manage match-specific retrieval, edits (with automatic status recalculation), and deletion. Each update invokes `updateMatchStatuses` to ensure downstream records stay consistent.
  - `POST /api/matches/auto-update` is a maintenance endpoint invoked by the dashboard to mark overdue matches as `COMPLETED` without manual intervention.
- **Statistics (`api/stats`)**
  - `GET /api/stats` returns total match counts, segmented upcoming/completed figures, and aggregated hours played by parsing stored time ranges.
  - `GET /api/stats/monthly` groups completed matches by year-month and returns both match counts and cumulative hours for charting.
- **Authentication (`api/auth`)**
  - `POST /api/auth/login` validates credentials via `authenticateAdmin` and returns admin metadata on success.
  - `POST /api/auth/register` provisions admins via `createAdmin`, intended for tightly controlled scenarios.

Each route wraps Prisma operations in try/catch blocks, logging unexpected errors and returning descriptive HTTP status codes for the dashboard to interpret.

```ts title="frontend/src/app/api/matches/[id]/route.ts"
async function updateMatchStatuses() {
  try {
    const now = new Date()
    let updatedCount = 0

    const upcomingMatches = await prisma.match.findMany({
      where: {
        status: 'UPCOMING',
        date: {
          lte: now,
        },
      },
      select: {
        id: true,
        date: true,
        time: true,
        title: true,
      },
    })

    for (const match of upcomingMatches) {
      try {
        const timeParts = match.time.split('-')
        if (timeParts.length !== 2) {
          console.warn(`Invalid time format for match ${match.id}: ${match.time}`)
          continue
        }

        const endTime = timeParts[1]
        const [endHour, endMin] = endTime.split(':').map(Number)

        const matchEndDate = new Date(match.date)
        matchEndDate.setHours(endHour, endMin, 0, 0)

        if (matchEndDate < now) {
          await prisma.match.update({
            where: { id: match.id },
            data: { status: 'COMPLETED' },
          })

          console.log(`Auto-completed match: ${match.title} (${match.id})`)
          updatedCount++
        }
      } catch (parseError) {
        console.error(`Error parsing time for match ${match.id}:`, parseError)
        continue
      }
    }

    return updatedCount
  } catch (error) {
    console.error('Error updating match statuses:', error)
  }
}
```

```ts title="frontend/src/app/api/stats/route.ts"
export async function GET() {
  try {
    const totalMatches = await prisma.match.count()

    const upcomingMatches = await prisma.match.count({
      where: { status: 'UPCOMING' },
    })

    const completedMatches = await prisma.match.count({
      where: { status: 'COMPLETED' },
    })

    const completedMatchesWithTime = await prisma.match.findMany({
      where: { status: 'COMPLETED' },
      select: { time: true },
    })

    let totalHours = 0
    completedMatchesWithTime.forEach((match: MatchWithTime) => {
      if (match.time && match.time.includes('-')) {
        const [startTime, endTime] = match.time.split('-')
        const [startHour, startMin] = startTime.split(':').map(Number)
        const [endHour, endMin] = endTime.split(':').map(Number)

        const startMinutes = startHour * 60 + startMin
        const endMinutes = endHour * 60 + endMin
        const durationMinutes = endMinutes - startMinutes

        totalHours += durationMinutes / 60
      }
    })

    return NextResponse.json({
      totalMatches,
      upcomingMatches,
      completedMatches,
      hoursPlayed: totalHours.toFixed(1),
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
```

## Data & Automation Fundamentals
- **State Management** – React hooks drive UI state, while context provides cross-route access to Supabase sessions.
- **Serverless Execution** – Next.js route handlers replace the traditional Express backend and run close to the database within Vercel's infrastructure, reducing latency and operational overhead.
- **Time-Based Automation** – Both match creation and update flows parse `time` strings (e.g., `18:00-20:00`) to automatically update statuses and compute durations for statistics.
- **Data Visualization** – Recharts integrates seamlessly with responsive containers to deliver monthly overviews without server-side rendering requirements.
- **Error Handling** – Components and API routes centralize error handling via consistent modals and JSON payloads, aiding both developer debugging and user experience.

## Optional Express Backend
The `/backend` directory contains an Express server that mirrors parts of the API surface for local experimentation. It can be launched when developers need custom routes, long-running background tasks, or when testing Prisma logic outside of Vercel's edge functions. Production deployments ignore this service; all stable functionality should be implemented within Next.js routes to maintain parity with the live environment.

## Development Workflow
1. Install dependencies within `/frontend` (`npm install`).
2. Configure environment variables in `.env.local` matching the Supabase project credentials and Prisma connection string.
3. Run the development server with `npm run dev` (from `/frontend`), which starts the Next.js app at `http://localhost:3000`.
4. Apply database migrations via `npx prisma migrate dev` when schema changes occur.
5. Use Supabase Studio or Prisma Studio (`npx prisma studio`) to inspect data during development.
