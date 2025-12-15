import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Flame, Trophy, TrendingUp, Calendar, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [passcode, setPasscode] = useState("");
  const [, setLocation] = useLocation();
  
  const { data: stats, isLoading: statsLoading } = trpc.stats.getOverview.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: currentTask } = trpc.tasks.getCurrentTask.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: weekEntries } = trpc.entries.getWeekEntries.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: todayEntry } = trpc.entries.getTodayEntry.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const loginMutation = trpc.auth.passcodeLogin.useMutation({
    onSuccess: (data) => {
      toast.success(`Welcome, ${data.name}!`);
      if (data.role === 'admin') {
        setLocation('/admin');
      } else {
        window.location.reload();
      }
    },
    onError: (error) => {
      toast.error(error.message || "Invalid passcode");
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim()) {
      loginMutation.mutate({ passcode: passcode.trim() });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Brian's Progress Tracker</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <p className="text-center text-muted-foreground">
                Enter your name or code to continue.
              </p>
              <Input
                type="text"
                placeholder="Enter name or code"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="h-14 text-lg text-center"
                autoFocus
                autoComplete="off"
              />
              <Button 
                type="submit" 
                className="w-full h-16 text-lg font-bold" 
                size="lg"
                disabled={!passcode.trim() || loginMutation.isPending}
              >
                {loginMutation.isPending ? "Logging in..." : "Continue"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate week progress
  const daysThisWeek = weekEntries?.length || 0;
  const goalDays = currentTask?.goalDays || 3;
  const weekProgress = Math.min((daysThisWeek / 7) * 100, 100);
  
  // XP progress
  const xpProgress = stats ? ((stats.totalXp % stats.xpForNextLevel) / stats.xpForNextLevel) * 100 : 0;
  
  // Week calendar (Monday first)
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const completedDates = new Set(
    weekEntries?.map(entry => new Date(entry.completedAt).toDateString()) || []
  );

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="container max-w-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Brian's Progress</h1>
              <p className="text-sm text-muted-foreground">Daily check-in and progress tracking</p>
            </div>
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="h-12 w-12">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container max-w-2xl py-6 space-y-6">
        {/* Level & XP Card */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Level</p>
                <p className="text-3xl font-bold">
                  {stats?.currentLevel} <span className="text-lg">⭐</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total XP</p>
                <p className="text-2xl font-semibold">{stats?.totalXp}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">XP Progress</span>
                <span className="font-medium">
                  {stats ? stats.totalXp % stats.xpForNextLevel : 0} / {stats?.xpForNextLevel || 0}
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full xp-bar-gradient transition-all duration-500"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>

            {/* Streak */}
            <div className="flex items-center justify-center gap-6 pt-2 border-t border-border">
              <div className="text-center">
                <p className="text-2xl font-bold streak-fire flex items-center gap-1 justify-center">
                  <Flame className="w-6 h-6" />
                  {stats?.currentStreak}
                </p>
                <p className="text-xs text-muted-foreground">Current Streak</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold flex items-center gap-1 justify-center">
                  <Trophy className="w-6 h-6 text-primary" />
                  {stats?.achievementsUnlocked}/{stats?.totalAchievements}
                </p>
                <p className="text-xs text-muted-foreground">Achievements</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* This Week Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              This Week {currentTask && `(Week ${user?.currentWeek})`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, index) => {
                const date = new Date(today);
                // Monday = 0, so adjust: getDay() returns 0 for Sunday, 1 for Monday, etc.
                const dayOfWeek = today.getDay();
                const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days to Monday
                date.setDate(today.getDate() + mondayOffset + index);
                const isCompleted = completedDates.has(date.toDateString());
                const isToday = date.toDateString() === today.toDateString();
                
                return (
                  <div key={day} className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">{day}</p>
                    <div 
                      className={`
                        w-10 h-10 rounded-lg flex items-center justify-center text-lg mx-auto
                        ${isCompleted ? 'bg-success text-white' : 'bg-muted'}
                        ${isToday ? 'ring-2 ring-primary' : ''}
                      `}
                    >
                      {isCompleted ? '✓' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {daysThisWeek} / 7 days
                  {daysThisWeek >= goalDays && <span className="text-success ml-2">⭐ Goal Met!</span>}
                </span>
              </div>
              <Progress value={weekProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Today's Quest */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 Today's Task</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentTask && (
              <>
                <div>
                  <h3 className="font-bold text-lg mb-2">{currentTask.taskName}</h3>
                  <p className="text-sm text-muted-foreground italic mb-3">
                    "{currentTask.questDescription}"
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Mission:</span> {currentTask.taskDescription}
                  </p>
                </div>

                {todayEntry ? (
                  <div className="bg-success/10 border border-success/20 rounded-lg p-4 text-center">
                    <p className="text-success font-bold mb-1">✓ Task Complete!</p>
                    <p className="text-sm text-muted-foreground">
                      You earned {todayEntry.xpEarned} XP today. Come back tomorrow!
                    </p>
                  </div>
                ) : (
                  <Button asChild size="lg" className="w-full h-16 text-lg font-bold">
                    <Link href="/complete-quest">Complete Today's Task</Link>
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats?.totalTasks}</p>
              <p className="text-xs text-muted-foreground">Tasks Done</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl mb-2">📉</div>
              <p className="text-2xl font-bold">{stats?.totalDamageDealt}</p>
              <p className="text-xs text-muted-foreground">Anxiety Reduced</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Navigation - iPhone optimized */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom">
        <div className="container max-w-2xl">
          <div className="grid grid-cols-3 gap-3 p-4 pb-6">
            <Button variant="ghost" asChild className="flex-col h-20 text-primary">
              <Link href="/">
                <Calendar className="w-7 h-7 mb-1" />
                <span className="text-sm font-medium">Progress</span>
              </Link>
            </Button>
            <Button variant="ghost" asChild className="flex-col h-20">
              <Link href="/stats">
                <TrendingUp className="w-7 h-7 mb-1" />
                <span className="text-sm font-medium">Stats</span>
              </Link>
            </Button>
            <Button variant="ghost" asChild className="flex-col h-20">
              <Link href="/achievements">
                <Trophy className="w-7 h-7 mb-1" />
                <span className="text-sm font-medium">Achievements</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
