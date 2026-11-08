import { describe, expect, it } from "vitest";
import { fileSize, invoiceState, money, projectStatusLabel, relativeTime, shortDate, sumOpen } from "@/lib/format";

describe("money", () => {
  it("formats cents as dollars", () => {
    expect(money(250000)).toBe("$2,500.00");
    expect(money(1)).toBe("$0.01");
    expect(money(0)).toBe("$0.00");
  });
});

describe("shortDate", () => {
  it("formats a date-only value without shifting the day", () => {
    expect(shortDate("2026-11-09")).toBe("Nov 9, 2026");
  });
  it("formats a timestamp in UTC", () => {
    expect(shortDate("2026-01-31T23:30:00Z")).toBe("Jan 31, 2026");
  });
  it("shows a dash for empty values", () => {
    expect(shortDate(null)).toBe("–");
    expect(shortDate(undefined)).toBe("–");
  });
});

describe("relativeTime", () => {
  const now = new Date("2026-11-09T12:00:00Z");
  it.each([
    ["2026-11-09T11:59:40Z", "just now"],
    ["2026-11-09T11:55:00Z", "5 min ago"],
    ["2026-11-09T09:00:00Z", "3 h ago"],
    ["2026-11-08T12:00:00Z", "1 day ago"],
    ["2026-11-02T12:00:00Z", "7 days ago"],
    ["2026-08-01T12:00:00Z", "Aug 1, 2026"],
  ])("%s -> %s", (iso, want) => {
    expect(relativeTime(iso, now)).toBe(want);
  });
});

describe("fileSize", () => {
  it("picks a sensible unit", () => {
    expect(fileSize(512)).toBe("512 B");
    expect(fileSize(2048)).toBe("2.0 KB");
    expect(fileSize(3.5 * 1024 * 1024)).toBe("3.5 MB");
  });
});

describe("invoiceState", () => {
  const today = new Date("2026-11-09T08:00:00Z");
  it("paid wins over a past due date", () => {
    expect(invoiceState({ status: "paid", due_date: "2026-01-01" }, today)).toBe("paid");
  });
  it("open and past due is overdue", () => {
    expect(invoiceState({ status: "open", due_date: "2026-11-08" }, today)).toBe("overdue");
  });
  it("due today is still open", () => {
    expect(invoiceState({ status: "open", due_date: "2026-11-09" }, today)).toBe("open");
  });
});

describe("sumOpen", () => {
  it("adds only unpaid invoices", () => {
    expect(sumOpen([
      { status: "paid", amount_cents: 100 },
      { status: "open", amount_cents: 250 },
      { status: "open", amount_cents: 50 },
    ])).toBe(300);
    expect(sumOpen([])).toBe(0);
  });
});

describe("projectStatusLabel", () => {
  it("maps known statuses and passes unknown ones through", () => {
    expect(projectStatusLabel("in_progress")).toBe("In progress");
    expect(projectStatusLabel("review")).toBe("Ready for review");
    expect(projectStatusLabel("weird")).toBe("weird");
  });
});
