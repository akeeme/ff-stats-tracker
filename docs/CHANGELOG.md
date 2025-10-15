# Changelog

## 2025-10-14

### Performance Optimization, Bug Fixes & Game Type Feature

#### 🐛 Fixed
- **Stats Viewer Season Selection**: Fixed bug where clicking a different season wouldn't work after viewing a game
  - Issue occurred when navigating from Games page with gameId URL parameter
  - Season buttons now properly clear URL parameter and ignore auto-selection
  - Season switching now works with single click instead of requiring double-click
- **Stats Viewer Null Safety**: Fixed crash when viewing games with no stats entered yet
  - Added null checks for `allStats`, `seasonStats`, and `gameStats`
  - Empty games now show "No stats recorded" message instead of crashing
  - All filter operations now safely handle null/undefined data
- **Stats Display Issue**: Fixed missing player stats on Stats page caused by 100-record API limit
  - Some players weren't showing because their records exceeded the pagination limit
  - Stats are now properly filtered on the backend for better performance
- **Stats Filtering**: Updated all stat category filters to include all relevant stats
  - QB stats now include completions and INTs thrown (not just TDs/attempts)
  - Receiver stats now include receiving TDs and drops (not just receptions/targets)
  - Defense stats now include defensive TDs (not just flag pulls/INTs/PBUs/sacks)
- **Player Detail Modal**: Fixed "INTs" label ambiguity throughout all tabs
  - Passing interceptions now labeled "INTs Thrown"
  - Defensive interceptions now labeled "Def INTs"
  - Applied to Overview, Game Log, and Records tabs
- **Player Detail Modal**: Fixed missing stats for players with only targets (no receptions)
  - Modal now shows all receiving stats even if receptions are 0
- **Player Detail Modal Career Stats**: Fixed career totals to show all-time stats instead of only current season
  - Modal now fetches all stats independently to show full career data
  - Career stats properly aggregate across all seasons using canonical_player_id
- **Game Creation Season Bug**: Fixed games being created in wrong season when different season selected
- **Team Selection**: Prevented selecting same team for both Team 1 and Team 2 in game creation

#### ✨ Added
- **Game Type Feature**: Games can now be marked as regular season, playoff, or championship
  - Added `game_type` column to games table with check constraint
  - Backend accepts and returns game_type in all game endpoints
  - Frontend shows "Game Type" dropdown in create game form
  - Defaults to "Regular Season" if not specified
  - See `GAME_TYPE_MIGRATION.md` for migration instructions
- **Playoff/Championship Badges**: Visual indicators for playoff and championship games
  - Blue "Playoff" badge with trophy icon for playoff games
  - Gold "Championship" badge with crown icon for championship games
  - Badges appear on game cards in Stats Viewer
- **Game Type Filter**: Filter games by type in Stats Viewer
  - "All", "Regular", and "Playoffs" filter buttons
  - Quickly view only regular season or playoff games
- **Playoff Stats Tab**: New tab in Player Detail Modal showing playoff performance
  - Playoff career totals (games, passing, receiving, rushing, defense)
  - Playoff game log with special blue/indigo styling
  - Championship games highlighted with gold badge
  - Shows "No playoff games yet" message if player hasn't played in playoffs
- **Game Type Filter on Games Page**: Filter games by type on the Games management page
  - "All", "Regular", and "Playoffs" filter buttons
  - Quickly view only regular season or playoff games for selected season
- **Playoff/Championship Badges on Dashboard**: Recent games now show game type badges
  - Badges appear on the right side next to trophy icon (if Rhinos won)
  - Consistent badge styling across all pages

#### ⚡ Improved
- **API Performance**: Implemented backend filtering for player stats
  - Added `season` and `game_id` query parameters to `/api/stats` endpoint
  - Stats Viewer now fetches only stats for selected game/season
  - Dashboard fetches only current season stats (or all for "All Time" tab)
  - Players page no longer fetches stats (modal handles it independently)
  - Significantly reduced network traffic and improved page load times
- **Scalability**: Stats fetching now scales efficiently as data grows
  - No longer fetching all stats and filtering client-side
  - Backend handles filtering with optimized SQL queries
- **Player Detail Modal**: Game Log now sorted by most recent game first
  - Sorts by season descending, then week descending
  - Latest games always appear at the top
- **Player Detail Modal Recent Form**: Fixed to show actual most recent 3 games
  - Now properly sorts by season and week before taking last 3 games
  - Previously showed last 3 from unsorted array
