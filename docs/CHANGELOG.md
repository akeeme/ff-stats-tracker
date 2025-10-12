# Changelog

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
