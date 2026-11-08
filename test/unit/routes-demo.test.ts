import { describe, expect, it } from "vitest";
import { DEMO_ACCOUNTS, demoAccount } from "@/lib/demo";
import { isProtectedPath, safeNext } from "@/lib/routes";
import { CLIENT, otherClient } from "@/lib/seed-ids";

describe("isProtectedPath", () => {
  it("guards /portal and everything under it", () => {
    expect(isProtectedPath("/portal")).toBe(true);
    expect(isProtectedPath("/portal/invoices")).toBe(true);
  });
  it("leaves public pages alone", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/login")).toBe(false);
    expect(isProtectedPath("/portalx")).toBe(false);
  });
});

describe("safeNext", () => {
  it("allows portal paths", () => {
    expect(safeNext("/portal/files")).toBe("/portal/files");
    expect(safeNext("/portal/files?x=1")).toBe("/portal/files?x=1");
  });
  it("blocks open redirects and odd targets", () => {
    expect(safeNext("https://evil.example")).toBe("/portal");
    expect(safeNext("//evil.example")).toBe("/portal");
    expect(safeNext("/\\evil.example")).toBe("/portal");
    expect(safeNext("/login")).toBe("/portal");
    expect(safeNext("")).toBe("/portal");
    expect(safeNext(null)).toBe("/portal");
  });
});

describe("demo accounts", () => {
  it("has two clients and one admin, all on a non-routable .test domain", () => {
    expect(DEMO_ACCOUNTS.filter((a) => a.role === "client")).toHaveLength(2);
    expect(DEMO_ACCOUNTS.filter((a) => a.role === "admin")).toHaveLength(1);
    for (const a of DEMO_ACCOUNTS) expect(a.email.endsWith(".test")).toBe(true);
  });
  it("looks up by key", () => {
    expect(demoAccount("admin")?.role).toBe("admin");
    expect(demoAccount("nope")).toBeUndefined();
  });
});

describe("otherClient", () => {
  it("points each client at the other one", () => {
    expect(otherClient(CLIENT.larkspur)).toBe("harbor");
    expect(otherClient(CLIENT.harbor)).toBe("larkspur");
  });
});
