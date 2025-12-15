import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Bell, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  
  const [enabled, setEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [hasChanges, setHasChanges] = useState(false);

  const { data: settings, isLoading } = trpc.notifications.getSettings.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const updateSettings = trpc.notifications.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Notification settings saved!");
      setHasChanges(false);
    },
    onError: () => {
      toast.error("Failed to save settings");
    },
  });

  useEffect(() => {
    if (settings) {
      setEnabled(settings.enabled);
      setReminderTime(settings.reminderTime);
    }
  }, [settings]);

  if (!isAuthenticated) {
    setLocation("/");
    return null;
  }

  const handleSave = () => {
    updateSettings.mutate({ enabled, reminderTime });
  };

  const handleEnabledChange = (value: boolean) => {
    setEnabled(value);
    setHasChanges(true);
  };

  const handleTimeChange = (value: string) => {
    setReminderTime(value);
    setHasChanges(true);
  };

  return (
    <div className="min-h-screen pb-6">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="container max-w-2xl">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation("/")}
            className="mb-2 -ml-2 h-12"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Configure your daily reminders</p>
        </div>
      </div>

      <div className="container max-w-2xl py-6 space-y-6 px-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Daily Reminders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="notifications" className="text-base">Enable Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get a daily notification to complete your task
                    </p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={enabled}
                    onCheckedChange={handleEnabledChange}
                  />
                </div>

                {enabled && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor="time" className="text-base">Reminder Time</Label>
                    </div>
                    <input
                      type="time"
                      id="time"
                      value={reminderTime}
                      onChange={(e) => handleTimeChange(e.target.value)}
                      className="w-full h-14 px-4 text-lg rounded-lg border border-input bg-background"
                    />
                    <p className="text-sm text-muted-foreground">
                      You'll receive a reminder at this time if you haven't completed your daily task yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || updateSettings.isPending}
              className="w-full h-14"
              size="lg"
            >
              {updateSettings.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
