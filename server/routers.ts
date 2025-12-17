import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "./db";

// Helper to check if user is admin
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    
    // Simple passcode login - Brian or 5786
    passcodeLogin: publicProcedure
      .input(z.object({ passcode: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { passcode } = input;
        const passcodeUpper = passcode.trim().toUpperCase();
        
        let role: 'client' | 'admin';
        let openId: string;
        let name: string;
        
        if (passcodeUpper === 'BRIAN') {
          role = 'client';
          openId = 'brian-client';
          name = 'Brian';
        } else if (passcode.trim() === '5786') {
          role = 'admin';
          openId = 'admin-5786';
          name = '5786';
        } else {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid passcode' });
        }
        
        // Upsert user in database
        await db.upsertUser({
          openId,
          name,
          role,
          lastSignedIn: new Date(),
        });
        
        // Create session token
        const { sdk } = await import("./_core/sdk");
        const token = await sdk.createSessionToken(openId, { name });
        
        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
        
        return { success: true, role, name };
      }),
  }),

  tasks: router({
    getByWeek: protectedProcedure
      .input(z.object({ weekNumber: z.number() }))
      .query(async ({ input }) => {
        return await db.getTaskByWeek(input.weekNumber);
      }),
    
    getAll: protectedProcedure.query(async () => {
      return await db.getAllTasks();
    }),
    
    getCurrentTask: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      
      return await db.getTaskByWeek(user.currentWeek);
    }),
  }),

  entries: router({
    create: protectedProcedure
      .input(z.object({
        taskId: z.number(),
        anxietyBefore: z.number().min(0).max(10),
        anxietyDuring: z.number().min(0).max(10),
        usedKlonopin: z.boolean(),
        winNote: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if already completed today
        const today = new Date();
        const existingEntry = await db.getEntryForDate(ctx.user.id, today);
        
        if (existingEntry) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'Task already completed today' 
          });
        }
        
        // Calculate XP
        let xpEarned = 50; // Base XP
        
        // No Klonopin bonus
        if (!input.usedKlonopin) {
          xpEarned += 25;
        }
        
        // Early bird bonus (before noon local time)
        // Note: This uses server time. For true local time, client should send timezone offset
        const hour = today.getHours();
        if (hour < 12) {
          xpEarned += 15;
        }
        
        // Create entry
        await db.createEntry({
          userId: ctx.user.id,
          taskId: input.taskId,
          completedAt: today,
          anxietyBefore: input.anxietyBefore,
          anxietyDuring: input.anxietyDuring,
          usedKlonopin: input.usedKlonopin,
          winNote: input.winNote,
          xpEarned,
        });
        
        // Update user stats
        const user = await db.getUserById(ctx.user.id);
        if (!user) throw new TRPCError({ code: 'NOT_FOUND' });
        
        const newTotalXp = user.totalXp + xpEarned;
        const newLevel = calculateLevel(newTotalXp);
        
        // Update streak
        const lastCompletion = user.lastCompletionDate;
        let newStreak = 1;
        
        if (lastCompletion) {
          // Normalize dates to midnight to avoid timezone issues
          const normalizeToMidnight = (date: Date) => {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            return d;
          };
          
          const todayNormalized = normalizeToMidnight(today);
          const lastCompletionNormalized = normalizeToMidnight(lastCompletion);
          const daysSinceLastCompletion = Math.round(
            (todayNormalized.getTime() - lastCompletionNormalized.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          if (daysSinceLastCompletion === 1) {
            // Consecutive day
            newStreak = user.currentStreak + 1;
          } else if (daysSinceLastCompletion === 0) {
            // Same day (shouldn't happen due to check above)
            newStreak = user.currentStreak;
          } else {
            // Streak broken
            newStreak = 1;
          }
        }
        
        const newLongestStreak = Math.max(user.longestStreak, newStreak);
        
        await db.updateUserStats(ctx.user.id, {
          totalXp: newTotalXp,
          currentLevel: newLevel,
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          lastCompletionDate: today,
        });
        
        return {
          xpEarned,
          newLevel,
          leveledUp: newLevel > user.currentLevel,
          newStreak,
          anxietyReduction: input.anxietyBefore - input.anxietyDuring,
        };
      }),
    
    getRecent: protectedProcedure
      .input(z.object({ limit: z.number().optional(), userId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        // Allow admin to query other users' entries
        const targetUserId = input.userId || ctx.user.id;
        return await db.getUserEntries(targetUserId, input.limit);
      }),
    
    getTodayEntry: protectedProcedure.query(async ({ ctx }) => {
      const today = new Date();
      return await db.getEntryForDate(ctx.user.id, today);
    }),
    
    getWeekEntries: protectedProcedure.query(async ({ ctx }) => {
      const today = new Date();
      const weekStart = new Date(today);
      const daysSinceMonday = (today.getDay() + 6) % 7; // 0 when Monday
      weekStart.setDate(today.getDate() - daysSinceMonday); // Start of week (Monday)
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
      weekEnd.setHours(23, 59, 59, 999);
      
      return await db.getEntriesForWeek(ctx.user.id, weekStart, weekEnd);
    }),
  }),

  achievements: router({
    getAll: protectedProcedure.query(async () => {
      return await db.getAllAchievements();
    }),
    
    getUserAchievements: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserAchievements(ctx.user.id);
    }),
  }),

  stats: router({
    getOverview: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: 'NOT_FOUND' });
      
      const entries = await db.getUserEntries(ctx.user.id);
      const achievements = await db.getUserAchievements(ctx.user.id);
      const allAchievements = await db.getAllAchievements();
      
      const totalDamage = entries.reduce((sum, entry) => {
        return sum + (entry.anxietyBefore - entry.anxietyDuring);
      }, 0);
      
      return {
        currentLevel: user.currentLevel,
        totalXp: user.totalXp,
        xpForNextLevel: getXpForLevel(user.currentLevel + 1),
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        totalTasks: entries.length,
        achievementsUnlocked: achievements.length,
        totalAchievements: allAchievements.length,
        totalDamageDealt: totalDamage,
      };
    }),
  }),

  admin: router({
    getUserActivity: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const user = await db.getUserById(input.userId);
        if (!user) throw new TRPCError({ code: 'NOT_FOUND' });
        
        const entries = await db.getUserEntries(input.userId, 10);
        const lastLogin = await db.getLastLogin(input.userId);
        const weekEntries = await db.getEntriesForWeek(
          input.userId,
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          new Date()
        );
        
        return {
          user,
          recentEntries: entries,
          lastLogin,
          weekCompletions: weekEntries.length,
        };
      }),
    
    getAllClients: adminProcedure.query(async () => {
      const db_instance = await db.getDb();
      if (!db_instance) return [];
      
      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      return await db_instance.select().from(users).where(eq(users.role, 'client'));
    }),
    
    // CSV Export for client data
    exportClientData: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const user = await db.getUserById(input.userId);
        if (!user) throw new TRPCError({ code: 'NOT_FOUND' });
        
        const entries = await db.getAllUserEntries(input.userId);
        const achievements = await db.getUserAchievements(input.userId);
        
        // Format entries for CSV
        const csvData = entries.map(entry => ({
          date: entry.completedAt ? new Date(entry.completedAt).toISOString().split('T')[0] : '',
          week: entry.weekNumber || 0,
          task: entry.taskName || '',
          anxietyBefore: entry.anxietyBefore,
          anxietyDuring: entry.anxietyDuring,
          anxietyReduction: entry.anxietyBefore - entry.anxietyDuring,
          usedKlonopin: entry.usedKlonopin ? 'Yes' : 'No',
          winNote: entry.winNote || '',
          xpEarned: entry.xpEarned,
        }));
        
        return {
          user: {
            name: user.name,
            currentWeek: user.currentWeek,
            currentLevel: user.currentLevel,
            totalXp: user.totalXp,
            currentStreak: user.currentStreak,
            longestStreak: user.longestStreak,
          },
          entries: csvData,
          achievementsUnlocked: achievements.length,
          totalEntries: entries.length,
        };
      }),
  }),

  notifications: router({
    // Get user's notification settings
    getSettings: protectedProcedure.query(async ({ ctx }) => {
      const settings = await db.getNotificationSettings(ctx.user.id);
      return settings || { enabled: false, reminderTime: '09:00' };
    }),
    
    // Update notification settings
    updateSettings: protectedProcedure
      .input(z.object({
        enabled: z.boolean(),
        reminderTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.upsertNotificationSettings(ctx.user.id, input);
      }),
    
    // Send test notification (for admin to test the system)
    sendTestNotification: adminProcedure.mutation(async () => {
      const { notifyOwner } = await import("./_core/notification");
      
      const success = await notifyOwner({
        title: "Brian's Progress Tracker - Test",
        content: "This is a test notification to verify the notification system is working.",
      });
      
      return { success };
    }),
    
    // Trigger daily reminder check (can be called by cron job)
    checkAndSendReminders: adminProcedure.mutation(async () => {
      const { notifyOwner } = await import("./_core/notification");
      
      // Get all users needing notification
      const usersToNotify = await db.getUsersNeedingNotification();
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      let notificationsSent = 0;
      
      for (const userSettings of usersToNotify) {
        // Check if it's time to send (within 5 minute window)
        const [targetHour, targetMinute] = userSettings.reminderTime.split(':').map(Number);
        const [currentHour, currentMinute] = currentTime.split(':').map(Number);
        
        const targetMinutes = targetHour * 60 + targetMinute;
        const currentMinutes = currentHour * 60 + currentMinute;
        
        if (Math.abs(currentMinutes - targetMinutes) <= 5) {
          // Check if already notified today
          const lastNotified = userSettings.lastNotifiedAt;
          const today = new Date().toDateString();
          
          if (!lastNotified || new Date(lastNotified).toDateString() !== today) {
            // Check if user already completed today's task
            const todayEntry = await db.getEntryForDate(userSettings.userId, new Date());
            
            if (!todayEntry) {
              // Send notification
              const success = await notifyOwner({
                title: "Daily Task Reminder",
                content: "Hey Brian! Don't forget to complete your daily task. Every step forward counts!",
              });
              
              if (success) {
                await db.updateLastNotified(userSettings.userId);
                notificationsSent++;
              }
            }
          }
        }
      }
      
      return { notificationsSent, usersChecked: usersToNotify.length };
    }),
  }),

  ai: router({
    // Generate personalized encouragement after task completion
    getCompletionMessage: protectedProcedure
      .input(z.object({
        anxietyBefore: z.number(),
        anxietyDuring: z.number(),
        usedKlonopin: z.boolean(),
        winNote: z.string().optional(),
        currentStreak: z.number(),
        taskName: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const userName = ctx.user?.name?.trim() || "Brian";
        
        const anxietyReduction = input.anxietyBefore - input.anxietyDuring;
        const context = `
${userName} just completed their daily behavioral activation task.
- Task: ${input.taskName}
- Anxiety before: ${input.anxietyBefore}/10
- Anxiety during: ${input.anxietyDuring}/10
- Anxiety reduction: ${anxietyReduction} points
- Used Klonopin: ${input.usedKlonopin ? 'Yes' : 'No'}
- Current streak: ${input.currentStreak} days
${input.winNote ? `- ${userName}'s win note: "${input.winNote}"` : ''}
`;

        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a supportive, warm coach helping ${userName} with behavioral activation for anxiety. 
Keep responses brief (2-3 sentences max), genuine, and encouraging without being over-the-top.
Focus on specific observations from his data. Be mature and calm, not childish or overly enthusiastic.
Never use excessive exclamation marks or emojis. Sound like a supportive friend, not a cheerleader.`
              },
              {
                role: "user",
                content: `Generate a brief, personalized encouragement message for ${userName} based on this completion:\n${context}`
              }
            ],
          });

          return {
            message: response.choices[0]?.message?.content || "Great work today. Every step forward counts."
          };
        } catch (error) {
          console.error("[AI] Failed to generate completion message:", error);
          const baseMessage = anxietyReduction > 0
            ? `Nice work sticking with ${input.taskName} and bringing anxiety down ${anxietyReduction} points.`
            : `You showed up for ${input.taskName} even while uncomfortable—that consistency matters.`;
          return {
            message: input.currentStreak > 1
              ? `${baseMessage} Streak: ${input.currentStreak} days. Keep that rhythm going.`
              : baseMessage
          };
        }
      }),

    // Generate weekly insights based on patterns
    getWeeklyInsights: protectedProcedure.query(async ({ ctx }) => {
      const { invokeLLM } = await import("./_core/llm");
      const user = await db.getUserById(ctx.user.id);
      const userName = user?.name?.trim() || "Brian";
      
      const entries = await db.getUserEntries(ctx.user.id, 14); // Last 2 weeks
      
      if (entries.length < 3) {
        return {
          insight: "Keep completing tasks to unlock personalized insights about your progress.",
          hasEnoughData: false
        };
      }

      const avgAnxietyBefore = entries.reduce((sum, e) => sum + e.anxietyBefore, 0) / entries.length;
      const avgAnxietyDuring = entries.reduce((sum, e) => sum + e.anxietyDuring, 0) / entries.length;
      const avgReduction = avgAnxietyBefore - avgAnxietyDuring;
      const klonopinUsage = entries.filter(e => e.usedKlonopin).length;
      const recentWins = entries.slice(0, 5).filter(e => e.winNote).map(e => e.winNote);

      const context = `
${userName}'s recent progress (last ${entries.length} entries):
- Average anxiety before tasks: ${avgAnxietyBefore.toFixed(1)}/10
- Average anxiety during tasks: ${avgAnxietyDuring.toFixed(1)}/10
- Average anxiety reduction: ${avgReduction.toFixed(1)} points
- Klonopin usage: ${klonopinUsage} out of ${entries.length} tasks
- Recent wins ${userName} noted: ${recentWins.length > 0 ? recentWins.join('; ') : 'None noted'}
`;

      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a supportive coach analyzing ${userName}'s behavioral activation progress.
Provide a brief insight (2-3 sentences) about patterns you notice.
Be specific, warm, and constructive. Focus on progress and gentle suggestions.
Don't be preachy or use clinical language. Sound like a supportive friend.`
            },
            {
              role: "user",
              content: `Generate a brief insight for ${userName} based on recent data:\n${context}`
            }
          ],
        });

        return {
          insight: response.choices[0]?.message?.content || "You're making steady progress. Keep it up.",
          hasEnoughData: true,
          stats: {
            avgAnxietyBefore: avgAnxietyBefore.toFixed(1),
            avgAnxietyDuring: avgAnxietyDuring.toFixed(1),
            avgReduction: avgReduction.toFixed(1),
            entriesCount: entries.length
          }
        };
      } catch (error) {
        console.error("[AI] Failed to generate weekly insights:", error);
        const direction = avgReduction >= 0 ? "reduction" : "change";
        return {
          insight: `Here's the snapshot: average anxiety before tasks is ${avgAnxietyBefore.toFixed(1)}/10 with an average ${direction} of ${avgReduction.toFixed(1)} points during tasks. Keep an eye on how you feel over the next few days and adjust the pace if needed.`,
          hasEnoughData: true,
          stats: {
            avgAnxietyBefore: avgAnxietyBefore.toFixed(1),
            avgAnxietyDuring: avgAnxietyDuring.toFixed(1),
            avgReduction: avgReduction.toFixed(1),
            entriesCount: entries.length
          }
        };
      }
    }),

    // Dynamic greeting and motivation for home screen
    getDynamicGreeting: protectedProcedure.query(async ({ ctx }) => {
      const { invokeLLM } = await import("./_core/llm");
      
      const user = await db.getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: 'NOT_FOUND' });
      const userName = user.name?.trim() || "Brian";
      
      const entries = await db.getUserEntries(ctx.user.id, 7);
      const todayEntry = await db.getEntryForDate(ctx.user.id, new Date());
      
      const hour = new Date().getHours();
      let timeOfDay = 'morning';
      if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
      else if (hour >= 17) timeOfDay = 'evening';
      
      const context = `
Time: ${timeOfDay}
User: ${userName}
Current streak: ${user.currentStreak} days
Longest streak: ${user.longestStreak} days
Current level: ${user.currentLevel}
Total XP: ${user.totalXp}
Tasks completed this week: ${entries.length}
Already completed today: ${todayEntry ? 'Yes' : 'No'}
Streak at risk: ${user.currentStreak > 0 && !todayEntry ? 'Yes' : 'No'}
`;

      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a supportive, warm companion helping ${userName} with daily behavioral activation.
