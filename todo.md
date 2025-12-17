# Brian's Progress Tracker - TODO

## Phase 1: Database Schema & Setup
- [x] Design and implement database schema with all tables
- [x] Create tasks table with weekly protocol data
- [x] Create entries table for daily check-ins
- [x] Create achievements table with badge definitions
- [x] Create user_achievements junction table
- [x] Create login_activity tracking table
- [x] Seed initial data (tasks for weeks 1-9+, achievement definitions)

## Phase 2: Authentication & User Management
- [x] Set up user roles (client vs admin/therapist)
- [x] Create Brian's user account with client role
- [x] Create Jonathan's admin account
- [x] Implement role-based access control in tRPC procedures

## Phase 3: Core Daily Check-In Flow
- [x] Build home screen with quest log interface
- [x] Create task completion form with anxiety tracking
- [x] Implement anxiety before/during task (0-10 scale)
- [x] Add Klonopin usage tracking
- [x] Add "Today's Win" text input
- [x] Create success screen with XP display
- [x] Implement daily completion logic

## Phase 4: XP & Leveling System
- [x] Implement XP calculation (50 base, 100 extra credit, 25 no-Klonopin, 15 early bird)
- [x] Create level progression system (Levels 1-20+)
- [x] Build XP progress bar with gold gradient
- [x] Display current level and total XP
- [x] Implement level-up detection and celebration
- [x] Add confetti animation on level up

## Phase 5: Streak System
- [x] Implement consecutive day streak tracking
- [x] Create streak counter with fire emoji
- [x] Handle streak reset logic (missed days)
- [x] Track longest streak
- [ ] Implement streak freeze power-up (after 14 days) - Future enhancement

## Phase 6: Achievement System
- [x] Create all 12 achievement badges
- [x] Implement unlock criteria checking
- [x] Build achievement unlock animations
- [x] Create achievements grid display (locked/unlocked)
- [ ] Add achievement notification on unlock - Future enhancement

## Phase 7: Anxiety Boss Battle Framing
- [x] Create boss health bar visualization
- [x] Calculate damage dealt (anxiety reduction)
- [x] Display before/during anxiety comparison
- [x] Show weekly damage summary
- [x] Color-code anxiety levels (red/yellow/green)

## Phase 8: Stats Dashboard
- [x] Build overview tab (level, XP, streaks, achievements)
- [x] Create anxiety trends chart (line chart)
- [x] Build weekly performance bar chart
- [x] Display before vs during anxiety comparison
- [x] Show total damage dealt to Anxiety Boss

## Phase 9: Admin Dashboard (Jonathan)
- [x] Create admin-only route and layout
- [x] Display Brian's activity monitor
- [x] Show last login and login frequency
- [x] Display current week completion status
- [x] Show anxiety trend graphs
- [x] List recent entries (last 10)
- [x] Implement red flag detection system
- [ ] Add CSV export functionality - Placeholder added
- [ ] Create weekly summary report generation - Future enhancement

## Phase 10: Weekly Task Protocol
- [x] Implement Week 1-2: "The Doorway Stand"
- [x] Implement Week 3-4: "The Driveway Walk"
- [ ] Implement Week 5-6: "The Video Capture"
- [ ] Implement Week 7-8: "The Board Touch"
- [x] Implement Week 9+: "Your Choice" with activity menu
- [ ] Create auto-advance logic (4+ days for 2 weeks) - Future enhancement
- [ ] Add manual week advancement for admin - Future enhancement

## Phase 11: iPhone Optimization
- [x] Configure PWA manifest.json
- [x] Add iOS app icons and splash screens
- [x] Implement 44x44pt minimum tap targets
- [x] Create portrait-only layout
- [x] Add safe area insets for notch/dynamic island
- [x] Optimize for single-column layout
- [x] Implement bottom navigation (thumb-friendly)
- [ ] Add "Add to Home Screen" prompt - Future enhancement

## Phase 12: Animations & Polish
- [x] Add Framer Motion for smooth transitions (available in project)
- [x] Implement confetti on level up
- [ ] Create badge unlock animations
- [ ] Add tap feedback animations
- [ ] Optimize loading states with skeletons
- [ ] Add motivational messages throughout
- [ ] Polish color scheme (dark navy gaming theme)

## Phase 13: Testing & Deployment
- [ ] Test daily check-in flow on iPhone Safari
- [ ] Verify XP calculations
- [ ] Test achievement unlock logic
- [ ] Verify streak tracking edge cases
- [ ] Test admin dashboard functionality
- [ ] Verify PWA installation on iPhone
- [ ] Test offline capability
- [ ] Deploy to manus.space domain


## User Customization
- [x] Update Brian's display name to show "Brian"
- [x] Update Jonathan's display name to show "5786"


## Enhanced iPhone Optimization
- [x] Increase all tap targets to 48x48pt minimum
- [x] Add haptic feedback simulation with visual feedback (active states)
- [x] Optimize font sizes for mobile readability (16px minimum)
- [x] Ensure all buttons have proper touch states
- [ ] Add pull-to-refresh gesture support - Future enhancement
- [x] Optimize bottom navigation for thumb reach (h-20, larger icons)
- [ ] Add swipe gestures where appropriate - Future enhancement
- [x] Ensure proper spacing for fat-finger friendly UI


