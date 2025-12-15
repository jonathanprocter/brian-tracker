import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(overrides?: Partial<AuthenticatedUser>): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-brian",
    email: "brian@example.com",
    name: "Brian Kolsch",
    loginMethod: "manus",
    role: "client",
    currentWeek: 1,
    totalXp: 0,
    currentLevel: 1,
    currentStreak: 0,
    longestStreak: 0,
    lastCompletionDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

function createAdminContext(): { ctx: TrpcContext } {
  return createAuthContext({
    id: 2,
    openId: "test-admin-jonathan",
    name: "Jonathan Procter",
    role: "admin",
  });
}

describe("tasks router", () => {
  it("getAll returns tasks from database", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const tasks = await caller.tasks.getAll();
    
    expect(tasks).toBeDefined();
    expect(Array.isArray(tasks)).toBe(true);
    // Should have seeded tasks
    expect(tasks.length).toBeGreaterThan(0);
  });

  it("getByWeek returns task for specific week", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const task = await caller.tasks.getByWeek({ weekNumber: 1 });
    
    expect(task).toBeDefined();
    expect(task?.weekNumber).toBe(1);
    expect(task?.taskName).toBe("The Doorway Stand");
  });
});

describe("achievements router", () => {
  it("getAll returns all achievement definitions", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const achievements = await caller.achievements.getAll();
    
    expect(achievements).toBeDefined();
    expect(Array.isArray(achievements)).toBe(true);
    expect(achievements.length).toBe(12); // 12 achievements defined
  });

  it("getUserAchievements returns empty array for new user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const userAchievements = await caller.achievements.getUserAchievements();
    
    expect(userAchievements).toBeDefined();
    expect(Array.isArray(userAchievements)).toBe(true);
  });
});

describe("stats router", () => {
  it("getOverview returns user stats", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const stats = await caller.stats.getOverview();
    
    expect(stats).toBeDefined();
    expect(stats.currentLevel).toBeDefined();
    expect(stats.totalXp).toBeDefined();
    expect(stats.currentStreak).toBeDefined();
    expect(stats.longestStreak).toBeDefined();
    expect(stats.totalTasks).toBeDefined();
    expect(stats.achievementsUnlocked).toBeDefined();
    expect(stats.totalAchievements).toBeDefined();
    expect(stats.totalDamageDealt).toBeDefined();
  });
});

describe("admin router", () => {
  it("getAllClients requires admin role", async () => {
    const { ctx } = createAuthContext(); // Regular client user
    const caller = appRouter.createCaller(ctx);
    
    await expect(caller.admin.getAllClients()).rejects.toThrow("Admin access required");
  });

  it("getAllClients works for admin user", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    
    const clients = await caller.admin.getAllClients();
    
    expect(clients).toBeDefined();
    expect(Array.isArray(clients)).toBe(true);
  });
});
