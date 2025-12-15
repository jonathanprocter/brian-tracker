import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, TrendingDown, TrendingUp, Trophy, Flame, Target, Calendar } from "lucide-react";
import { useLocation } from "wouter";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Stats() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { data: stats, isLoading } = trpc.stats.getOverview.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: recentEntries } = trpc.entries.getRecent.useQuery({ limit: 20 }, {
    enabled: isAuthenticated,
  });
  
  const { data: aiInsights, isLoading: aiLoading } = trpc.ai.getWeeklyInsights.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Prepare anxiety trend data
  const anxietyData = recentEntries?.slice().reverse() || [];
  const chartData = {
    labels: anxietyData.map((_, index) => `Task ${index + 1}`),
    datasets: [
      {
        label: 'Before Task',
        data: anxietyData.map(entry => entry.anxietyBefore),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'During Task',
        data: anxietyData.map(entry => entry.anxietyDuring),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgb(226, 232, 240)',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        min: 0,
        max: 10,
        ticks: {
          color: 'rgb(148, 163, 184)',
          stepSize: 1,
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
      },
      x: {
        ticks: {
          color: 'rgb(148, 163, 184)',
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 10,
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
      },
    },
  };

  // Calculate average anxiety reduction
  const avgReduction = anxietyData.length > 0
    ? anxietyData.reduce((sum, entry) => sum + (entry.anxietyBefore - entry.anxietyDuring), 0) / anxietyData.length
    : 0;

  // Calculate trend (comparing first half vs second half)
  const halfPoint = Math.floor(anxietyData.length / 2);
  const firstHalfAvg = anxietyData.slice(0, halfPoint).reduce((sum, e) => sum + e.anxietyBefore, 0) / halfPoint || 0;
  const secondHalfAvg = anxietyData.slice(halfPoint).reduce((sum, e) => sum + e.anxietyBefore, 0) / (anxietyData.length - halfPoint) || 0;
  const trend = firstHalfAvg - secondHalfAvg;

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 sticky top-0 z-10">
        <div className="container max-w-2xl flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">📊 Your Stats</h1>
            <p className="text-sm text-muted-foreground">Track your progress</p>
          </div>
        </div>
      </div>

      <div className="container max-w-2xl py-6 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl mb-2">⭐</div>
              <p className="text-2xl font-bold">{stats?.currentLevel}</p>
              <p className="text-xs text-muted-foreground">Current Level</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl mb-2">✨</div>
              <p className="text-2xl font-bold">{stats?.totalXp}</p>
              <p className="text-xs text-muted-foreground">Total XP</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Flame className="w-8 h-8 mx-auto mb-2 streak-fire" />
              <p className="text-2xl font-bold">{stats?.currentStreak}</p>
              <p className="text-xs text-muted-foreground">Current Streak</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats?.longestStreak}</p>
              <p className="text-xs text-muted-foreground">Longest Streak</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">💡</span>
              Personalized Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aiLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-muted-foreground">Analyzing your progress...</span>
              </div>
            ) : (
              <p className="text-sm leading-relaxed">
                {typeof aiInsights?.insight === 'string' ? aiInsights.insight : 'Complete more tasks to unlock personalized insights.'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Anxiety Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Anxiety Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-6xl mb-3">📉</div>
              <p className="text-sm text-muted-foreground mb-2">Total Anxiety Reduction</p>
              <p className="text-4xl font-bold text-success">{stats?.totalDamageDealt}</p>
            </div>

            <div className="bg-card/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Average Reduction per Task</span>
                <span className="font-bold">{avgReduction.toFixed(1)} points</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Tasks Completed</span>
                <span className="font-bold">{stats?.totalTasks}</span>
              </div>
            </div>

            {trend > 0 && (
              <div className="bg-success/10 border border-success/20 rounded-lg p-3 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-success" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-success">Anxiety Trending Down!</p>
                  <p className="text-xs text-muted-foreground">
                    Your anxiety has decreased by {trend.toFixed(1)} points on average
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Anxiety Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Anxiety Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {anxietyData.length > 0 ? (
              <div className="h-64">
                <Line data={chartData} options={chartOptions} />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p className="mb-2">No data yet</p>
                  <p className="text-sm">Complete your first quest to see trends!</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Achievement Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Achievement Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Unlocked</span>
                <span className="text-2xl font-bold">
                  {stats?.achievementsUnlocked} / {stats?.totalAchievements}
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ 
                    width: `${stats?.totalAchievements ? (stats.achievementsUnlocked / stats.totalAchievements) * 100 : 0}%` 
                  }}
                />
              </div>
              <Button 
                onClick={() => setLocation("/achievements")} 
                variant="outline" 
                className="w-full h-14 text-base font-medium"
              >
                View All Achievements
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentEntries && recentEntries.length > 0 ? (
              <div className="space-y-3">
                {recentEntries.slice(0, 5).map((entry) => (
                  <div 
                    key={entry.id} 
                    className="flex items-center justify-between p-3 bg-card/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {new Date(entry.completedAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Anxiety: {entry.anxietyBefore} → {entry.anxietyDuring}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">+{entry.xpEarned} XP</p>
                      {entry.anxietyBefore > entry.anxietyDuring && (
                        <p className="text-xs text-success">
                          -{entry.anxietyBefore - entry.anxietyDuring} anxiety
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No activity yet. Complete your first quest!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation - iPhone optimized */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom">
        <div className="container max-w-2xl">
          <div className="grid grid-cols-3 gap-3 p-4 pb-6">
            <Button variant="ghost" onClick={() => setLocation("/")} className="flex-col h-20">
              <Calendar className="w-7 h-7 mb-1" />
              <span className="text-sm font-medium">Progress</span>
            </Button>
            <Button variant="default" className="flex-col h-20">
              <TrendingUp className="w-7 h-7 mb-1" />
              <span className="text-sm font-medium">Stats</span>
            </Button>
            <Button variant="ghost" onClick={() => setLocation("/achievements")} className="flex-col h-20">
              <Trophy className="w-7 h-7 mb-1" />
              <span className="text-sm font-medium">Achievements</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
