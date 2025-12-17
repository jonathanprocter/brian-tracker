import { eq, desc, and, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  tasks, 
  entries, 
  achievements, 
  userAchievements, 
  loginActivity,
  notificationSettings,
  activityLogs,
  InsertEntry,
  InsertUserAchievement,
  InsertLoginActivity,
  InsertNotificationSettings,
  InsertActivityLog
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Task queries
export async function getTaskByWeek(weekNumber: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(tasks).where(eq(tasks.weekNumber, weekNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllTasks() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(tasks);
}

// Entry queries
export async function createEntry(entry: InsertEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(entries).values(entry);
  return result;
}

export async function getUserEntries(userId: number, limit?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const baseQuery = db.select().from(entries).where(eq(entries.userId, userId)).orderBy(desc(entries.completedAt));
  
  return limit ? await baseQuery.limit(limit) : await baseQuery;
}

export async function getEntriesForWeek(userId: number, weekStart: Date, weekEnd: Date) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(entries)
    .where(
      and(
        eq(entries.userId, userId),
        gte(entries.completedAt, weekStart),
        sql`${entries.completedAt} <= ${weekEnd}`
      )
    )
    .orderBy(desc(entries.completedAt));
}

export async function getEntryForDate(userId: number, date: Date) {
  const db = await getDb();
  if (!db) return undefined;
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const result = await db.select().from(entries)
    .where(
      and(
        eq(entries.userId, userId),
        gte(entries.completedAt, startOfDay),
        sql`${entries.completedAt} <= ${endOfDay}`
      )
    )
    .limit(1);
    
  return result.length > 0 ? result[0] : undefined;
}

// User stats queries
export async function updateUserStats(userId: number, updates: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set(updates).where(eq(users.id, userId));
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Achievement queries
export async function getAllAchievements() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(achievements).orderBy(achievements.sortOrder);
}

export async function getUserAchievements(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
    id: userAchievements.id,
    achievementId: userAchievements.achievementId,
    unlockedAt: userAchievements.unlockedAt,
    name: achievements.name,
    description: achievements.description,
    badgeIcon: achievements.badgeIcon,
    unlockCriteria: achievements.unlockCriteria,
  })
  .from(userAchievements)
  .leftJoin(achievements, eq(userAchievements.achievementId, achievements.id))
  .where(eq(userAchievements.userId, userId))
  .orderBy(desc(userAchievements.unlockedAt));
}

export async function unlockAchievement(data: InsertUserAchievement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if already unlocked
  const existing = await db.select()
    .from(userAchievements)
    .where(
      and(
        eq(userAchievements.userId, data.userId),
        eq(userAchievements.achievementId, data.achievementId)
      )
    )
    .limit(1);
    
  if (existing.length > 0) {
    return null; // Already unlocked
  }
  
  await db.insert(userAchievements).values(data);
  return data;
}

// Login activity queries
export async function logLogin(data: InsertLoginActivity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(loginActivity).values(data);
}

export async function getLoginActivity(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(loginActivity)
    .where(eq(loginActivity.userId, userId))
    .orderBy(desc(loginActivity.loggedInAt))
    .limit(limit);
}

export async function getLastLogin(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(loginActivity)
    .where(eq(loginActivity.userId, userId))
    .orderBy(desc(loginActivity.loggedInAt))
    .limit(1);
    
  return result.length > 0 ? result[0] : undefined;
}

// Notification settings queries
export async function getNotificationSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select()
    .from(notificationSettings)
    .where(eq(notificationSettings.userId, userId))
    .limit(1);
    
  return result.length > 0 ? result[0] : null;
}

export async function upsertNotificationSettings(userId: number, settings: { enabled: boolean; reminderTime: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await getNotificationSettings(userId);
  
  if (existing) {
    await db.update(notificationSettings)
      .set({ enabled: settings.enabled, reminderTime: settings.reminderTime })
      .where(eq(notificationSettings.userId, userId));
  } else {
    await db.insert(notificationSettings).values({
      userId,
      enabled: settings.enabled,
      reminderTime: settings.reminderTime,
    });
  }
  
  return await getNotificationSettings(userId);
}

export async function updateLastNotified(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(notificationSettings)
    .set({ lastNotifiedAt: new Date() })
    .where(eq(notificationSettings.userId, userId));
}

export async function getUsersNeedingNotification() {
  const db = await getDb();
  if (!db) return [];
  
  // Get all users with enabled notifications
  const settings = await db.select({
    userId: notificationSettings.userId,
    reminderTime: notificationSettings.reminderTime,
    lastNotifiedAt: notificationSettings.lastNotifiedAt,
  })
  .from(notificationSettings)
  .where(eq(notificationSettings.enabled, true));
  
  return settings;
}

// Export all entries for CSV
export async function getAllUserEntries(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
    id: entries.id,
    completedAt: entries.completedAt,
    anxietyBefore: entries.anxietyBefore,
    anxietyDuring: entries.anxietyDuring,
    usedKlonopin: entries.usedKlonopin,
    winNote: entries.winNote,
    xpEarned: entries.xpEarned,
    taskName: tasks.taskName,
    weekNumber: tasks.weekNumber,
  })
  .from(entries)
  .leftJoin(tasks, eq(entries.taskId, tasks.id))
  .where(eq(entries.userId, userId))
  .orderBy(desc(entries.completedAt));
}


