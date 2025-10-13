# Changelog

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
