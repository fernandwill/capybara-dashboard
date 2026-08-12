# CapyHub

Badminton match and court management app with real-time updates.

CapyHub is a full-stack web app that a real badminton club uses to run its weekly sessions. It tracks players, matches, and payments in one place, and keeps every screen in sync in real time, so coordinators on court can focus on the game instead of the paperwork.

Open source under the MIT license. Contributions from club members and the community are welcome.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Real-time sync.** Match, player, and payment changes appear on every screen within about a second, no manual refresh.
- **2v2 court management.** A randomizer auto-assigns players to courts, and every finished game is recorded into per-player play counts.
- **Player and payment tracking.** 200+ players, 60+ matches, and 180+ hours of play tracked end-to-end, with payment status in one place.
- **Analytics dashboard.** Monthly activity charts and live match stats at a glance.
- **Automatic status updates.** Match statuses update as matches progress, with a daily Vercel cron as a safety net.
- **PDF match sheets.** One-click export of printable match sheets so coordinators can tally attendance and games by hand.

## Repository structure

```
capyhub/
├── frontend/    # Next.js 16 app (App Router). The production app, deployed on Vercel.
├── backend/     # Legacy Express + Prisma server. Kept for reference, not used in production.
└── .env.local   # Shared environment config (never committed).
```

The app lives in `frontend/`. The backend was an early Express API server and is not used by the current deployment; it is kept for reference.

## Tech stack

| Category | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript, Tailwind CSS 4, Radix UI |
| Data | PostgreSQL, Prisma, SWR |
| Backend services | Supabase (Auth, Realtime) |
| Charts | Recharts |
| PDF | jsPDF |
| Testing | Vitest |
| Deployment | Vercel |

## Getting started

### Prerequisites

- Node.js 20+
- A Supabase project (for auth and the database)
- A PostgreSQL connection string

### Local setup

```bash
# Clone the repository
git clone https://github.com/fernandwill/capyhub.git
cd capyhub

# 1. Create the shared environment file from the template and fill in your own values
cp .env.example .env.local

# 2. Make the variables available to your shell.
#    The Prisma CLI needs DATABASE_URL during `npm install`, and it does not
#    read the root .env.local by itself. (Git Bash or WSL on Windows.)
set -a; source .env.local; set +a

# 3. Install and start the frontend
cd frontend
npm install        # also generates the Prisma client (postinstall)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> Only exploring the code? `prisma generate` never connects to the database, it only validates the URL format, so a placeholder like `postgresql://user:pass@localhost:5432/capyhub` is enough to get past it.

### Environment variables

Create `.env.local` at the repo root. The frontend loads it automatically via `next.config.ts`.

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Database (Required)
DATABASE_URL="postgresql://user:pass@host:6543/dbname"

# Vercel Cron (Required for automatic status updates in production)
CRON_SECRET="a-random-16-plus-character-string"
```

For the full reference (scripts, API endpoints, architecture), see [frontend/README.md](frontend/README.md).

## Deployment

Deployed on Vercel with the root directory set to `frontend`. The cron route `/api/matches/auto-update` runs once a day (Vercel Hobby allows `0 17 * * *`) to catch any status updates the real-time triggers missed.

## Testing

```bash
cd frontend
npm run test:run   # single run
npm run lint       # ESLint
```

## Contributing

CapyHub is open source and contributions are welcome. It is a real, working app, so the best contributions are ones that make it more useful for the club: new features, bug fixes, better UX, tests, and docs.

To contribute:

1. Fork the repository and create a feature branch.
2. Follow the existing code patterns and keep changes focused.
3. Add tests for new functionality.
4. Run `npm run lint` and `npm run test:run` from `frontend/`.
5. Open a pull request describing the change.

For local development you will need your own Supabase project and a `.env.local` with your own keys (see "Environment variables").

## License

MIT. See [LICENSE](LICENSE).
