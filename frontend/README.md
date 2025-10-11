# Flag Football Stats Tracker - Frontend

A modern Next.js frontend for the Flag Football Stats Tracker application.

## Features

- **Team Management**: Create, edit, and manage teams with win/loss records
- **Player Management**: Add players to teams with jersey numbers
- **Game Management**: Create and manage games with scores
- **Stat Entry**: Comprehensive stat tracking for QB, WR, RB, and Defense
- **Standings**: Real-time standings with win percentages
- **Season Management**: End seasons and copy teams to new seasons

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **TanStack Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Radix UI** - Accessible components
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js 18+ (recommended 20+)
- The Go backend running on `http://localhost:8080`

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**
   Create a `.env.local` file in the root directory:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080/api
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── team-management.tsx
│   ├── game-management.tsx
│   ├── stat-entry.tsx
│   ├── standings.tsx
│   └── season-management.tsx
├── lib/                   # Utilities and API
│   ├── api.ts            # API client
│   └── utils.ts          # Utility functions
└── providers/            # React context providers
    └── query-provider.tsx
```

## API Integration

The frontend connects to the Go backend API with the following endpoints:

- **Teams**: `/api/teams`
- **Players**: `/api/players`
- **Games**: `/api/games`
- **Stats**: `/api/stats`
- **Season Management**: `/api/teams/end-season`, `/api/teams/copy-to-season`

## Key Features

### Team Management

- Create teams with name, league, and initial record
- Edit team details and records
- View teams by season
- Delete teams (soft delete)

### Player Management

- Add players to teams with jersey numbers
- View players by team and season
- Edit player details
- Delete players (soft delete)

### Game Management

- Create games between teams
- Automatic winner determination based on scores
- Edit game details and scores
- Delete games (soft delete)

### Stat Entry

- Separate forms for different positions:
  - **QB Stats**: Passing TDs, completions, attempts, interceptions
  - **Receiver Stats**: Receptions, targets, receiving TDs, drops, first downs
  - **Rushing Stats**: Attempts, rushing TDs, first downs
  - **Defense Stats**: Flag pulls, interceptions, pass breakups, defensive TDs
- Intuitive +/- buttons for quick stat entry
- Real-time validation

### Standings

- Real-time standings calculation
- Win percentage calculation
- Proper tie-breaking rules
- Visual indicators for top 3 teams
- Grouped by league and season

### Season Management

- End current seasons (mark teams as inactive)
- Copy teams to new seasons with reset records
- Season overview with team counts
- Warning dialogs for destructive actions

## Styling

The app uses Tailwind CSS with a custom design system:

- Consistent color palette
- Responsive design
- Accessible components
- Dark mode support (via CSS variables)

## Performance

- **React Query** for efficient data caching and synchronization
- **Optimistic updates** for better UX
- **Code splitting** with Next.js
- **Image optimization** built-in
- **TypeScript** for compile-time error checking

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables
4. Deploy automatically

### Other Platforms

1. Run `npm run build`
2. Deploy the `.next` folder
3. Set environment variables

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: `http://localhost:8080/api`)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

[Add your license information here]
