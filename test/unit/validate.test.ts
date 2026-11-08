import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, checkStatusBody, checkUpload, isUuid, safeFileName, storagePath } from "@/lib/validate";

const CLIENT = "11111111-1111-4111-8111-111111111111";

describe("isUuid", () => {
  it("accepts uuids and rejects everything else", () => {
    expect(isUuid(CLIENT)).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("11111111-1111-4111-8111-11111111111")).toBe(false);
    expect(isUuid(`${CLIENT}' or 1=1`)).toBe(false);
    expect(isUuid(null)).toBe(false);
    expect(isUuid(42)).toBe(false);
  });
});

describe("checkUpload", () => {
  const pdf = { name: "a.pdf", size: 1000, type: "application/pdf" };
  it("accepts an allowed type under the limit", () => {
    expect(checkUpload(pdf)).toEqual({ ok: true, value: true });
    expect(checkUpload({ ...pdf, size: MAX_UPLOAD_BYTES })).toMatchObject({ ok: true });
  });
  it("rejects missing or empty files", () => {
    expect(checkUpload(null)).toMatchObject({ ok: false });
    expect(checkUpload({ ...pdf, size: 0 })).toMatchObject({ ok: false });
  });
  it("rejects files over 4 MB", () => {
    expect(checkUpload({ ...pdf, size: MAX_UPLOAD_BYTES + 1 })).toMatchObject({ ok: false, error: expect.stringContaining("4 MB") });
  });
  it("rejects other types", () => {
    expect(checkUpload({ ...pdf, type: "text/html" })).toMatchObject({ ok: false });
    expect(checkUpload({ ...pdf, type: "application/x-msdownload" })).toMatchObject({ ok: false });
  });
});

describe("safeFileName", () => {
  it("keeps ordinary names", () => {
    expect(safeFileName("Brand guide v2.pdf")).toBe("Brand-guide-v2.pdf");
  });
  it("strips directories, including traversal attempts", () => {
    expect(safeFileName("../../etc/passwd")).toBe("passwd");
    expect(safeFileName("C:\\Users\\x\\report.pdf")).toBe("report.pdf");
  });
  it("removes accents and odd characters", () => {
    expect(safeFileName("Café menü (final).png")).toBe("Cafe-menu-final-.png");
  });
  it("never returns an empty name", () => {
    expect(safeFileName("...")).toBe("file");
    expect(safeFileName("")).toBe("file");
  });
  it("caps the length", () => {
    expect(safeFileName("a".repeat(200) + ".pdf").length).toBeLessThanOrEqual(80);
  });
});

describe("storagePath", () => {
  it("puts the file under the client's folder, which storage RLS checks", () => {
    const p = storagePath(CLIENT, "Invoice March.pdf", "abcdef12-0000");
    expect(p).toBe(`${CLIENT}/abcdef12-Invoice-March.pdf`);
    expect(p.split("/")[0]).toBe(CLIENT);
  });
  it("cannot be steered into another folder by the file name", () => {
    const p = storagePath(CLIENT, "../22222222-2222-4222-8222-222222222222/x.pdf", "abcdef12");
    expect(p.split("/")).toHaveLength(2);
    expect(p.startsWith(`${CLIENT}/`)).toBe(true);
  });
  it("refuses a non-uuid client id", () => {
    expect(() => storagePath("../other", "a.pdf")).toThrow();
  });
});

describe("checkStatusBody", () => {
  it("trims and accepts normal text", () => {
    expect(checkStatusBody("  Shipped the homepage.  ")).toEqual({ ok: true, value: "Shipped the homepage." });
  });
  it("rejects empty, whitespace and non-strings", () => {
    expect(checkStatusBody("   ")).toMatchObject({ ok: false });
    expect(checkStatusBody(null)).toMatchObject({ ok: false });
  });
  it("rejects over 1000 characters", () => {
    expect(checkStatusBody("x".repeat(1001))).toMatchObject({ ok: false });
    expect(checkStatusBody("x".repeat(1000))).toMatchObject({ ok: true });
  });
});
