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
        
        // Early bird bonus (before noon)
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
          const daysSinceLastCompletion = Math.floor(
            (today.getTime() - lastCompletion.getTime()) / (1000 * 60 * 60 * 24)
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
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getUserEntries(ctx.user.id, input.limit);
      }),
    
    getTodayEntry: protectedProcedure.query(async ({ ctx }) => {
      const today = new Date();
      return await db.getEntryForDate(ctx.user.id, today);
    }),
    
    getWeekEntries: protectedProcedure.query(async ({ ctx }) => {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
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