- **Player Detail Modal Game Type Badges**: Playoff/championship badges now show in all tabs
  - Recent Form section shows badges next to season number
  - Game Log tab shows badges next to season number
  - Consistent badge placement across modal
- **Mobile Responsiveness**: Improved mobile layouts across the app
  - Games page: Better spacing, responsive headers, mobile-friendly filters
  - Game cards: Reduced padding on mobile, team names wrap properly
  - Player modal: Recent Form cards match Game Log style for consistency
  - Dashboard: Recent games layout optimized for small screens

#### 🔧 Technical
- Updated `GetPlayerStats` handler with dynamic WHERE clause building
- Added `strings` import for SQL condition joining
- Updated `api.getPlayerStats()` to accept optional `{ season, gameId }` parameters
- Updated `usePlayerStatsWithRealtime()` hook to support filtering parameters
- Modified Stats Viewer and Dashboard to use backend filtering
- Player Detail Modal now uses `useQuery` to fetch all stats independently
- Added `game_type` to Game model (backend) and Game interface (frontend)
- Updated CreateGame and UpdateGame handlers to support game_type
- Added `interceptions_thrown` to career highs calculation in Player Detail Modal
- Created `GameTypeBadge` component for consistent badge rendering
- Added `useRef` flag in Stats Viewer to prevent URL parameter auto-selection after manual interaction
- Implemented `router.replace()` to clear URL parameters when changing seasons
- Added null safety checks throughout stats-viewer.tsx and player-detail-modal.tsx
- Created `TESTING_CHECKLIST.md` for future development quality assurance

---

## 2025-10-13 (Part 2)

### Player Stats & Manual Entry Enhancements

#### ✨ Added
- **Manual Stat Entry**: Added "Manual" button to all position sections (QB, WR, RB, DEF) in Quick Stat Entry
  - Toggle button changes to "Close" with X icon when open
  - Number input fields for all relevant stats per position
  - Empty inputs show placeholder "0" instead of actual 0 for better UX
  - Manual changes are logged in game feed with format "Stat (Manual: old→new)"
- **Player Detail Modal**: Comprehensive player statistics view accessible by clicking any player card
  - **Overview Tab**: Career totals, per-game averages, catch/completion percentages, recent form (last 3 games)
  - **By Season Tab**: Season-by-season breakdown with games played and all stats
  - **Game Log Tab**: Complete game-by-game history with color-coded inline stats
  - **Records Tab**: Career highs (single-game bests) and milestone progress bars
- **Canonical Player ID System**: Players are now linked across seasons/teams
  - Same person tracked across multiple seasons with different team assignments
  - Player detail modal shows full career stats regardless of which season's record is clicked
  - Auto-links new players with existing players of the same name (case-insensitive)

#### 🎨 Improved
- **Game Log Display**: Stats now flow horizontally with proper wrapping and color coding
  - Green for TDs, Blue for completions, Purple for receptions, Red for drops/INTs
  - Compact inline format instead of rigid grid layout
- **Player Cards**: Now clickable to open detailed stats modal
  - Delete button prevents card click with event propagation stop

#### 🔧 Technical
- Added `canonical_player_id` column to players table with migration script
- Updated Player model in backend (Go) and frontend (TypeScript)
- CreatePlayer handler auto-assigns canonical_player_id based on name matching
- Player detail modal filters stats using canonical_player_id to aggregate career data
- Created comprehensive migration documentation in `CANONICAL_PLAYER_ID_MIGRATION.md`

---

## 2025-10-13 (Part 1)

### Quality of Life Improvements & Dashboard Redesign

#### ✨ Added
- **Toast Notifications**: Success/error messages for all create, update, and delete operations across Teams, Games, and Players
- **Delete Confirmation Dialogs**: "Are you sure?" modals before deleting any entity to prevent accidental deletions
- **Loading States**: Buttons show spinner animations and disable during operations for better feedback
- **Sort Options for Teams**: Dropdown to sort teams by Name, Wins, Losses, or Win Percentage
- **Auto-Select Latest Season**: All management pages now default to the most recent season instead of Season 1
- **Error Handling**: API errors are caught and displayed to users with helpful messages
- **Rhino Emoji Confetti**: Animated falling rhino emojis (🦏) when Rhinos win on dashboard
- **All-Time Leaders Tab**: New 4th tab showing career stat leaders across all seasons