Generate a brief, personalized greeting (1-2 sentences) based on the context.
Be genuine and specific. If his streak is at risk, gently encourage without pressure.
If he already completed today, acknowledge it warmly.
Match the time of day in your greeting. Never use excessive punctuation or emojis.
Sound like a calm, supportive friend - not a cheerleader or therapist.`
            },
            {
              role: "user",
              content: `Generate a personalized greeting for ${userName}:\n${context}`
            }
          ],
        });

        return {
          greeting: response.choices[0]?.message?.content || `Good ${timeOfDay}, ${userName}.`,
          streakAtRisk: user.currentStreak > 0 && !todayEntry,
          completedToday: !!todayEntry,
        };
      } catch (error) {
        console.error("[AI] Failed to generate dynamic greeting:", error);
        const baseGreeting = `Good ${timeOfDay}, ${userName}.`;
        const streakReminder = user.currentStreak > 0 && !todayEntry
          ? " You're on a streak—one small task today keeps it going."
          : "";
        return {
          greeting: baseGreeting + streakReminder,
          streakAtRisk: user.currentStreak > 0 && !todayEntry,
          completedToday: !!todayEntry,
        };
      }
    }),

    // Get tip of the day based on recent patterns
    getTipOfDay: protectedProcedure.query(async ({ ctx }) => {
      const { invokeLLM } = await import("./_core/llm");
      
      const entries = await db.getUserEntries(ctx.user.id, 10);
      const user = await db.getUserById(ctx.user.id);
      const userName = user?.name?.trim() || "Brian";
      
      if (entries.length < 2) {
        return {
          tip: "Start with small steps. Even a brief moment outside counts as progress.",
          category: "getting-started"
        };
      }

      const avgAnxietyBefore = entries.reduce((sum, e) => sum + e.anxietyBefore, 0) / entries.length;
      const avgAnxietyDuring = entries.reduce((sum, e) => sum + e.anxietyDuring, 0) / entries.length;
      const avgReduction = avgAnxietyBefore - avgAnxietyDuring;
      const klonopinRate = entries.filter(e => e.usedKlonopin).length / entries.length;
      const recentTrend = entries.length >= 3 ? 
        (entries[0].anxietyDuring - entries[entries.length - 1].anxietyDuring) : 0;

      const context = `
