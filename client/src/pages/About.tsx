import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function About() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen pb-6">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 sticky top-0 z-10">
        <div className="container max-w-2xl flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">About This App</h1>
            <p className="text-sm text-muted-foreground">Understanding your progress tracker</p>
          </div>
        </div>
      </div>

      <div className="container max-w-2xl py-6 space-y-6">
        {/* Purpose */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🎯</span> What This App Is For
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              This app is designed to help you gradually overcome agoraphobia through a structured, 
              evidence-based approach called <strong>exposure therapy</strong>. The goal isn't to 
              eliminate anxiety overnight—it's to prove to yourself, one small step at a time, 
              that you can handle being outside.
            </p>
            <p>
              Each week, you'll have a specific task to practice. These tasks are intentionally 
              small and manageable. The magic isn't in doing something big—it's in doing something 
              consistently. Your brain learns through repetition that these situations are safe.
            </p>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>⚙️</span> How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="text-primary font-bold">1.</span>
                <p><strong>Daily Practice:</strong> Complete your assigned task each day. Even on hard days, showing up matters.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold">2.</span>
                <p><strong>Track Your Anxiety:</strong> Rate your anxiety before and during each task. This helps you see patterns and progress over time.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold">3.</span>
                <p><strong>Earn XP & Level Up:</strong> Every completed task earns you XP. Bonuses for completing without medication and for morning completions.</p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold">4.</span>
                <p><strong>Build Streaks:</strong> Consecutive days build streaks. Streaks build habits. Habits change your life.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* The Science */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🧠</span> The Science Behind It
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              <strong>Exposure therapy</strong> is one of the most effective treatments for anxiety 
              disorders. Here's why it works:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong>Habituation:</strong> When you repeatedly face something that makes you anxious (without anything bad happening), your anxiety naturally decreases.</li>
              <li><strong>New Learning:</strong> Your brain creates new memories that "outside is safe," which eventually override the old fear memories.</li>
              <li><strong>Building Confidence:</strong> Each successful exposure proves to yourself that you can handle anxiety—it's uncomfortable but not dangerous.</li>
            </ul>
            <p className="text-muted-foreground italic">
              Remember: Anxiety always peaks and then comes down on its own. You don't need to fight it—just wait it out.
            </p>
          </CardContent>
        </Card>

        {/* Tips for Success */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>💡</span> Tips for Success
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <ul className="space-y-3">
              <li className="flex gap-2">
                <span>✓</span>
                <span><strong>Consistency over intensity:</strong> Doing a small task every day is better than doing a big task once a week.</span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span><strong>Don't wait to feel ready:</strong> You'll never feel 100% ready. Do it anyway.</span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span><strong>Expect anxiety:</strong> It's supposed to be there. That's the point—you're learning to handle it.</span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span><strong>Celebrate small wins:</strong> Every completed task is a victory, no matter how small it feels.</span>
              </li>
              <li className="flex gap-2">
                <span>✓</span>
                <span><strong>Bad days happen:</strong> If you miss a day, just start again tomorrow. Progress isn't linear.</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🤝</span> You're Not Alone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              Jonathan is monitoring your progress and is here to support you. This app tracks 
              your activity so he can see how you're doing and adjust your treatment plan if needed.
            </p>
            <p>
              If you're struggling, that's okay—and it's important information. Keep logging your 
              tasks honestly, even on hard days. The data helps us help you better.
            </p>
          </CardContent>
        </Card>

        <Button onClick={() => setLocation("/")} className="w-full h-14" size="lg">
          Back to Progress
        </Button>
      </div>
    </div>
  );
}
