import { drizzle } from "drizzle-orm/mysql2";
import { mysqlTable, int, varchar, text, timestamp, boolean } from "drizzle-orm/mysql-core";
import dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

// Define tables inline for seed script
const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  weekNumber: int("weekNumber").notNull(),
  taskName: varchar("taskName", { length: 255 }).notNull(),
  taskDescription: text("taskDescription").notNull(),
  questDescription: text("questDescription").notNull(),
  goalDays: int("goalDays").default(3).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  badgeIcon: varchar("badgeIcon", { length: 10 }).notNull(),
  unlockCriteria: text("unlockCriteria").notNull(),
  sortOrder: int("sortOrder").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Weekly tasks data
const tasksData = [
  {
    weekNumber: 1,
    taskName: "The Doorway Stand",
    taskDescription: "Stand in open front door for 2 minutes, look outside",
    questDescription: "Stand at the threshold between inside and outside. Feel the air. Observe the world. You're training your brain that doorways are safe.",
    goalDays: 3,
  },
  {
    weekNumber: 2,
    taskName: "The Doorway Stand",
    taskDescription: "Stand in open front door for 2 minutes, look outside",
    questDescription: "Stand at the threshold between inside and outside. Feel the air. Observe the world. You're training your brain that doorways are safe.",
    goalDays: 3,
  },
  {
    weekNumber: 3,
    taskName: "The Driveway Walk",
    taskDescription: "Walk to the end of the driveway and back",
    questDescription: "Venture beyond the door. Your driveway is your training ground. Each step is progress.",
    goalDays: 3,
  },
  {
    weekNumber: 4,
    taskName: "The Driveway Walk",
    taskDescription: "Walk to the end of the driveway and back",
    questDescription: "Venture beyond the door. Your driveway is your training ground. Each step is progress.",
    goalDays: 3,
  },
  {
    weekNumber: 5,
    taskName: "The Video Capture",
    taskDescription: "Record a 15-30 second video outside (can be of anything)",
    questDescription: "Document your outdoor experience. This is content creation training - your TikTok skills are leveling up.",
    goalDays: 3,
  },
  {
    weekNumber: 6,
    taskName: "The Video Capture",
    taskDescription: "Record a 15-30 second video outside (can be of anything)",
    questDescription: "Document your outdoor experience. This is content creation training - your TikTok skills are leveling up.",
    goalDays: 3,
  },
  {
    weekNumber: 7,
    taskName: "The Board Touch",
    taskDescription: "Go outside and touch/hold/ride skateboard (any amount)",
    questDescription: "Reconnect with your board. Even touching it counts. You're remembering who you are.",
    goalDays: 3,
  },
  {
    weekNumber: 8,
    taskName: "The Board Touch",
    taskDescription: "Go outside and touch/hold/ride skateboard (any amount)",
    questDescription: "Reconnect with your board. Even touching it counts. You're remembering who you are.",
    goalDays: 3,
  },
  {
    weekNumber: 9,
    taskName: "Your Choice",
    taskDescription: "Choose from menu: skateboard, walk around block, sit outside 10 min, record TikTok, or other outdoor activity",
    questDescription: "You've leveled up enough to choose your own quests. What outdoor activity calls to you today?",
    goalDays: 4,
  },
];

// Achievement definitions
const achievementsData = [
  {
    name: "First Step",
    description: "Complete your first task ever",
    badgeIcon: "🎯",
    unlockCriteria: "Complete 1 task",
    sortOrder: 1,
  },
  {
    name: "Week Warrior",
    description: "Complete 3+ days in a single week",
    badgeIcon: "⚔️",
    unlockCriteria: "Complete 3+ days in one week",
    sortOrder: 2,
  },
  {
    name: "Perfect Week",
    description: "Complete all 7 days in a week",
    badgeIcon: "💎",
    unlockCriteria: "Complete all 7 days in one week",
    sortOrder: 3,
  },
  {
    name: "Streak Master",
    description: "Maintain a 7-day streak",
    badgeIcon: "🔥",
    unlockCriteria: "Achieve 7-day streak",
    sortOrder: 4,
  },
  {
    name: "Anxiety Crusher",
    description: "Anxiety dropped 3+ points during a task",
    badgeIcon: "💪",
    unlockCriteria: "Reduce anxiety by 3+ points in one task",
    sortOrder: 5,
  },
  {
    name: "Extra Credit King",
    description: "Earn 5+ extra credit completions",
    badgeIcon: "👑",
    unlockCriteria: "Complete 5+ extra credit tasks",
    sortOrder: 6,
  },
  {
    name: "Level 5 Hero",
    description: "Reach Level 5",
    badgeIcon: "🌟",
    unlockCriteria: "Reach Level 5",
    sortOrder: 7,
  },
  {
    name: "Outdoor Champion",
    description: "Complete 30 total tasks",
    badgeIcon: "🏆",
    unlockCriteria: "Complete 30 tasks total",
    sortOrder: 8,
  },
  {
    name: "No Klonopin Warrior",
    description: "Complete 10 tasks without medication",
    badgeIcon: "🛡️",
    unlockCriteria: "Complete 10 tasks without Klonopin",
    sortOrder: 9,
  },
  {
    name: "Early Bird",
    description: "Complete 5 tasks before noon",
    badgeIcon: "🌅",
    unlockCriteria: "Complete 5 tasks before 12:00 PM",
    sortOrder: 10,
  },
  {
    name: "Boss Defeated",
    description: "Complete full week with anxiety trending down",
    badgeIcon: "⚡",
    unlockCriteria: "Complete week with decreasing anxiety trend",
    sortOrder: 11,
  },
  {
    name: "Comeback Kid",
    description: "Return after missing 2+ days",
    badgeIcon: "🎮",
    unlockCriteria: "Complete task after 2+ day gap",
    sortOrder: 12,
  },
];

async function seed() {
  try {
    console.log("Seeding tasks...");
    await db.insert(tasks).values(tasksData);
    console.log(`✓ Inserted ${tasksData.length} tasks`);

    console.log("Seeding achievements...");
    await db.insert(achievements).values(achievementsData);
    console.log(`✓ Inserted ${achievementsData.length} achievements`);

    console.log("✓ Seed data completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seed();
