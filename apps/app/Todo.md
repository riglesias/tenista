# Tenista App - TODO List

## Summary
**Total Tasks: 4**
- 🔄 In Progress: 1
- 📋 Pending: 2
- ✅ Completed: 1

## Task Overview

### 1. 🔄 Alert to Toast Migration (Priority: MEDIUM)
Replace all Alert/window.alert/window.confirm calls with toast notifications
- **Status**: In Progress
- **Instances**: 89 total (73 Alert.alert, 15 window.alert, 1 window.confirm)
- **Effort**: Large

### 2. ✅ Apple Sign-In Name Loading UX (Priority: HIGH)
Add loading state to prevent glitchy name field behavior during Apple Sign-In
- **Status**: Completed
- **Location**: `app/onboarding/profile.tsx`
- **Effort**: Small
- **Completed**: 2025-08-07

### 3. 📋 Range Selector Performance (Priority: HIGH)
Optimize NTRP rating range slider for better performance on physical devices
- **Status**: Pending  
- **Location**: `components/community/RangeSlider.tsx`
- **Effort**: Medium

### 4. 📋 League List View Enhancement (Priority: MEDIUM)
Design new UI to browse all leagues even after joining one
- **Status**: Pending (Needs Design)
- **Effort**: Large

---

## Detailed Task Breakdowns

### 1. Alert to Toast Migration

**Overview**: Replace all `Alert.alert()`, `window.alert()`, and `window.confirm()` calls throughout the codebase with appropriate toast notifications to provide a better, non-intrusive user experience.

**Total Instances Found: 89**
- Alert.alert(): 73 instances
- window.alert(): 15 instances  
- window.confirm(): 1 instance

## Implementation Strategy

### Phase 1: Error Messages → Error Toasts ❌
Replace error alerts with error toasts (red/destructive styling)

### Phase 2: Success Messages → Success Toasts ✅
Replace success alerts with success toasts (green styling)

### Phase 3: Confirmation Dialogs → Custom Confirmation Component ❓
For confirmation dialogs (like logout, leave league), create a custom confirmation modal that matches the app's design system

### Phase 4: Validation Messages → Inline Validation + Toasts ⚠️
For form validation, consider showing inline validation errors where appropriate, with toast backup for general errors

---

## 1. Authentication Screens (20 alerts) - Priority: LOW

### app/(auth)/sign-up.tsx (6 alerts)
- [ ] Line 61: Validation error alert
- [ ] Line 87: Sign-up error alert  
- [ ] Line 96: Success message alert
- [ ] Line 109: General error alert
- [ ] Line 59: window.alert for validation (web)
- [ ] Line 85: window.alert for error (web)
- [ ] Line 93: window.alert for success (web)
- [ ] Line 107: window.alert for error (web)

### app/(auth)/email-sign-in.tsx (6 alerts)
- [ ] Line 56: Validation error alert
- [ ] Line 87: Sign-in error alert
- [ ] Line 98: General error alert
- [ ] Line 54: window.alert for validation (web)
- [ ] Line 85: window.alert for error (web)
- [ ] Line 96: window.alert for error (web)

### app/(auth)/forgot-password.tsx (8 alerts)
- [ ] Line 47: Validation error alert
- [ ] Line 76: Reset error alert
- [ ] Line 86: Success message alert
- [ ] Line 100: General error alert
- [ ] Line 45: window.alert for validation (web)
- [ ] Line 74: window.alert for error (web)
- [ ] Line 83: window.alert for success (web)
- [ ] Line 98: window.alert for error (web)

---

## 2. Onboarding Screens (15 alerts) - Priority: LOW

### app/onboarding/profile.tsx (5 alerts)
- [ ] Line 66: Required fields alert
- [ ] Line 80: Save error alert
- [ ] Line 86: General error alert
- [ ] Line 99: Logout error alert
- [ ] Line 214: Gender information modal (keep as modal?)

### app/onboarding/location.tsx (3 alerts)
- [ ] Line 174: Selection required alert
- [ ] Line 190: Save error alert
- [ ] Line 196: General error alert

### app/onboarding/rating-selection.tsx (2 alerts)
- [ ] Line 66: Save error alert
- [ ] Line 72: General error alert

### app/onboarding/availability.tsx (2 alerts)
- [ ] Line 81: Save error alert
- [ ] Line 94: General error alert

### app/onboarding/contact.tsx (3 alerts)
- [ ] Line 87: Required field alert
- [ ] Line 99: Save error alert
- [ ] Line 105: General error alert

### app/onboarding/flag-selection.tsx (3 alerts)
- [ ] Line 151: Required field alert
- [ ] Line 163: Save error alert
- [ ] Line 169: General error alert

---

## 3. Edit Profile Screens (19 alerts) - Priority: HIGH

