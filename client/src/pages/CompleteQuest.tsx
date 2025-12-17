import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { playCelebrationSound, playLevelUpSound, triggerHapticFeedback } from "@/lib/sounds";

export default function CompleteQuest() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [anxietyBefore, setAnxietyBefore] = useState<number | null>(null);
  const [anxietyDuring, setAnxietyDuring] = useState<number | null>(null);
  const [usedKlonopin, setUsedKlonopin] = useState<boolean>(false);
  const [winNote, setWinNote] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const { data: currentTask, isLoading: taskLoading } = trpc.tasks.getCurrentTask.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const { data: todayEntry } = trpc.entries.getTodayEntry.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const utils = trpc.useUtils();
  const getAiMessage = trpc.ai.getCompletionMessage.useMutation();
  const logActivity = trpc.activity.logEvent.useMutation();

  // Log page view on mount
  useEffect(() => {
    if (isAuthenticated) {
      logActivity.mutate({
        actionType: 'task_started',
        pagePath: '/complete',
      });
    }
  }, [isAuthenticated, logActivity]);
  
  const createEntry = trpc.entries.create.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setShowSuccess(true);
      
      // Log task completion activity
      logActivity.mutate({
        actionType: 'task_completed',
        pagePath: '/complete',
        metadata: JSON.stringify({
          xpEarned: data.xpEarned,
          leveledUp: data.leveledUp,
          newStreak: data.newStreak,
        }),
      });
      
      // Trigger confetti and sound on every task completion for positive reinforcement
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6']
      });
      playCelebrationSound();
      triggerHapticFeedback('success');
      
      // Extra confetti burst and fanfare if leveled up
      if (data.leveledUp) {
        setTimeout(() => {
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.5 },
            colors: ['#fbbf24', '#f59e0b', '#d97706']
          });
          playLevelUpSound();
          triggerHapticFeedback('levelUp');
        }, 300);
      }
      
      // Get AI personalized message
      if (currentTask && anxietyBefore !== null && anxietyDuring !== null) {
        setAiLoading(true);
        getAiMessage.mutate({
          anxietyBefore,
          anxietyDuring,
          usedKlonopin,
          winNote: winNote.trim() || undefined,
          currentStreak: data.newStreak,
          taskName: currentTask.taskName,
        }, {
          onSuccess: (aiData) => {
            const msg = typeof aiData.message === 'string' ? aiData.message : 'Great work today.';
            setAiMessage(msg);
            setAiLoading(false);
          },
          onError: () => {
            setAiMessage("Great work today. Every step forward counts.");
            setAiLoading(false);
          }
        });
      }
      
      // Invalidate queries to refresh data
      utils.entries.getTodayEntry.invalidate();
      utils.entries.getWeekEntries.invalidate();
      utils.stats.getOverview.invalidate();
      utils.auth.me.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to complete quest");
    },
  });

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  if (taskLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (todayEntry) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-6xl">✓</div>
            <h2 className="text-2xl font-bold text-success">Task Already Complete!</h2>
            <p className="text-muted-foreground">
              You've already completed today's task. Come back tomorrow!
            </p>
            <Button onClick={() => setLocation("/")} className="w-full h-14">
              Back to Progress
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showSuccess && result) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold mb-2">Task Complete!</h2>
            </div>

            <div className="space-y-3 bg-card/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Base XP</span>
                <span className="font-bold text-xl">+50 XP</span>
              </div>
              {!usedKlonopin && (
                <div className="flex justify-between items-center text-success">
                  <span>No Klonopin Bonus</span>
                  <span className="font-bold">+25 XP</span>
                </div>
              )}
              {new Date().getHours() < 12 && (
                <div className="flex justify-between items-center text-success">
                  <span>Early Bird Bonus</span>
                  <span className="font-bold">+15 XP</span>
                </div>
              )}
              <div className="border-t border-border pt-2 flex justify-between items-center">
                <span className="font-bold">Total XP Earned</span>
                <span className="font-bold text-2xl text-primary">+{result.xpEarned} XP</span>
              </div>
            </div>

            {result.leveledUp && (
              <div className="bg-level-purple/10 border-2 border-level-purple rounded-lg p-4 text-center">
                <p className="text-2xl font-bold mb-1">⭐ LEVEL UP! ⭐</p>
                <p className="text-muted-foreground">You reached Level {result.newLevel}!</p>
              </div>
            )}

            <div className="bg-card/50 rounded-lg p-4">
              <p className="text-center mb-2">
                <span className="text-2xl">🔥</span>
                <span className="font-bold text-xl ml-2 streak-fire">{result.newStreak} Day Streak!</span>
              </p>
            </div>

            {result.anxietyReduction > 0 && (
              <div className="bg-card/50 rounded-lg p-4">
                <p className="font-bold mb-2">📉 Anxiety Reduction:</p>
                <p className="text-center">
                  <span className="text-xl">You reduced anxiety by </span>
                  <span className="text-2xl font-bold text-success">{result.anxietyReduction}</span>
                  <span className="text-xl"> points!</span>
                </p>
                <p className="text-sm text-center text-muted-foreground mt-1">
                  (Before: {anxietyBefore} → During: {anxietyDuring})
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                {aiLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Generating personalized feedback...</span>
                  </div>
                ) : (
                  <p className="text-center text-sm italic">
                    "{aiMessage || 'Great work today. Every step forward counts.'}"
                  </p>
                )}
              </div>
              <Button onClick={() => setLocation("/")} className="w-full h-14" size="lg">
                Back to Progress
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = () => {
    if (anxietyBefore === null || anxietyDuring === null || !currentTask) {
      toast.error("Please complete all required fields");
      return;
    }

    createEntry.mutate({
      taskId: currentTask.id,
      anxietyBefore,
      anxietyDuring,
      usedKlonopin,
      winNote: winNote.trim() || undefined,
    });
  };

  const getAnxietyColor = (level: number) => {
    if (level >= 7) return "anxiety-high";
    if (level >= 4) return "anxiety-medium";
    return "anxiety-low";
  };

  return (
    <div className="min-h-screen pb-6">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 sticky top-0 z-10">
        <div className="container max-w-2xl flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Complete Task</h1>
            <p className="text-sm text-muted-foreground">{currentTask?.taskName}</p>
          </div>
        </div>
      </div>

      <div className="container max-w-2xl py-6">
        <Card>
          <CardHeader>
            <CardTitle>🎯 {currentTask?.taskName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Task Description */}
            <div className="bg-card/50 rounded-lg p-4">
              <p className="text-sm italic text-muted-foreground mb-2">
                "{currentTask?.questDescription}"
              </p>
              <p className="text-sm">
                <span className="font-medium">Goal:</span> {currentTask?.taskDescription}
              </p>
            </div>

            {/* Psychoeducation - Why This Helps */}
            {currentTask?.psychoeducation && (
              <details className="bg-primary/5 border border-primary/20 rounded-lg">
                <summary className="p-4 cursor-pointer font-medium text-sm flex items-center gap-2">
                  <span>📚</span> Why This Task Helps (tap to learn more)
                </summary>
                <div className="px-4 pb-4 text-sm text-muted-foreground space-y-3 prose prose-sm prose-invert max-w-none">
                  {currentTask.psychoeducation.split('\n\n').map((paragraph, i) => (
                    <p key={i} dangerouslySetInnerHTML={{ 
                      __html: paragraph
                        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n•/g, '<br/>•')
                    }} />
                  ))}
                </div>
              </details>
            )}

            {/* Anxiety Before */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Anxiety BEFORE task (0-10)</Label>
              <div className="grid grid-cols-6 gap-3">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                  <Button
                    key={level}
                    variant={anxietyBefore === level ? "default" : "outline"}
                    className={`h-14 text-lg font-bold ${anxietyBefore === level ? '' : getAnxietyColor(level)}`}
                    onClick={() => setAnxietyBefore(level)}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            {/* Task Completion */}
            <div className="space-y-3">
              <Label className="text-base">Did you complete the task?</Label>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-16 text-lg"
                  onClick={() => {
                    // If they didn't complete it, redirect back
                    toast.info("That's okay! Try again tomorrow.");
                    setTimeout(() => setLocation("/"), 1500);
                  }}
                >
                  ✗ No
                </Button>
                <Button
                  variant="default"
                  className="flex-1 h-16 text-lg"
                  disabled
                >
                  ✓ Yes
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                (Click "Yes" is selected - continue filling out the form)
              </p>
            </div>

            {/* Anxiety During */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Anxiety DURING task (0-10)</Label>
              <div className="grid grid-cols-6 gap-3">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
                  <Button
                    key={level}
                    variant={anxietyDuring === level ? "default" : "outline"}
                    className={`h-14 text-lg font-bold ${anxietyDuring === level ? '' : getAnxietyColor(level)}`}
                    onClick={() => setAnxietyDuring(level)}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            {/* Klonopin Usage */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Did you use Klonopin?</Label>
              <RadioGroup value={usedKlonopin ? "yes" : "no"} onValueChange={(val) => setUsedKlonopin(val === "yes")}>
                <div className="flex items-center space-x-3 p-4 rounded-lg border border-border min-h-[56px]">
                  <RadioGroupItem value="yes" id="klonopin-yes" className="w-6 h-6" />
                  <Label htmlFor="klonopin-yes" className="flex-1 cursor-pointer text-base">Yes</Label>
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-lg border border-border min-h-[56px]">
                  <RadioGroupItem value="no" id="klonopin-no" className="w-6 h-6" />
                  <Label htmlFor="klonopin-no" className="flex-1 cursor-pointer text-base">
                    No <span className="text-success text-sm ml-2">(+25 XP Bonus!)</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Win Note */}
            <div className="space-y-3">
              <Label htmlFor="win-note" className="text-base font-semibold">💪 Today's Win (Optional)</Label>
              <Textarea
                id="win-note"
                placeholder="What went well? What are you proud of?"
                value={winNote}
                onChange={(e) => setWinNote(e.target.value)}
                rows={4}
                className="resize-none text-base min-h-[120px]"
              />
            </div>

            {/* Submit Button - Large for iPhone */}
            <Button 
              onClick={handleSubmit}
              disabled={anxietyBefore === null || anxietyDuring === null || createEntry.isPending}
              size="lg"
              className="w-full h-16 text-lg font-bold"
            >
              {createEntry.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit & Earn XP"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
