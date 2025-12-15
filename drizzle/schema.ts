import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with gamification fields for Brian's tracker.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["client", "admin"]).default("client").notNull(),
  
  // Gamification fields
  currentWeek: int("currentWeek").default(1).notNull(),
  totalXp: int("totalXp").default(0).notNull(),
  currentLevel: int("currentLevel").default(1).notNull(),
  currentStreak: int("currentStreak").default(0).notNull(),
  longestStreak: int("longestStreak").default(0).notNull(),
  lastCompletionDate: timestamp("lastCompletionDate"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Weekly tasks in the behavioral activation protocol
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  weekNumber: int("weekNumber").notNull(),
  taskName: varchar("taskName", { length: 255 }).notNull(),
  taskDescription: text("taskDescription").notNull(),
  questDescription: text("questDescription").notNull(),
  goalDays: int("goalDays").default(3).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Daily task completion entries with anxiety tracking
 */
export const entries = mysqlTable("entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  taskId: int("taskId").notNull(),
  completedAt: timestamp("completedAt").notNull(),
  anxietyBefore: int("anxietyBefore").notNull(), // 0-10 scale
  anxietyDuring: int("anxietyDuring").notNull(), // 0-10 scale
  usedKlonopin: boolean("usedKlonopin").default(false).notNull(),
  winNote: text("winNote"),
  xpEarned: int("xpEarned").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Entry = typeof entries.$inferSelect;
export type InsertEntry = typeof entries.$inferInsert;

/**
 * Achievement badge definitions
 */
export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  badgeIcon: varchar("badgeIcon", { length: 10 }).notNull(), // emoji
  unlockCriteria: text("unlockCriteria").notNull(),
  sortOrder: int("sortOrder").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;

/**
 * User achievement unlocks
 */
export const userAchievements = mysqlTable("userAchievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  achievementId: int("achievementId").notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
});

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

/**
 * Login activity tracking for admin monitoring
 */
export const loginActivity = mysqlTable("loginActivity", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  loggedInAt: timestamp("loggedInAt").defaultNow().notNull(),
  deviceInfo: text("deviceInfo"),
});

export type LoginActivity = typeof loginActivity.$inferSelect;
export type InsertLoginActivity = typeof loginActivity.$inferInsert;