### app/edit-profile.tsx (5 alerts)
- [ ] Line 48: Load error alert
- [ ] Line 62: Required fields alert
- [ ] Line 76: Save error alert
- [ ] Line 79: Success message alert
- [ ] Line 84: General error alert
- [ ] Line 213: Gender information modal (keep as modal?)

### app/edit-location.tsx (6 alerts)
- [ ] Line 127: Load error alert
- [ ] Line 163: Required fields alert
- [ ] Line 175: Invalid selection alert
- [ ] Line 190: Save error alert
- [ ] Line 198: General error alert

### app/edit-flag.tsx (5 alerts)
- [ ] Line 307: Load error alert
- [ ] Line 321: Required field alert
- [ ] Line 332: Save error alert
- [ ] Line 335: Success message alert
- [ ] Line 340: General error alert

### app/edit-rating.tsx (8 alerts)
- [ ] Line 55: Load error alert
- [ ] Line 78: Validation error alert
- [ ] Line 94: Save error alert
- [ ] Line 108: Success message alert (multi-line)
- [ ] Line 114: Success message alert (multi-line)
- [ ] Line 121: General error alert

### app/edit-availability.tsx (3 alerts)
- [ ] Line 53: Load error alert
- [ ] Line 95: Save error alert
- [ ] Line 98: Success message alert
- [ ] Line 103: General error alert

---

## 4. Main App Screens (15 alerts) - Priority: HIGH

### app/(tabs)/community.tsx (3 alerts)
- [ ] Line 117: Load error alert
- [ ] Line 156: Update error alert
- [ ] Line 172: General error alert

### app/(tabs)/results.tsx (4 alerts)
- [ ] Line 96: Edit match placeholder alert
- [ ] Line 109: Delete success alert
- [ ] Line 114: Delete error alert
- [ ] Line 118: Delete error alert

### app/(tabs)/settings.tsx (6 alerts)
- [ ] Line 100: Update error alert
- [ ] Line 108: General error alert
- [ ] Line 124: Logout error alert (mobile)
- [ ] Line 135: Logout error alert (mobile)
- [ ] Line 147: Logout confirmation alert
- [ ] Line 122: window.alert for logout error (web)
- [ ] Line 133: window.alert for logout error (web)
- [ ] Line 142: window.confirm for logout confirmation (web)

### app/submit-result.tsx (8 alerts)
- [ ] Line 95: No opponent error alert
- [ ] Line 104: Load opponent error alert
- [ ] Line 121: Load data error alert
- [ ] Line 210: Invalid score alert
- [ ] Line 230: Submit error alert
- [ ] Line 239: Success message alert
- [ ] Line 246: Submit error alert

---

## 5. Other Screens (6 alerts) - Priority: MEDIUM

### app/player-profile.tsx (3 alerts)
- [ ] Line 132: Challenge confirmation alert
- [ ] Line 154: SMS not supported alert
- [ ] Line 158: SMS error alert

### hooks/useMatchData.ts (2 alerts)
- [ ] Line 39: No opponent selected alert
- [ ] Line 72: General error alert

### lib/utils/onboarding-helpers.ts (2 alerts)
- [ ] Line 9: Generic error alert function
- [ ] Line 30: Generic error alert function

---

## 6. UI Components (14 alerts) - Priority: MEDIUM

### components/league/LeagueMenu.tsx (3 alerts)
- [ ] Line 37: Leave league confirmation alert
- [ ] Line 48: Leave league error alert
- [ ] Line 50: Leave league success alert

### components/league/LeagueSelection.tsx (3 alerts)
- [ ] Line 167: Join league confirmation alert
- [ ] Line 174: Join league error alert
- [ ] Line 179: Join league success alert

### components/ui/GoogleSignInButton.tsx (2 alerts)
- [ ] Line 54: Sign-in error alert
- [ ] Line 52: window.alert for sign-in error (web)

### components/ui/GoogleSignInButtonNative.tsx (2 alerts)
- [ ] Line 40: Sign-in error alert
- [ ] Line 38: window.alert for sign-in error (web)

### components/ui/AvatarPicker.tsx (6 alerts)
- [ ] Line 77: Image picker not available alert
- [ ] Line 85: Permission required alert
- [ ] Line 112: Invalid image alert
- [ ] Line 121: Upload error alert
- [ ] Line 126: No URL returned alert
- [ ] Line 135: General error alert

### components/ui/MatchCard.tsx (1 alert)
- [ ] Line 80: Action confirmation alert

---

## Technical Considerations

### Already Available
- ✅ Custom toast system implemented in `components/ui/Toast.tsx`
- ✅ `useAppToast` hook available for import

### Need to Implement
- [ ] Custom confirmation modal component for user confirmations
- [ ] Platform-specific handling for web alerts
- [ ] Preserve callback functions from existing alerts
- [ ] Consider inline validation for form errors

