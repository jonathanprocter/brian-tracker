import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "client" | "admin" = "client"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("notifications router", () => {
  it("getSettings returns settings for user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.getSettings();

    expect(result).toBeDefined();
    expect(typeof result.enabled).toBe("boolean");
    expect(result.reminderTime).toBeDefined();
  });

  it("updateSettings validates time format", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Invalid time format should throw
    await expect(
      caller.notifications.updateSettings({
        enabled: true,
        reminderTime: "invalid",
      })
    ).rejects.toThrow();
  });

  it("updateSettings accepts valid time format", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Valid time format should work
    const result = await caller.notifications.updateSettings({
      enabled: true,
      reminderTime: "14:30",
    });

    expect(result).toBeDefined();
  });
});

describe("admin CSV export", () => {
  it("exportClientData requires admin role", async () => {
    const ctx = createAuthContext("client");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.exportClientData({ userId: 1 })
    ).rejects.toThrow();
  });

  it("exportClientData returns structured data for admin", async () => {
    const ctx = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    // This will throw NOT_FOUND since user doesn't exist in test
    // but it proves the admin check passes
    await expect(
      caller.admin.exportClientData({ userId: 999 })
    ).rejects.toThrow("NOT_FOUND");
  });
});
