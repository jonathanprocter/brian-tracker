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
  InsertEntry,
  InsertUserAchievement,
  InsertLoginActivity
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
  
  let query = db.select().from(entries).where(eq(entries.userId, userId)).orderBy(desc(entries.completedAt));
  
  if (limit) {
    query = query.limit(limit) as any;
  }
  
  return await query;
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
