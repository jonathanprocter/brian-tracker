import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  value: string;
  options: Record<string, unknown>;
};

function createPublicContext(): { ctx: TrpcContext; setCookies: CookieCall[] } {
  const setCookies: CookieCall[] = [];

  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        setCookies.push({ name, value, options });
      },
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx, setCookies };
}

describe("passcode login", () => {
  it("rejects invalid passcode", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.passcodeLogin({ passcode: "wrongcode" })
    ).rejects.toThrow("Invalid passcode");
  });

  it("accepts Brian passcode (case insensitive)", async () => {
    const { ctx, setCookies } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.passcodeLogin({ passcode: "brian" });

    expect(result.success).toBe(true);
    expect(result.role).toBe("client");
    expect(result.name).toBe("Brian");
    expect(setCookies.length).toBeGreaterThan(0);
  });

  it("accepts BRIAN passcode uppercase", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.passcodeLogin({ passcode: "BRIAN" });

    expect(result.success).toBe(true);
    expect(result.role).toBe("client");
  });

  it("accepts 5786 passcode for admin", async () => {
    const { ctx, setCookies } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.passcodeLogin({ passcode: "5786" });

    expect(result.success).toBe(true);
    expect(result.role).toBe("admin");
    expect(result.name).toBe("5786");
    expect(setCookies.length).toBeGreaterThan(0);
  });
});
