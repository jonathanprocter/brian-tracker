import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Lock, Trophy, TrendingUp, Calendar } from "lucide-react";
import { useLocation } from "wouter";

export default function Achievements() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  
  const { data: allAchievements, isLoading: achievementsLoading } = trpc.achievements.getAll.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const { data: userAchievements, isLoading: userAchievementsLoading } = trpc.achievements.getUserAchievements.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  if (achievementsLoading || userAchievementsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const unlockedIds = new Set(userAchievements?.map(ua => ua.achievementId) || []);
  const unlockedMap = new Map(
    userAchievements?.map(ua => [ua.achievementId, ua.unlockedAt]) || []
  );

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 sticky top-0 z-10">
        <div className="container max-w-2xl flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">🏆 Achievements</h1>
            <p className="text-sm text-muted-foreground">
              {userAchievements?.length || 0} / {allAchievements?.length || 0} Unlocked
            </p>
          </div>
        </div>
      </div>

      <div className="container max-w-2xl py-6 space-y-6">
        {/* Progress Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-3xl font-bold">
                  {userAchievements?.length || 0} / {allAchievements?.length || 0}
                </p>
              </div>
              <Trophy className="w-16 h-16 text-primary" />
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ 
                  width: `${allAchievements?.length ? ((userAchievements?.length || 0) / allAchievements.length) * 100 : 0}%` 
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Achievement Grid */}
        <div className="grid gap-4">
          {allAchievements?.map((achievement) => {
            const isUnlocked = unlockedIds.has(achievement.id);
            const unlockedDate = unlockedMap.get(achievement.id);

            return (
              <Card 
                key={achievement.id}
                className={`transition-all ${isUnlocked ? 'border-primary/50 bg-primary/5' : 'opacity-60'}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {/* Badge Icon */}
                    <div className={`
                      text-5xl flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-full
                      ${isUnlocked ? 'bg-primary/20' : 'bg-muted'}
                    `}>
                      {isUnlocked ? achievement.badgeIcon : <Lock className="w-8 h-8 text-muted-foreground" />}
                    </div>

                    {/* Achievement Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                        {achievement.name}
                        {isUnlocked && <span className="text-success">✓</span>}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {achievement.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="bg-muted px-2 py-1 rounded">
                          {achievement.unlockCriteria}
                        </span>
                      </div>
                      
                      {isUnlocked && unlockedDate && (
                        <p className="text-xs text-success mt-2">
                          Unlocked {new Date(unlockedDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Motivational Message */}
        {allAchievements && userAchievements && userAchievements.length < allAchievements.length && (
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="pt-6 text-center">
              <p className="text-lg font-medium mb-2">Keep Going!</p>
              <p className="text-sm text-muted-foreground">
                You have {allAchievements.length - userAchievements.length} more achievements to unlock.
                Complete daily tasks to earn them.
              </p>
            </CardContent>
          </Card>
        )}

        {allAchievements && userAchievements && userAchievements.length === allAchievements.length && (
          <Card className="bg-success/10 border-success/20">
            <CardContent className="pt-6 text-center">
              <div className="text-6xl mb-3">🎉</div>
              <p className="text-2xl font-bold text-success mb-2">All Achievements Unlocked!</p>
              <p className="text-sm text-muted-foreground">
                You've completed every achievement. Great work!
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Navigation - iPhone optimized */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom">
        <div className="container max-w-2xl">
          <div className="grid grid-cols-3 gap-3 p-4 pb-6">
            <Button variant="ghost" onClick={() => setLocation("/")} className="flex-col h-20">
              <Calendar className="w-7 h-7 mb-1" />
              <span className="text-sm font-medium">Progress</span>
            </Button>
            <Button variant="ghost" onClick={() => setLocation("/stats")} className="flex-col h-20">
              <TrendingUp className="w-7 h-7 mb-1" />
              <span className="text-sm font-medium">Stats</span>
            </Button>
            <Button variant="default" className="flex-col h-20">
              <Trophy className="w-7 h-7 mb-1" />
              <span className="text-sm font-medium">Achievements</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