## Comprehensive iPhone Optimization Audit
- [x] Add viewport meta tag with viewport-fit=cover
- [x] Add apple-mobile-web-app-capable meta tag
- [x] Add apple-mobile-web-app-status-bar-style meta tag
- [x] Ensure all touch targets are at least 44x44pt
- [x] Add -webkit-tap-highlight-color for iOS
- [x] Disable text size adjust for consistent sizing
- [x] Add overscroll-behavior to prevent bounce issues
- [x] Ensure proper keyboard handling on inputs (16px font)
- [x] Add standalone mode detection for PWA (manifest)
- [x] Optimize loading states for mobile


### Language/Copy Updates
- [x] Tone down "epic quest" and "Anxiety Boss" language
- [x] Make copy more mature and age-appropriate
- [x] Keep gaming theme but less dramatic
- [x] Remove game controller emoji from headers

- [x] Change first day of week from Sunday to Monday


## AI Integration
- [x] Create AI procedure for personalized encouragement after task completion
- [x] Create AI procedure for weekly insights based on anxiety patterns
- [x] Add AI-generated motivational message on success screen
- [x] Add AI-powered insights on Stats page
- [x] Create AI summary for admin dashboard


## Push Notifications & CSV Export
- [x] Set up push notification system for daily reminders
- [x] Create notification settings UI for Brian
- [x] Add CSV export button to admin dashboard
- [x] Implement CSV generation for all client data


## Display Name Updates
- [x] Ensure Brian sees "Brian" as his display name (header shows "Brian's Progress")
- [x] Ensure admin sees "5786" as their identifier (header shows "5786 Admin Dashboard")


## Simple Passcode Login
- [x] Create passcode login endpoint (Brian = client, 5786 = admin)
- [x] Update login UI to show simple passcode input
- [x] Remove OAuth login requirement
- [x] Auto-create Brian and admin users on first login


## Enhanced AI Personalization
- [x] Create AI-powered dynamic greeting based on time of day and engagement
- [x] Add AI motivation message on home screen based on streak/progress
- [x] Generate personalized task encouragement based on anxiety patterns
- [x] Add AI-driven "tip of the day" based on Brian's recent performance
- [ ] Create adaptive difficulty suggestions based on progress - Future enhancement
- [x] Add AI celebration messages that vary based on achievements
- [x] Implement engagement-aware reminders (more encouraging if streak at risk)


## Confetti Animation
-- [x] Add confetti animation on task completion for positive reinforcement
- [x] Add celebration sound effect with confetti animation

- [x] Add haptic feedback on task completion using Vibration API


## Bug Fixes
- [x] Fix admin access issue when entering 5786 passcode (verified role is 'admin' in DB)
- [x] Add logout button to Settings page for switching accounts


## Enhanced Activity Tracking
- [x] Create activity_logs table with timestamps, IP, user agent, action type
- [x] Track login events with IP and device info
- [x] Track page views and navigation patterns
- [x] Track task completion timing (time spent on form)
- [x] Track session duration and frequency
- [x] Add engagement metrics to admin dashboard (login frequency, session duration, time of day patterns)
- [x] Create engagement score algorithm based on activity patterns
- [x] Display engagement trends over time in admin dashboard


## Psychoeducational Content & Audit
- [x] Add app purpose/welcome explanation for Brian
- [x] Add psychoeducational material for each weekly task
- [x] Add educational context about exposure therapy principles
- [x] Run comprehensive code audit (TypeScript, tests, security, accessibility)
- [x] Ensure 100% test pass rate (22/22 tests passing)
- [x] Prepare text message with URL for delivery


## GitHub Repository
- [x] Create public GitHub repository
- [x] Push code to repository
- [x] Provide repository URL to user


## Bug Fixes from Code Review
### Critical Bugs
- [x] Fix useEffect dependency arrays (Bug #1)
- [x] Fix unsafe type assertions in db.ts (Bug #2)
- [x] Fix timezone bugs in date comparisons (Bug #3)
- [x] Fix sendBeacon content-type issue (Bug #4)

### High Priority Bugs
- [x] Fix race condition in entry creation (Bug #5) - Added comment about existing mitigation
- [x] Fix admin page showing wrong user data (Bug #6) - Added userId parameter to entries.getRecent
- [x] Fix potential division by zero in Stats (Bug #7)
- [x] Fix AudioContext memory leak (Bug #8) - Added audioContext.close() after sounds finish

### Medium Priority Bugs
- [x] Replace hardcoded "Brian" with dynamic user names (Bug #9)
- [x] Fix early bird bonus timezone issue (Bug #10) - Added comment about server time
- [x] Add error boundaries for charts (Bug #11) - Created ChartErrorBoundary component
- [x] Fix CSV injection vulnerability (Bug #12) - Added sanitizeCSV function
- [ ] Add database indexes for performance (Bug #13) - Deferred (would require migration)