#### 🎨 Improved
- **Dashboard Victory Celebration**: When Rhinos win, the game showcase displays:
  - Vibrant red-to-orange gradient background with glowing shadow
  - Animated "RHINOS VICTORY!" banner with bouncing trophy icons
  - Pulsing background circles for celebration effect
  - Glowing white text with radiant effects on winning score
  - Larger 6xl font size for scores
- **Dashboard Card Styling**: All cards updated with dark gradient backgrounds (gray-900 to gray-800) and consistent borders
- **Recent Games Enhancement**: 
  - Rhinos victories highlighted with red/orange gradient
  - Animated pulsing trophy icons for wins
  - Bold typography with better contrast
- **Top Teams Redesign**:
  - Now filters to current season only
  - Rhinos highlighted with red/orange gradient
  - Gold #1 badge for first place
  - Color-coded win percentages (red ≥50%, gray <50%)
- **Season Leaders Leaderboard**:
  - Dark gradient category cards with hover effects
  - Icon headers for each stat category
  - Special treatment for #1 place (gradient background, gold badge)
  - Silver badge for #2, bronze for #3
  - Larger stat numbers (2xl font)
  - Professional spacing and modern rounded corners
  - Now filters to current season only (previously showed all-time stats)
  - Improved title spacing with wider letter tracking

#### 🐛 Fixed
- Game updates now work correctly (fixed SQL query concatenation bug in backend)
- Team updates fixed (same SQL issue resolved)
- Leading zeros in number inputs resolved with auto-select on focus

#### 🔧 Technical
- Created reusable toast system with `@radix-ui/react-toast`
- Implemented alert dialog component for confirmations
- Added loading state props to all form and card components
- Enhanced mutation hooks with success/error callbacks
- Improved TypeScript types for loading states

---

## 2025-10-12

### Quick Stat Entry Mode - Major UI/UX Overhaul

#### ✨ Added
- **Medallion-Style Buttons**: Redesigned all action buttons with gradient backgrounds, rounded-full shape, and subtle shine effect for a modern, polished look
- **Inline Stat Display**: Stats now appear side-by-side with their labels (e.g., "45 TD") instead of stacked vertically
- **Add Player Functionality**: New "Add Player" button for each position section with searchable dropdown to dynamically assign players
- **Remove Player Button**: X button on each player card to remove them from the section
- **Empty State Messages**: Helpful prompts when no players are assigned to a section
- **Live Game Feed**: Real-time activity log showing all stat entries with timestamps, color coding, and click-to-undo
- **Auto-Save to LocalStorage**: Automatic saving of in-progress game stats to browser storage, preventing data loss on refresh or accidental close
- **Filter/Search in Feed**: Search bar to filter live feed entries by player name or action type
- **Bulk Undo**: Checkbox selection to undo multiple entries at once
- **Hot Streak Indicators**: Animated "ON FIRE" badges for players with 3+ actions in last 2 minutes
- **Undo All Confirmation**: Safety dialog when clearing all stats with entry count display
- **Mobile Optimizations**:
  - Larger touch targets (48px minimum) on mobile devices
  - Stacked layout (buttons above stats) on small screens
  - Sticky submit button at bottom of screen on mobile
  - Responsive button sizing

#### 🎨 Improved
- **Stat Card Layout**: Repositioned stats to align with buttons, creating a cleaner inline layout
- **Button Styling**: Enhanced with gradient backgrounds, custom colors per stat type (green for TDs, red for negative plays, etc.)
- **Gradient Text Effects**: Large gradient numbers for better visual hierarchy
- **Color Coding**: Consistent color themes across all position sections (Blue=QB, Purple=WR, Orange=RB, Red=DEF)
- **Lighting Effects**: Balanced white shine overlay (15% opacity) on buttons for subtle depth
- **Player Cards**: Enhanced with decorative gradient bubbles and improved spacing

#### 🐛 Fixed
- Defense dropdown now opens upward to prevent being cut off at bottom of page
- Missing stat displays added for first downs (WR/RB) and defensive TDs (DEF)
- Stats now properly display after clicking corresponding buttons

#### 🔧 Technical
- Added `useEffect` hooks for localStorage persistence
- Implemented hot streak detection algorithm (time-based action tracking)
- Added feed filtering logic with search functionality
- Created bulk selection state management
- Position-specific player assignment system
- Mobile-responsive utility classes throughout

---

## Previous Versions

_Version history will be added here as the project evolves._
