# Capybara Dashboard Frontend

<img width="1000" height="1000" alt="capybara-dashboard" src="https://github.com/user-attachments/assets/c5afadbd-b799-41c7-8461-1dc0a48322f6" />

A modern badminton match tracker and management system built with Next.js 16, React 19, and TypeScript.

![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)
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
- Dark/Light theme with system preference detection
- Fully responsive (desktop, tablet, mobile)
- Loading states and error handling
- Professional modal-based interactions

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16.1.1 (App Router) |
| UI Library | React 19.2.3 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL via Prisma |
| Auth | Supabase |
| Components | Radix UI |
| Charts | Recharts |
| Icons | Lucide React |
| PDF Export | jsPDF & jspdf-autotable |
| Testing | Vitest |

---

## Architecture

### Design Principles

1. **Modular CSS**: Styles split into 7 focused files instead of one large file
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
1. User logs in via /api/auth/login
2. Supabase returns JWT token
3. Token stored in localStorage
4. authFetch adds "Authorization: Bearer <token>" to requests
5. API routes validate token via getAuthenticatedUser()
6. Unauthorized requests return 401
```

---

## Project Structure

```
frontend/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── api/                    # API route handlers
│   │   │   ├── auth/               # Authentication
│   │   │   ├── matches/            # Match CRUD + players
│   │   │   ├── players/            # Player CRUD
│   │   │   └── stats/              # Statistics
│   │   ├── globals.css             # CSS imports
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Main page
│   │   └── Dashboard.tsx           # Dashboard component
│   │
│   ├── components/                 # React components
│   │   ├── ui/                     # Shadcn UI primitives
│   │   ├── ConfirmModal.tsx
│   │   ├── ErrorModal.tsx
│   │   ├── MatchDetailsModal.tsx
│   │   ├── NewMatchModal.tsx
│   │   ├── StatsChart.tsx
│   │   └── SuccessModal.tsx
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useCountdown.ts         # Match countdown timer
│   │   ├── useMatches.ts           # Match data fetching
│   │   └── useStats.ts             # Stats data fetching
│   │
│   ├── lib/                        # Core utilities
│   │   ├── apiAuth.ts              # Supabase auth helper
│   │   ├── apiError.ts             # Error handling
│   │   ├── auth.ts                 # Admin authentication
│   │   ├── authFetch.ts            # Authenticated fetch
│   │   ├── database.ts             # Prisma client
│   │   ├── logger.ts               # Logging utility
│   │   ├── supabaseClient.ts       # Supabase client
│   │   └── validation.ts           # Input validation
│   │
│   ├── styles/                     # Modular CSS
│   │   ├── base.css                # Variables, reset
│   │   ├── dashboard.css           # Layout, header
│   │   ├── matches.css             # Match cards
│   │   ├── modals.css              # All modals
│   │   ├── players.css             # Player cards
│   │   ├── charts.css              # Stats chart
│   │   └── responsive.css          # Media queries
│   │
│   ├── types/                      # TypeScript types
│   │   └── types.ts                # Shared interfaces
│   │
│   └── utils/                      # Utility functions
│       ├── formatters.ts           # Date, currency
│       ├── matchUtils.ts           # Sort, filter
│       ├── matchStatusUtils.ts     # Status logic
│       └── playerExport.ts         # PDF generation logic
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
git clone https://github.com/fernandwill/capybara-dashboard.git

# Navigate to frontend
cd capybara-dashboard/frontend

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

Create `.env.local` in the frontend directory:

```env
# Database (Required)
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Admin Credentials (Required)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD_HASH="$2a$12$..."  # bcrypt hash

# Optional
NODE_ENV="development"
```

---

## API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Admin login, returns JWT |

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
| `/api/matches/auto-update` | POST | Auto-complete past matches |

### Players

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/players` | GET | List all players (supports `?latest=true`) |
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
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

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
