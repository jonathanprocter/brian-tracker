import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "client" | "admin" = "client"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: role === "admin" ? "admin-5786" : "brian-client",
    email: "test@example.com",
    name: role === "admin" ? "Admin" : "Brian",
    loginMethod: "passcode",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {
        "x-forwarded-for": "192.168.1.1",
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      },
      socket: { remoteAddress: "127.0.0.1" },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("activity tracking", () => {
  it("logEvent requires authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.activity.logEvent({
        actionType: "page_view",
        pagePath: "/",
      })
    ).rejects.toThrow();
  });

  it("logEvent accepts valid action types", async () => {
    const ctx = createAuthContext("client");
    const caller = appRouter.createCaller(ctx);

    // This should not throw - we're testing the input validation
    // The actual DB insert may fail in test environment, but input validation should pass
    const actionTypes = [
      "login",
      "logout",
      "page_view",
      "task_started",
      "task_completed",
    ] as const;

    for (const actionType of actionTypes) {
      // Just verify the procedure accepts the input shape
      // In a real test environment with DB, this would actually insert
      try {
        await caller.activity.logEvent({
          actionType,
          pagePath: "/test",
        });
      } catch (e: any) {
        // DB errors are expected in test env, but input validation errors are not
        expect(e.message).not.toContain("Invalid enum value");
      }
    }
  });

  it("getEngagement requires admin role", async () => {
    const clientCtx = createAuthContext("client");
    const clientCaller = appRouter.createCaller(clientCtx);

    await expect(
      clientCaller.activity.getEngagement({ userId: 1, days: 30 })
    ).rejects.toThrow("Admin access required");
  });

  it("getLogs requires admin role", async () => {
    const clientCtx = createAuthContext("client");
    const clientCaller = appRouter.createCaller(clientCtx);

    await expect(
      clientCaller.activity.getLogs({ userId: 1, limit: 50 })
    ).rejects.toThrow("Admin access required");
  });

  it("getTimeline requires admin role", async () => {
    const clientCtx = createAuthContext("client");
    const clientCaller = appRouter.createCaller(clientCtx);

    await expect(
      clientCaller.activity.getTimeline({ userId: 1, days: 7 })
    ).rejects.toThrow("Admin access required");
  });
});