// Comprehensive activity logging
export async function logActivity(data: InsertActivityLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(activityLogs).values(data);
}

export async function getActivityLogs(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(activityLogs)
    .where(eq(activityLogs.userId, userId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);
}

export async function getActivityLogsByType(userId: number, actionType: string, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(activityLogs)
    .where(and(
      eq(activityLogs.userId, userId),
      eq(activityLogs.actionType, actionType as any)
    ))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);
}

export async function getEngagementMetrics(userId: number, days: number = 30) {
  const db = await getDb();
  if (!db) return null;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Get all activity in the period
  const activities = await db.select()
    .from(activityLogs)
    .where(and(
      eq(activityLogs.userId, userId),
      gte(activityLogs.createdAt, startDate)
    ))
    .orderBy(desc(activityLogs.createdAt));
  
  // Calculate metrics
  const loginCount = activities.filter(a => a.actionType === 'login').length;
  const taskCompletions = activities.filter(a => a.actionType === 'task_completed').length;
  const pageViews = activities.filter(a => a.actionType === 'page_view').length;
  const uniqueDays = new Set(activities.map(a => 
    new Date(a.createdAt).toISOString().split('T')[0]
  )).size;
  
  // Calculate average session duration from session_end events
  const sessionEnds = activities.filter(a => a.actionType === 'session_end' && a.sessionDuration);
  const avgSessionDuration = sessionEnds.length > 0 
    ? sessionEnds.reduce((sum, s) => sum + (s.sessionDuration || 0), 0) / sessionEnds.length 
    : 0;
  
  // Time of day analysis
  const hourCounts: Record<number, number> = {};
  activities.forEach(a => {
    const hour = new Date(a.createdAt).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  
  // Device breakdown
  const deviceCounts: Record<string, number> = {};
  activities.forEach(a => {
    if (a.deviceType) {
      deviceCounts[a.deviceType] = (deviceCounts[a.deviceType] || 0) + 1;
    }
  });
  
  // Calculate engagement score (0-100)
  // Based on: login frequency, task completion rate, session duration, consistency
  const maxLogins = days; // Max 1 login per day
  const loginScore = Math.min((loginCount / maxLogins) * 25, 25);
  const taskScore = Math.min((taskCompletions / days) * 25, 25);
  const consistencyScore = Math.min((uniqueDays / days) * 25, 25);
  const sessionScore = Math.min((avgSessionDuration / 300) * 25, 25); // 5 min = max
  const engagementScore = Math.round(loginScore + taskScore + consistencyScore + sessionScore);
  
  return {
    period: days,
    totalActivities: activities.length,
    loginCount,
    taskCompletions,
    pageViews,
    uniqueDays,
    avgSessionDuration: Math.round(avgSessionDuration),
    peakHour: peakHour ? parseInt(peakHour) : null,
    deviceBreakdown: deviceCounts,
    engagementScore,
    recentActivity: activities.slice(0, 10),
  };
}

export async function getActivityTimeline(userId: number, days: number = 7) {
  const db = await getDb();
  if (!db) return [];
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const activities = await db.select()
    .from(activityLogs)
    .where(and(
      eq(activityLogs.userId, userId),
      gte(activityLogs.createdAt, startDate)
    ))
    .orderBy(desc(activityLogs.createdAt));
  
  // Group by day
  const timeline: Record<string, { date: string; activities: number; logins: number; tasks: number }> = {};
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    timeline[dateStr] = { date: dateStr, activities: 0, logins: 0, tasks: 0 };
  }
  
  activities.forEach(a => {
    const dateStr = new Date(a.createdAt).toISOString().split('T')[0];
    if (timeline[dateStr]) {
      timeline[dateStr].activities++;
      if (a.actionType === 'login') timeline[dateStr].logins++;
      if (a.actionType === 'task_completed') timeline[dateStr].tasks++;
    }
  });
  
  return Object.values(timeline).sort((a, b) => a.date.localeCompare(b.date));
}
