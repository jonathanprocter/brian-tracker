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
