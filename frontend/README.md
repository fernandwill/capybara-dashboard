# CapyHub Dashboard Frontend

<img width="1000" height="1000" alt="capybara-dashboard" src="https://github.com/user-attachments/assets/c5afadbd-b799-41c7-8461-1dc0a48322f6" />

A modern badminton match tracker and management system built with Next.js 16, React 19, and TypeScript.

![Next.js](https://img.shields.io/badge/Next.js-16.3.0-black)
![React](https://img.shields.io/badge/React-19.2.3-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Features

### Match Management
- Create, edit, and delete badminton matches
- Track location, court number, date, time, and fees
- Automatic status updates (UPCOMING → COMPLETED) based on match end time
- Search and filter matches by title
- Sort by date or fee
- Pagination (6 matches per page) with navigation controls

### Player Management
- Add/remove players from matches
- Track player status (Active/Tentative)
- Payment status tracking (Belum Setor/Sudah Setor)
- Two-column layout separating confirmed and tentative players
- Suggest players from the latest completed match

### Statistics & Analytics
- Dashboard with key metrics (total, upcoming, completed matches)
- Hours played tracking
- Monthly statistics with interactive bar charts
- Multi-year support with dynamic year selection
- Real-time countdown to next match

### PDF Export
- Export match player lists to PDF
- Landscape orientation for better printing
- Standardized format with NO, NAME, and empty tracking columns
- Automatic filename generation based on match details

### Security
- Supabase JWT authentication on all API routes
- Input validation with schema-based validators
- Environment-based credential management
- No hardcoded secrets

### User Experience
- Dark theme across the app
- Fully responsive (desktop, tablet, mobile)
- Loading states and error handling
- Professional modal-based interactions

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16.3.0 (App Router) |
| UI Library | React 19.2.3 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL via Prisma |
| Auth | Supabase |
| Components | Hand-rolled UI primitives |
| Charts | Custom SVG |
| Icons | Tabler Icons |
| PDF Export | jsPDF & jspdf-autotable |
| Testing | Vitest |

---

## Architecture

### Design Principles

1. **Modular CSS**: Styles split into focused files (`base.css`, `login.css`) instead of one large file
2. **Custom Hooks**: Data fetching logic extracted into reusable hooks
3. **Centralized Utilities**: Shared validation, logging, and error handling
4. **Type Safety**: Shared TypeScript types across components

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                     Components                          │
│  (Dashboard, MatchDetailsModal, NewMatchModal, etc.)    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Custom Hooks                          │
│        (useStats, useMatches, useCountdown)             │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    authFetch                            │
│        (Adds Bearer token to all requests)              │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   API Routes                            │
│          (/api/matches, /api/players, etc.)             │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                     Prisma                              │
│               (Database Operations)                     │
└─────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
1. An administrator creates the user in Supabase Authentication
2. The user signs in through the Supabase-backed login page
3. Supabase returns a JWT token
4. The token is stored in localStorage
5. authFetch adds "Authorization: Bearer <token>" to requests
6. API routes validate the session and require app_metadata.role = "admin" for admin access
```

---

## Project Structure

```
frontend/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── api/                    # API route handlers (auth, matches, players, stats)
│   │   ├── dashboard/              # Dashboard pages
│   │   ├── login/                  # Auth pages
│   │   ├── matches/                # Match list + detail pages
│   │   ├── players/                # Player management page
│   │   ├── globals.css             # CSS imports
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Main page
│   │   └── Dashboard.tsx           # Dashboard component
│   │
│   ├── components/                 # React components
│   │   ├── ui/                     # Hand-rolled primitives (Button, Modal, CustomDropdown)
│   │   ├── dashboard/              # Dashboard cards + charts
│   │   ├── layout/                 # App shell, navigation
│   │   ├── match/                  # Match cards, court management
│   │   ├── players/                # Player table, modals
│   │   ├── MatchDetailsModal.tsx
│   │   ├── NewMatchModal.tsx
│   │   ├── SelectPlayersModal.tsx
│   │   └── ...                     # Confirm/Status/Success/Error modals
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── use-matches.ts          # Match data fetching
│   │   ├── use-players.ts          # Player data fetching
│   │   ├── use-stats.ts            # Stats data fetching
│   │   ├── use-countdown.ts        # Match countdown timer
│   │   ├── use-court-manager.ts    # Court assignment logic
│   │   └── ...                     # Pagination, insights, realtime refresh
│   │
│   ├── lib/                        # Core utilities
│   │   ├── auth-fetch.ts           # Authenticated fetch
│   │   ├── supabase-client.ts      # Supabase browser client
│   │   ├── supabase-server.ts      # Supabase server client
│   │   ├── database.ts             # Prisma client
│   │   ├── validation.ts           # Input validation
│   │   └── ...                     # Logging, error handling, rate limiting
│   │
│   ├── styles/                     # Modular CSS
│   │   ├── base.css                # Variables, reset
│   │   └── (login.css lives next to the login page)
│   │
│   ├── types/                      # TypeScript types
│   │   └── types.ts, match-types.ts
│   │
│   └── utils/                      # Utility functions
│       ├── formatters.ts           # Date, time formatting
│       ├── match-utils.ts          # Countdown, filtering
│       ├── match-status-utils.ts   # Status logic
│       └── player-export.ts        # PDF generation logic
│
├── prisma/                         # Database schema
├── vitest.config.ts                # Test config
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Supabase project (for auth)

### Installation

```bash
# Clone the repository
git clone https://github.com/fernandwill/capyhub.git

# Navigate to frontend
cd capyhub/frontend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Create a single `.env.local` at the **repo root**:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Database (Required)
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Vercel Cron (Required for automatic status updates in production)
CRON_SECRET="use-a-random-16-plus-character-string"
```

The frontend loads it automatically via `next.config.ts`.

---

## API Reference

### Authentication

| Mechanism | Description |
|----------|-------------|
| Supabase JWT | Browser auth is handled by Supabase; admin access requires `app_metadata.role = "admin"` |

### Matches

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/matches` | GET | List all matches |
| `/api/matches` | POST | Create match |
| `/api/matches/[id]` | GET | Get match by ID |
| `/api/matches/[id]` | PUT | Update match |
| `/api/matches/[id]` | DELETE | Delete match |
| `/api/matches/[id]/players` | GET | List match players |
| `/api/matches/[id]/players` | POST | Add player to match |
| `/api/matches/[id]/players/[playerId]` | PUT | Update player status |
| `/api/matches/[id]/players/[playerId]` | DELETE | Remove player |
| `/api/matches/auto-update` | GET | Vercel Cron route that batch-updates past matches |

### Players

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/players` | GET | List all players |
| `/api/players` | POST | Create player |
| `/api/players/[id]` | GET | Get player by ID |
| `/api/players/[id]` | PUT | Update player |
| `/api/players/[id]` | DELETE | Delete player |

### Statistics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stats` | GET | Dashboard stats |
| `/api/stats/monthly` | GET | Monthly chart data |

---

## Testing

### Run Tests

```bash
# Watch mode
npm run test

# Single run
npm run test:run
```

---

## Code Quality

### Utilities Overview

| Utility | Purpose |
|---------|---------|
| `logger.ts` | Dev-only logging; silent in production |
| `apiError.ts` | Consistent error responses |
| `validation.ts` | Schema-based input validation |

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import the frontend app in Vercel, or set the project Root Directory to `frontend`
3. Add environment variables in Vercel dashboard, including `CRON_SECRET`
4. Deploy
5. On Vercel Hobby, keep the cron schedule at `0 17 * * *` so `/api/matches/auto-update` runs once per day at 24:00 WIB

---

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint analysis |
| `npm run test` | Vitest watch mode |
| `npm run test:run` | Vitest single run |

---

## Contributing

1. Create a feature branch
2. Make changes following existing patterns
3. Add tests for new functionality
4. Run `npm run lint` and `npm run test:run`
5. Submit a pull request

---

## License

MIT
