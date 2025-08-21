# Capybara Dashboard Frontend

This is the frontend application for the Capybara Dashboard, a badminton match tracker and management system built with Next.js, TypeScript, and Tailwind CSS.

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

- **Next.js 15.4.6** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5** - Type safety and developer experience
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Recharts 3.1.2** - Data visualization library
- **Lucide React** - Icon library

## Project Structure

```
frontend/
├── src/
│   ├── app/                  # App router pages and API routes
│   │   ├── api/              # Frontend API routes
│   │   │   ├── matches/      # Match CRUD operations
│   │   │   ├── players/      # Player management
│   │   │   └── stats/        # Statistics endpoints
│   │   ├── globals.css       # Global styles and theme variables
│   │   ├── layout.tsx        # Root layout with metadata
│   │   └── page.tsx          # Main dashboard page
│   ├── components/           # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── ErrorModal.tsx    # Error notification modal
│   │   ├── MatchDetailsModal.tsx  # Match details and player management
│   │   ├── NewMatchModal.tsx # Match creation/editing form
│   │   ├── StatsChart.tsx    # Monthly statistics chart
│   │   └── SuccessModal.tsx  # Success notification modal
│   └── lib/                  # Library functions
│       └── database.ts       # Database connection utilities
├── prisma/                   # Prisma client generation
├── public/                   # Static assets
│   └── icons/                # Application icons and favicon
└── package.json              # Dependencies and scripts
```

## Getting Started

First, make sure you're in the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Environment Configuration:
Create a `.env` file in the frontend directory:
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Available Scripts

- **`npm run dev`** - Start development server
- **`npm run build`** - Build production application
- **`npm run start`** - Start production server
- **`npm run lint`** - Run ESLint code analysis

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
