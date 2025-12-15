import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AlertCircle, TrendingDown, TrendingUp, Calendar, Activity, Download, Bell } from "lucide-react";
import { useLocation } from "wouter";
import { Line } from "react-chartjs-2";
import { toast } from "sonner";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  const { data: clients } = trpc.admin.getAllClients.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin',
  });

  // For now, we'll focus on Brian (first client)
  const brianId = clients?.[0]?.id;
  
  const { data: activity, isLoading } = trpc.admin.getUserActivity.useQuery(
    { userId: brianId! },
    { enabled: !!brianId }
  );

  const { data: recentEntries } = trpc.entries.getRecent.useQuery(
    { limit: 20 },
    { enabled: !!brianId }
  );

  const { data: aiSummary, isLoading: aiLoading } = trpc.ai.getClientSummary.useQuery(
    { userId: brianId! },
    { enabled: !!brianId }
  );

  const { data: exportData, refetch: refetchExport, isFetching: isExporting } = trpc.admin.exportClientData.useQuery(
    { userId: brianId! },
    { enabled: false } // Only fetch on demand
  );

  const sendTestNotification = trpc.notifications.sendTestNotification.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Test notification sent!");
      } else {
        toast.error("Failed to send notification");
      }
    },
    onError: () => {
      toast.error("Failed to send notification");
    }
  });

  const handleExportCSV = async () => {
    const result = await refetchExport();
    if (result.data) {
      const data = result.data;
      
      // Create CSV content
      const headers = ['Date', 'Week', 'Task', 'Anxiety Before', 'Anxiety During', 'Reduction', 'Used Klonopin', 'Win Note', 'XP Earned'];
      const rows = data.entries.map(e => [
        e.date,
        e.week,
        `"${e.task}"`,
        e.anxietyBefore,
        e.anxietyDuring,
        e.anxietyReduction,
        e.usedKlonopin,
        `"${(e.winNote || '').replace(/"/g, '""')}"`,
        e.xpEarned
      ]);
      
      const csvContent = [
        `# Brian's Progress Report`,
        `# Generated: ${new Date().toLocaleDateString()}`,
        `# Level: ${data.user.currentLevel} | XP: ${data.user.totalXp} | Streak: ${data.user.currentStreak}`,
        `# Total Entries: ${data.totalEntries} | Achievements: ${data.achievementsUnlocked}`,
        '',
        headers.join(','),
        ...rows.map(r => r.join(','))
      ].join('\n');
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brian-progress-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('CSV exported successfully!');
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    toast.error("Admin access required");
    setLocation("/");
    return null;
  }

  if (isLoading || !activity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Prepare anxiety trend data
  const anxietyData = recentEntries?.slice().reverse() || [];
  const chartData = {
    labels: anxietyData.map((_, index) => `${index + 1}`),
    datasets: [
      {
        label: 'Before Task',
        data: anxietyData.map(entry => entry.anxietyBefore),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      },
      {
        label: 'During Task',
        data: anxietyData.map(entry => entry.anxietyDuring),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
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
          font: { size: 12 },
        },
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

  // Calculate red flags
  const redFlags = [];
  const lastLoginDate = activity.lastLogin ? new Date(activity.lastLogin.loggedInAt) : null;
  const daysSinceLogin = lastLoginDate 
    ? Math.floor((Date.now() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  if (daysSinceLogin >= 3) {
    redFlags.push(`No login in ${daysSinceLogin} days`);
  }
  if (activity.weekCompletions === 0) {
    redFlags.push("0 completions this week");
  }
  
  // Check anxiety trend
  if (anxietyData.length >= 5) {
    const recent5 = anxietyData.slice(-5);
    const avgRecent = recent5.reduce((sum, e) => sum + e.anxietyBefore, 0) / 5;
    const previous5 = anxietyData.slice(-10, -5);
    if (previous5.length === 5) {
      const avgPrevious = previous5.reduce((sum, e) => sum + e.anxietyBefore, 0) / 5;
      if (avgRecent > avgPrevious + 1) {
        redFlags.push("Anxiety increasing over last 10 tasks");
      }
    }
  }

  // Calculate completion rate
  const totalDays = Math.floor((Date.now() - new Date(activity.user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const completionRate = totalDays > 0 ? ((activity.recentEntries.length / totalDays) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen pb-6">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 sticky top-0 z-10">
        <div className="container max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">👨‍⚕️ 5786 Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Monitoring Brian's Progress</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendTestNotification.mutate()}
                disabled={sendTestNotification.isPending}
                className="h-10"
              >
                <Bell className="w-4 h-4 mr-2" />
                Test Notify
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleExportCSV}
                disabled={isExporting}
                className="h-10"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-4xl py-6 space-y-6">
        {/* Red Flags Alert */}
        {redFlags.length > 0 && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                Red Flags Detected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {redFlags.map((flag, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <span className="text-destructive">⚠️</span>
                    {flag}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* AI Clinical Summary */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">🧠</span>
              AI Clinical Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-muted-foreground">Analyzing client data...</span>
              </div>
            ) : aiSummary ? (
              <>
                <p className="text-sm leading-relaxed">
                  {typeof aiSummary.summary === 'string' ? aiSummary.summary : 'Unable to generate summary.'}
                </p>
                
                {aiSummary.positives && aiSummary.positives.length > 0 && (
                  <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                    <p className="text-sm font-medium text-success mb-2">✅ Positives</p>
                    <ul className="text-sm space-y-1">
                      {aiSummary.positives.map((positive: string, i: number) => (
                        <li key={i} className="text-muted-foreground">• {positive}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {aiSummary.concerns && aiSummary.concerns.length > 0 && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <p className="text-sm font-medium text-destructive mb-2">⚠️ Concerns to Monitor</p>
                    <ul className="text-sm space-y-1">
                      {aiSummary.concerns.map((concern: string, i: number) => (
                        <li key={i} className="text-muted-foreground">• {concern}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Not enough data for AI analysis yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Client Overview */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-bold">{activity.user.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Week</p>
                <p className="font-bold">Week {activity.user.currentWeek}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Level / XP</p>
                <p className="font-bold">Level {activity.user.currentLevel} ({activity.user.totalXp} XP)</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="font-bold streak-fire">{activity.user.currentStreak} days 🔥</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Last Login</p>
                <p className="font-bold">
                  {lastLoginDate ? (
                    <>
                      {lastLoginDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      <span className="text-sm text-muted-foreground ml-2">
                        ({daysSinceLogin} days ago)
                      </span>
                    </>
                  ) : (
                    "Never"
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="font-bold">{activity.weekCompletions} / 7 days</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Completions</p>
                <p className="font-bold">{activity.recentEntries.length} tasks</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="font-bold">{completionRate}%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Anxiety Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Anxiety Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {anxietyData.length > 0 ? (
              <div className="h-64">
                <Line data={chartData} options={chartOptions} />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Entries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Entries (Last 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity.recentEntries.length > 0 ? (
              <div className="space-y-3">
                {activity.recentEntries.map((entry) => (
                  <div 
                    key={entry.id}
                    className="flex items-start justify-between p-3 bg-card/50 rounded-lg border border-border"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {new Date(entry.completedAt).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="text-muted-foreground">
                          Anxiety: {entry.anxietyBefore} → {entry.anxietyDuring}
                        </span>
                        {entry.usedKlonopin && (
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            Used Klonopin
                          </span>
                        )}
                      </div>
                      {entry.winNote && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          "{entry.winNote}"
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-primary">+{entry.xpEarned} XP</p>
                      {entry.anxietyBefore > entry.anxietyDuring ? (
                        <p className="text-sm text-success flex items-center gap-1">
                          <TrendingDown className="w-4 h-4" />
                          -{entry.anxietyBefore - entry.anxietyDuring}
                        </p>
                      ) : entry.anxietyBefore < entry.anxietyDuring ? (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          +{entry.anxietyDuring - entry.anxietyBefore}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No entries yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Clinical Notes Section */}
        <Card>
          <CardHeader>
            <CardTitle>Clinical Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Observations:</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Current protocol: Week {activity.user.currentWeek}</li>
                <li>• Engagement level: {activity.weekCompletions >= 3 ? "Good" : activity.weekCompletions >= 1 ? "Fair" : "Low"}</li>
                <li>• Medication usage: {activity.recentEntries.filter(e => e.usedKlonopin).length} / {activity.recentEntries.length} tasks</li>
              </ul>
            </div>
            
            <Button variant="outline" className="w-full" onClick={() => {
              toast.info("Export functionality coming soon");
            }}>
              Export Data to CSV
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