${userName}'s patterns:
- Average anxiety before: ${avgAnxietyBefore.toFixed(1)}/10
- Average anxiety during: ${avgAnxietyDuring.toFixed(1)}/10
- Klonopin usage rate: ${(klonopinRate * 100).toFixed(0)}%
- Recent trend: ${recentTrend > 0 ? 'Anxiety increasing' : recentTrend < 0 ? 'Anxiety decreasing' : 'Stable'}
- Current streak: ${user?.currentStreak || 0} days
- Total tasks completed: ${entries.length}
`;

      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a supportive coach providing a daily tip for ${userName}'s behavioral activation journey.
Generate ONE brief, actionable tip (1-2 sentences) based on his patterns.
Be specific and practical. If anxiety is high, suggest grounding techniques.
If Klonopin use is frequent, gently encourage trying without when ready.
If he's doing well, reinforce what's working. Never be preachy.`
            },
            {
              role: "user",
              content: `Generate a personalized tip for ${userName}:\n${context}`
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "daily_tip",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  tip: { type: "string", description: "The actionable tip" },
                  category: { 
                    type: "string", 
                    enum: ["anxiety-management", "motivation", "progress", "technique", "celebration"],
                    description: "Category of the tip"
                  }
                },
                required: ["tip", "category"],
                additionalProperties: false
              }
            }
          }
        });

        const content = response.choices[0]?.message?.content;
        const contentStr = typeof content === 'string' ? content : JSON.stringify(content) || '{}';
        const parsed = JSON.parse(contentStr);
        return {
          tip: parsed.tip || "Take it one step at a time. You're doing great.",
          category: parsed.category || "motivation"
        };
      } catch (error) {
        console.error("[AI] Failed to generate tip of the day:", error);
        return {
          tip: `Remember: the goal isn't perfection, it's progress. A ${avgReduction.toFixed(1)} point change in anxiety is still movement.`,
          category: "motivation"
        };
      }
    }),

    // Generate summary for admin/therapist
    getClientSummary: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        
        const user = await db.getUserById(input.userId);
        if (!user) throw new TRPCError({ code: 'NOT_FOUND' });
        const clientName = user.name?.trim() || "Brian";
        
        const entries = await db.getUserEntries(input.userId, 14);
        
        if (entries.length < 2) {
          return {
            summary: `Not enough data yet for AI analysis. ${clientName} needs to complete more tasks.`,
            concerns: [],
            positives: []
          };
        }

        const avgAnxietyBefore = entries.reduce((sum, e) => sum + e.anxietyBefore, 0) / entries.length;
        const avgAnxietyDuring = entries.reduce((sum, e) => sum + e.anxietyDuring, 0) / entries.length;
        const klonopinRate = (entries.filter(e => e.usedKlonopin).length / entries.length * 100).toFixed(0);
        const recentWins = entries.filter(e => e.winNote).map(e => e.winNote);

        const context = `
Client: ${clientName}
Recent activity (${entries.length} entries over last 2 weeks):
- Current streak: ${user.currentStreak} days
- Longest streak: ${user.longestStreak} days
- Current level: ${user.currentLevel}
- Average anxiety before: ${avgAnxietyBefore.toFixed(1)}/10
- Average anxiety during: ${avgAnxietyDuring.toFixed(1)}/10
- Klonopin usage rate: ${klonopinRate}%
- Recent self-reported wins: ${recentWins.length > 0 ? recentWins.join('; ') : 'None'}
`;

        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are an AI assistant helping a therapist monitor a client's behavioral activation progress.