### Import Pattern
Add to affected files:
```typescript
import { useAppToast } from '@/components/ui/Toast';

// In component:
const { showToast } = useAppToast();

// Replace Alert.alert with:
showToast('Message here', { type: 'success' | 'error' | 'info' });
```

---

## Priority Order
1. ✅ **Edit screens** (most user-facing) - 19 alerts
2. ✅ **Main app screens** - 15 alerts  
3. 🔄 **UI components** - 14 alerts
4. 🔄 **Other screens** - 6 alerts
5. 🔄 **Onboarding flow** - 15 alerts
6. 🔄 **Authentication screens** - 20 alerts

---

## Progress Tracking
- [ ] Phase 1: Error Messages → Error Toasts
- [ ] Phase 2: Success Messages → Success Toasts
- [ ] Phase 3: Confirmation Dialogs → Custom Component
- [ ] Phase 4: Validation Messages → Enhanced UX

**Current Status**: Documentation complete, ready to begin implementation

---

### 2. Apple Sign-In Name Loading UX

**Problem**: When users sign in with Apple, there's a glitchy experience where:
- The name fields initially show as empty input fields
- Then the Apple-provided name suddenly appears in a single field
- This creates a jarring user experience

**Solution Requirements**:
1. Add a loading state while fetching Apple Sign-In data
2. Maintain separate first name and last name fields
3. Show the Apple-provided name properly split between fields
4. Prevent the UI from showing empty fields that suddenly populate

**Implementation Details**:
- **File**: `app/onboarding/profile.tsx` (lines 174-231)
- **Current Behavior**: 
  - Checks if user has Apple Sign-In with `hasAppleSignIn()`
  - Shows single read-only field when Apple name exists
  - Shows editable fields when no Apple name
- **Proposed Changes**:
  - Add loading state while checking for Apple user data
  - Parse Apple full name into first/last name components
  - Show loading skeleton while data is being fetched
  - Smooth transition when name data arrives

**Technical Considerations**:
- Need to handle cases where Apple only provides partial name data
- Consider using a name parsing utility to split full names correctly
- Ensure loading state doesn't block other parts of onboarding

---

### 3. Range Selector Performance Optimization

**Problem**: The NTRP rating range slider in the Filter bottom sheet is:
- Slow and unresponsive on physical devices
- Difficult to use with touch interactions
- May have performance issues with touch event handling

**Current Implementation**:
- **File**: `components/community/RangeSlider.tsx`
- Uses custom touch handling with `TouchableOpacity`
- Calculates thumb positions based on touch events
- No gesture handling library used

**Potential Solutions**:
1. **Optimize Current Implementation**:
   - Add gesture responder system for smoother dragging
   - Implement pan gestures instead of tap-to-position
   - Add haptic feedback for better user experience
   - Optimize re-renders with React.memo and useCallback

2. **Replace with Third-Party Library**:
   - Consider `react-native-slider` or `@react-native-community/slider`
   - Look into `react-native-range-slider` for dual-thumb support
   - Evaluate `react-native-multi-slider` as an option

**Performance Metrics to Test**:
- Touch response time
- Smoothness of thumb movement
- CPU usage during interaction
- Re-render frequency

---

### 4. League List View Enhancement

**Problem**: Once users join a league, they can no longer browse other available leagues. This limits:
- Discovery of other leagues
- Planning for future league participation
- Understanding the full league ecosystem

**Current UX Flow**:
1. User sees `LeagueSelection` component when not in any league
2. After joining, only sees `CurrentLeague` component
3. No way to view other leagues without leaving current league

**Design Requirements**:
1. **Navigation Options**:
   - Add "Browse All Leagues" button/link in league screen
   - Consider adding a tab system: "My League" | "All Leagues"
   - Or dropdown menu option: "View Other Leagues"

2. **League List Features**:
   - Show all leagues with clear "Joined" badges
   - Display eligibility status for each league
   - Allow viewing league details without join action
   - Show league statistics and player counts

3. **User Stories**:
   - As a user in a league, I want to see what other leagues exist
   - As a user, I want to plan which league to join next season
   - As a user, I want to compare different leagues

**Implementation Approach**:
1. Create new component: `LeagueBrowser` or `AllLeaguesView`
2. Modify `app/(tabs)/league.tsx` to add navigation option
3. Reuse `LeagueSelection` component with modifications:
   - Add "view-only" mode for joined leagues
   - Show different CTAs based on membership status
4. Consider adding league comparison features

**Files to Modify**:
- `app/(tabs)/league.tsx` - Add navigation to browse view
- `components/league/LeagueSelection.tsx` - Enhance for browse mode
- Create new component for league browsing
- Update navigation flow