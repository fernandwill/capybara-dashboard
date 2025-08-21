# Capybara's Dashboard

A badminton match tracker and management system built with Next.js, Express.js, TypeScript, and PostgreSQL. This application provides a complete solution for organizing internal badminton matches, managing players, tracking payments, and analyzing match statistics.

## Features

### Match Management
- Create, edit, and delete badminton matches
- Track match details including location, court number, date, time, and fees
- Automatic match status updates (upcoming/completed based on date)
- Match search and filtering capabilities
- Detailed match view with player management

### Player Management
- Add players to matches with contact information
- Toggle player status between Active and Tentative
- Two-column layout separating confirmed and tentative players
- Payment status tracking (Belum Setor/Sudah Setor)
- Player removal from matches

### Statistics & Analytics
- Monthly statistics dashboard with interactive charts
- Total matches, upcoming matches, and completed matches counters
- Hours played tracking and visualization
- Responsive chart display showing match count and hours by month

### User Interface
- Dark/Light theme toggle with system preference detection
- Fully responsive design for desktop, tablet, and mobile
- Modern modal-based interactions
- Professional error and success notifications
- Intuitive navigation and user experience

## Recent Improvements

### Data Fetching Optimization
- Implemented fresh data fetching every time the match details modal is opened
- Added proper data cleanup when the modal is closed to prevent cached data issues
- Added loading states for better user experience during data fetching
- Improved player data refresh after all player operations (add, remove, status updates)

### Mobile Responsiveness
- Enhanced mobile layout for the "Add Player" section
- Improved form styling for better touch interaction on mobile devices
- Adjusted responsive breakpoints for various screen sizes

## Technology Stack

### Frontend
- **Next.js 15.4.6** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5** - Type safety and developer experience
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Recharts 3.1.2** - Data visualization library
- **Lucide React** - Icon library

### Backend
- **Express.js** - REST API server
- **Prisma 6.14.0** - Database ORM and migration tool
- **PostgreSQL** - Primary database (Supabase compatible)
- **Socket.IO** - Real-time communication

### Development Tools
- **ESLint** - Code linting and formatting
- **PostCSS** - CSS processing
- **Concurrently** - Run multiple commands simultaneously

## Project Structure

```
capybara-dashboard/
├── backend/                       # Backend API server
│   ├── src/
│   │   ├── server.ts             # Express server entry point
│   │   ├── routes/               # API route definitions
│   │   ├── controllers/          # Request handlers
│   │   ├── middleware/           # Custom middleware
│   │   └── utils/                # Utility functions
│   ├── prisma/                   # Prisma schema and migrations
│   └── package.json              # Backend dependencies
├── frontend/                      # Next.js frontend application
│   ├── src/
│   │   ├── app/                  # App router pages and API routes
│   │   │   ├── api/              # Frontend API routes
│   │   │   │   ├── matches/      # Match CRUD operations
│   │   │   │   ├── players/      # Player management
│   │   │   │   └── stats/        # Statistics endpoints
│   │   │   ├── globals.css       # Global styles and theme variables
│   │   │   ├── layout.tsx        # Root layout with metadata
│   │   │   └── page.tsx          # Main dashboard page
│   │   ├── components/           # React components
│   │   │   ├── ui/               # Reusable UI components
│   │   │   ├── ErrorModal.tsx    # Error notification modal
│   │   │   ├── MatchDetailsModal.tsx  # Match details and player management
│   │   │   ├── NewMatchModal.tsx # Match creation/editing form
│   │   │   ├── StatsChart.tsx    # Monthly statistics chart
│   │   │   └── SuccessModal.tsx  # Success notification modal
│   │   └── lib/                  # Library functions
│   │       └── database.ts       # Database connection utilities
│   ├── prisma/                   # Prisma client generation
│   ├── public/                   # Static assets
│   │   └── icons/                # Application icons and favicon
│   ├── package.json              # Frontend dependencies
│   └── README.md                 # Frontend documentation
├── package.json                  # Root monorepo configuration
└── README.md                     # Project documentation
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

## Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (local or Supabase)
- npm or yarn package manager

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd capybara-dashboard
   ```

2. **Install dependencies for both frontend and backend**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the backend directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/badminton_db"
   PORT=3001
   JWT_SECRET="your-jwt-secret-key"
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run db:generate --workspace=backend
   
   # Push schema to database
   npm run db:push --workspace=backend
   
   # Optional: Open Prisma Studio
   npm run db:studio --workspace=backend
   ```

5. **Start Development Servers**
   ```bash
   # Start both frontend and backend servers simultaneously
   npm run dev
   ```

   The frontend application will be available at `http://localhost:3000`
   The backend API will be available at `http://localhost:3001`

## Available Scripts

### Monorepo Scripts (Root)
- **`npm run dev`** - Start both frontend and backend development servers
- **`npm run dev:frontend`** - Start frontend development server only
- **`npm run dev:backend`** - Start backend development server only
- **`npm run build`** - Build both frontend and backend applications
- **`npm run build:frontend`** - Build frontend application only
- **`npm run build:backend`** - Build backend application only
- **`npm run start`** - Start both frontend and backend production servers
- **`npm run start:frontend`** - Start frontend production server only
- **`npm run start:backend`** - Start backend production server only

### Frontend Scripts
- **`npm run dev --workspace=frontend`** - Start frontend development server
- **`npm run build --workspace=frontend`** - Build production frontend application
- **`npm run start --workspace=frontend`** - Start production frontend server
- **`npm run lint --workspace=frontend`** - Run ESLint code analysis

### Backend Scripts
- **`npm run dev --workspace=backend`** - Start backend development server with nodemon
- **`npm run build --workspace=backend`** - Compile TypeScript to JavaScript
- **`npm run start --workspace=backend`** - Start production backend server
- **`npm run db:studio --workspace=backend`** - Open database management interface
- **`npm run db:push --workspace=backend`** - Push schema changes to database
- **`npm run db:migrate --workspace=backend`** - Create and apply migrations

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

## Deployment

### Vercel Deployment (Frontend)
1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on git push

### Manual Deployment
1. Build both frontend and backend applications
2. Start both servers in production mode
3. Configure reverse proxy (nginx/Apache) if needed

## Configuration

### Theme System
The application supports automatic dark/light theme switching based on system preferences. Theme variables are defined in `globals.css` and can be customized.

### Database Configuration
- Supports PostgreSQL databases
- Compatible with Supabase for cloud deployment
- Uses Prisma for type-safe database operations

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for authentication (future use)
- `PORT`: Backend server port (default: 3001)

## License

This project is private and proprietary. All rights reserved.
