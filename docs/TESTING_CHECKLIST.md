# Testing Checklist

## Before Deploying Changes

### Critical User Flows
Always test these flows after making changes:

#### 1. **Dashboard/Landing Page**
- [ ] Page loads without errors
- [ ] Recent games display correctly
- [ ] Stats cards show data
- [ ] Navigation works

#### 2. **Games Page**
- [ ] Games list loads
- [ ] Can create new game (if admin)
- [ ] Can edit game (if admin)
- [ ] Can delete game (if admin)
- [ ] Game cards display correctly
- [ ] Season selector works
- [ ] Game type filter works

#### 3. **Stats Viewer**
- [ ] Can select a season
- [ ] Can select a game
- [ ] Stats display for games WITH stats
- [ ] **CRITICAL:** Games WITHOUT stats don't crash (show empty state)
- [ ] Season view works
- [ ] Game type filter works
- [ ] Leaderboards display

#### 4. **Players Page**
- [ ] Players list loads
- [ ] Can create new player (if admin)
- [ ] Can edit player (if admin)
- [ ] Can delete player (if admin)
- [ ] Season filter works
- [ ] Clicking player opens modal

#### 5. **Player Detail Modal**
- [ ] Modal opens without errors
- [ ] Career totals calculate correctly
- [ ] Recent Form shows latest 3 games
- [ ] Game Log displays all games
- [ ] By Season tab works
- [ ] Playoffs tab works (if player has playoff games)
- [ ] Records tab works

#### 6. **Teams Page**
- [ ] Teams list loads
- [ ] Can create new team (if admin)
- [ ] Can edit team (if admin)
- [ ] Can delete team (if admin)
- [ ] Season filter works

### Edge Cases to Test

#### Empty States
- [ ] Game with no stats entered yet
- [ ] Season with no games
- [ ] Player with no stats
- [ ] New season with no data

#### Null/Undefined Handling
- [ ] Missing optional fields (jersey_number, etc.)
- [ ] Null responses from API
- [ ] Empty arrays from queries

#### Data Integrity
- [ ] Stats aggregate correctly across seasons
- [ ] Playoff vs regular season separation works
- [ ] Game type badges show correctly everywhere
- [ ] Canonical player ID links work

### Browser Console
- [ ] No errors in console
- [ ] No warnings (or document known warnings)
- [ ] Network requests succeed

### Performance
- [ ] Pages load in reasonable time
- [ ] No infinite loops or excessive re-renders
- [ ] Realtime updates work without lag

## After Backend Changes

### API Endpoints
- [ ] Test all affected endpoints in Postman/browser
- [ ] Verify response structure matches frontend expectations
- [ ] Check error handling (404, 500, etc.)
- [ ] Verify authentication/authorization still works

### Database Migrations
- [ ] Run migration on test data first
- [ ] Verify existing data isn't corrupted
- [ ] Check indexes are created
- [ ] Test rollback if possible

## Quick Smoke Test (Minimum)

If short on time, at least test:
1. Dashboard loads
2. Can navigate to each main page
3. Can view a game's stats
4. Can open a player modal
5. Check browser console for errors

## Regression Testing

When making changes to:
- **Shared components** → Test all pages that use it
- **API hooks** → Test all components that use the hook
- **Database schema** → Test all features that touch that table
- **Filters/sorting** → Test with empty data, single item, many items

## Notes

- Always test with **both admin and non-admin** accounts
- Test on **mobile viewport** for responsive changes
- If you see an error, **fix it before moving on**
- Document any known issues in CHANGELOG.md
