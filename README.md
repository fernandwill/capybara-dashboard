# Capybara's Dashboard

A badminton match tracker and management system built with Next.js, TypeScript, and PostgreSQL. This application provides a complete solution for organizing internal badminton matches, managing players, tracking payments, and analyzing match statistics.

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

## Technology Stack

### Frontend
- **Next.js 15.4.6** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5** - Type safety and developer experience
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Recharts 3.1.2** - Data visualization library
- **Lucide React** - Icon library

### Backend & Database
- **Next.js API Routes** - Serverless API endpoints
- **Prisma 6.14.0** - Database ORM and migration tool
- **PostgreSQL** - Primary database (Supabase compatible)

### Development Tools
- **ESLint** - Code linting and formatting
- **PostCSS** - CSS processing
- **Sharp** - Image optimization

## Project Structure

```
capybara-dashboard/frontend/
├── src/
│   ├── app/
│   │   ├── api/                    # API routes
│   │   │   ├── matches/           # Match CRUD operations
│   │   │   ├── players/           # Player management
│   │   │   └── stats/             # Statistics endpoints
│   │   ├── globals.css            # Global styles and theme variables
│   │   ├── layout.tsx             # Root layout with metadata
│   │   └── page.tsx               # Main dashboard page
│   ├── components/
│   │   ├── ui/                    # Reusable UI components
│   │   ├── ErrorModal.tsx         # Error notification modal
│   │   ├── MatchDetailsModal.tsx  # Match details and player management
│   │   ├── NewMatchModal.tsx      # Match creation/editing form
│   │   ├── StatsChart.tsx         # Monthly statistics chart
│   │   └── SuccessModal.tsx       # Success notification modal
│   └── lib/
│       └── database.ts            # Database connection utilities
├── prisma/
│   └── schema.prisma              # Database schema definition
├── public/
│   └── icons/                     # Application icons and favicon
├── package.json                   # Dependencies and scripts
└── README.md                      # Project documentation
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

### Payments Table
- **id**: Unique identifier (CUID)
- **playerId**: Reference to player
- **matchId**: Reference to match (optional)
- **amount**: Payment amount
- **status**: Payment status (PENDING/COMPLETED)
- **method**: Payment method (optional)
- **notes**: Payment notes (optional)
- **paidAt**: Payment timestamp (optional)
- **createdAt/updatedAt**: Timestamps

## Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (local or Supabase)
- npm or yarn package manager

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd capybara-dashboard/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the frontend directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/badminton_db"
   JWT_SECRET="your-jwt-secret-key"
   PORT=3000
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push schema to database
   npx prisma db push
   
   # Optional: Open Prisma Studio
   npx prisma studio
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## Available Scripts

- **`npm run dev`** - Start development server
- **`npm run build`** - Build production application
- **`npm run start`** - Start production server
- **`npm run lint`** - Run ESLint code analysis
- **`npx prisma studio`** - Open database management interface
- **`npx prisma db push`** - Push schema changes to database

## API Endpoints

### Matches
- `GET /api/matches` - Retrieve all matches
- `POST /api/matches` - Create new match
- `GET /api/matches/[id]` - Get specific match
- `PUT /api/matches/[id]` - Update match
- `DELETE /api/matches/[id]` - Delete match
- `POST /api/matches/[id]/players` - Add player to match
- `DELETE /api/matches/[id]/players/[playerId]` - Remove player from match

### Players
- `GET /api/players` - Retrieve all players
- `POST /api/players` - Create new player
- `GET /api/players/[id]` - Get specific player
- `PUT /api/players/[id]` - Update player
- `DELETE /api/players/[id]` - Delete player

### Statistics
- `GET /api/stats` - Get dashboard statistics
- `GET /api/stats/monthly` - Get monthly match statistics

## Deployment

### Vercel Deployment (Recommended)
1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on git push

### Manual Deployment
1. Build the application: `npm run build`
2. Start production server: `npm run start`
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
- `PORT`: Application port (default: 3000)

## License

This project is private and proprietary. All rights reserved.