Provide a concise clinical summary (3-4 sentences) highlighting key patterns, concerns, and positives.
Be objective and professional. Flag any concerning patterns (high anxiety, increased Klonopin use, breaks in streaks).
Also note positive trends (consistent engagement, anxiety reduction, self-reported wins).`
              },
              {
                role: "user",
                content: `Generate a clinical summary for the therapist:\n${context}`
              }
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "clinical_summary",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    summary: { type: "string", description: "Brief clinical summary" },
                    concerns: { 
                      type: "array", 
                      items: { type: "string" },
                      description: "List of concerns to monitor"
                    },
                    positives: { 
                      type: "array", 
                      items: { type: "string" },
                      description: "List of positive observations"
                    }
                  },
                  required: ["summary", "concerns", "positives"],
                  additionalProperties: false
                }
              }
            }
          });

          const content = response.choices[0]?.message?.content;
          const contentStr = typeof content === 'string' ? content : JSON.stringify(content) || '{}';
          const parsed = JSON.parse(contentStr);
          return {
            summary: parsed.summary || "Unable to generate summary.",
            concerns: parsed.concerns || [],
            positives: parsed.positives || []
          };
        } catch (error) {
          console.error("[AI] Failed to generate client summary:", error);
          return {
            summary: `${clientName} has logged ${entries.length} entries in the last two weeks. Average anxiety went from ${avgAnxietyBefore.toFixed(1)}/10 before tasks to ${avgAnxietyDuring.toFixed(1)}/10 during tasks. ${klonopinRate}% of tasks included Klonopin. Keep monitoring streak durability (${user.currentStreak} current, ${user.longestStreak} max).`,
            concerns: klonopinRate && parseInt(klonopinRate, 10) > 50 ? ["Frequent Klonopin use—consider exploring strategies to reduce reliance."] : [],
            positives: recentWins.length > 0 ? recentWins.slice(0, 3) : []
          };
        }
      }),
  }),

  // Activity tracking for engagement monitoring
  activity: router({
    // Log an activity event
    logEvent: protectedProcedure
      .input(z.object({
        actionType: z.enum([
          'login', 'logout', 'page_view', 'task_started', 'task_completed',
          'settings_viewed', 'stats_viewed', 'achievements_viewed', 'session_start', 'session_end'
        ]),
        pagePath: z.string().optional(),
        sessionId: z.string().optional(),
        sessionDuration: z.number().optional(),
        metadata: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Extract IP and user agent from request
        const ipAddress = ctx.req.headers['x-forwarded-for']?.toString().split(',')[0] ||
                         ctx.req.headers['x-real-ip']?.toString() ||
                         ctx.req.socket?.remoteAddress || null;
        const userAgent = ctx.req.headers['user-agent'] || null;
        
        // Parse user agent for device info
        let deviceType = 'desktop';
        let browser = 'Unknown';
        let os = 'Unknown';
        
        if (userAgent) {
          // Device type detection
          if (/mobile/i.test(userAgent)) deviceType = 'mobile';
          else if (/tablet|ipad/i.test(userAgent)) deviceType = 'tablet';
          
          // Browser detection
          if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) browser = 'Chrome';
          else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
          else if (/firefox/i.test(userAgent)) browser = 'Firefox';
          else if (/edge/i.test(userAgent)) browser = 'Edge';
          
          // OS detection
          if (/iphone|ipad/i.test(userAgent)) os = 'iOS';
          else if (/android/i.test(userAgent)) os = 'Android';
          else if (/mac/i.test(userAgent)) os = 'macOS';
          else if (/windows/i.test(userAgent)) os = 'Windows';
          else if (/linux/i.test(userAgent)) os = 'Linux';
        }
        
        await db.logActivity({
          userId: ctx.user.id,
          actionType: input.actionType,
          pagePath: input.pagePath || null,
          ipAddress,
          userAgent,
          deviceType,
          browser,
          os,
          sessionId: input.sessionId || null,
          sessionDuration: input.sessionDuration || null,
          metadata: input.metadata || null,
        });
        
        return { success: true };
      }),

    // Get activity logs for a user (admin only)
    getLogs: adminProcedure
      .input(z.object({ userId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getActivityLogs(input.userId, input.limit || 50);
      }),

    // Get engagement metrics for a user (admin only)
    getEngagement: adminProcedure
      .input(z.object({ userId: z.number(), days: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getEngagementMetrics(input.userId, input.days || 30);
      }),

    // Get activity timeline for charts (admin only)
    getTimeline: adminProcedure
      .input(z.object({ userId: z.number(), days: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getActivityTimeline(input.userId, input.days || 7);
      }),
  }),
});

// Helper function to calculate level from XP
function calculateLevel(xp: number): number {
  let level = 1;
  let xpNeeded = 100;
  let totalXpForLevel = 0;
  
  while (xp >= totalXpForLevel + xpNeeded) {
    totalXpForLevel += xpNeeded;
    level++;
    xpNeeded = getXpForLevel(level);
  }
  
  return level;
}

// Helper function to get XP needed for a specific level
function getXpForLevel(level: number): number {
  // Progressive XP requirements
  // Level 1: 100, Level 2: 250, Level 3: 450, etc.
  return 100 + (level - 1) * 150;
}

export type AppRouter = typeof appRouter;
