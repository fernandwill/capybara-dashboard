# Capybara Dashboard Backend

This is the backend API server for the Capybara Dashboard, a badminton match tracker and management system built with Express.js, Prisma, and PostgreSQL.

## Features

### RESTful API
- Complete CRUD operations for matches and players
- Match-player relationship management
- Statistics endpoints for dashboard analytics
- Proper error handling and validation

### Database Management
- PostgreSQL database with Prisma ORM
- Automatic migrations and schema management
- Type-safe database operations
- Data validation and constraints

### Security & Performance
- CORS configuration for frontend communication
- Request logging with Morgan
- Security headers with Helmet
- Environment-based configuration

## Technology Stack

- **Express.js** - Web application framework
- **Prisma 6.11.1** - Database ORM and migration tool
- **PostgreSQL** - Primary database
- **TypeScript 5** - Type safety and developer experience
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security headers
- **Morgan** - HTTP request logging

## Project Structure

```
backend/
├── src/
│   ├── server.ts             # Express server entry point
│   ├── routes/               # API route definitions
│   │   ├── matches.ts        # Match-related endpoints
│   │   ├── players.ts        # Player-related endpoints
│   │   └── stats.ts          # Statistics endpoints
│   ├── controllers/          # Request handlers
│   │   ├── matches.ts        # Match business logic
│   │   ├── players.ts        # Player business logic
│   │   └── stats.ts          # Statistics business logic
│   ├── middleware/           # Custom middleware
│   │   └── validation.ts     # Request validation
│   └── utils/                # Utility functions
│       └── database.ts       # Database connection
├── prisma/                   # Prisma schema and migrations
│   ├── schema.prisma         # Database schema definition
│   └── migrations/           # Database migrations
├── dist/                     # Compiled JavaScript files
├── package.json              # Dependencies and scripts
└── README.md                 # Backend documentation
```

## Database Schema

### Players Table
- **id**: Unique identifier (CUID)
- **name**: Player name (required)
- **email**: Email address (optional, unique)
- **phone**: Phone number (optional)
- **status**: ACTIVE or TENTATIVE (default: ACTIVE)
- **paymentStatus**: BELUM_SETOR or SUDAH_SETOR (default: BELUM_SETOR)
- **createdAt/updatedAt**: Timestamps

### Matches Table
- **id**: Unique identifier (CUID)
- **title**: Match title (required)
- **location**: Venue location (required)
- **courtNumber**: Court identifier (optional)
- **date**: Match date (required)
- **time**: Match time (required)
- **fee**: Match fee amount (required)
- **status**: Match status (UPCOMING/COMPLETED)
- **description**: Additional notes (optional)
- **createdAt/updatedAt**: Timestamps

### MatchPlayer Table (Junction)
- **id**: Unique identifier (CUID)
- **matchId**: Reference to match
- **playerId**: Reference to player
- **joinedAt**: When player joined the match

## Getting Started

First, make sure you're in the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Environment Configuration:
Create a `.env` file in the backend directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/badminton_db"
PORT=3001
JWT_SECRET="your-jwt-secret-key"
```

Generate Prisma client:

```bash
npx prisma generate
```

Push schema to database:

```bash
npx prisma db push
```

Start the development server:

```bash
npm run dev
```

The API server will be available at `http://localhost:3001`

## Available Scripts

- **`npm run dev`** - Start development server with nodemon
- **`npm run build`** - Compile TypeScript to JavaScript
- **`npm run start`** - Start production server
- **`npx prisma studio`** - Open database management interface
- **`npx prisma db push`** - Push schema changes to database
- **`npx prisma migrate dev`** - Create and apply migrations

## API Endpoints

### Matches
- `GET /api/matches` - Retrieve all matches
- `POST /api/matches` - Create new match
- `GET /api/matches/:id` - Get specific match
- `PUT /api/matches/:id` - Update match
- `DELETE /api/matches/:id` - Delete match
- `POST /api/matches/:id/players` - Add player to match
- `DELETE /api/matches/:id/players/:playerId` - Remove player from match

### Players
- `GET /api/players` - Retrieve all players
- `POST /api/players` - Create new player
- `GET /api/players/:id` - Get specific player
- `PUT /api/players/:id` - Update player
- `DELETE /api/players/:id` - Delete player

### Statistics
- `GET /api/stats` - Get dashboard statistics
- `GET /api/stats/monthly` - Get monthly match statistics

## Prisma Studio

To explore and manage your database visually:

```bash
npx prisma studio
```

This will open Prisma Studio at `http://localhost:5555`

## Deployment

### Manual Deployment
1. Build the application: `npm run build`
2. Start production server: `npm run start`
3. Configure reverse proxy (nginx/Apache) if needed

## Configuration

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port (default: 3001)
- `JWT_SECRET`: Secret key for authentication (future use)

### Database Configuration
- Supports PostgreSQL databases
- Compatible with Supabase for cloud deployment
- Uses Prisma for type-safe database operations