// Live end-to-end run + screenshots against the deployed demo. Needs playwright-core and a Chromium:
//   PLAYWRIGHT_CORE=/path/to/playwright-core CHROME=/path/to/chrome node scripts/e2e-live.mjs <out-dir>
const pw = (await import(process.env.PLAYWRIGHT_CORE ?? "playwright-core")).default;
const { chromium } = pw;
import { writeFileSync } from "node:fs";
const BASE = "https://fernhill-client-portal.vercel.app";
const OUT = process.argv[2];
const log = [];
const note = (k, v) => { log.push({ at: new Date().toISOString(), step: k, result: v }); console.log(k, "=>", JSON.stringify(v)); };

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME });
async function ctx(viewport = { width: 1280, height: 860 }) {
  return browser.newContext({ viewport, deviceScaleFactor: 2, colorScheme: "light" });
}
async function demoLogin(page, who) {
  await page.goto(BASE + "/");
  const t0 = Date.now();
  await page.getByRole("button", { name: `Sign in as ${who}` }).click();
  await page.waitForURL("**/portal", { timeout: 30000 });
  await page.waitForLoadState("networkidle");
  return Date.now() - t0;
}
const shot = (page, name, full = false) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });

// 1. try-it page
let c = await ctx(); let p = await c.newPage();
await p.goto(BASE + "/"); await p.waitForLoadState("networkidle");
await shot(p, "1-try-it-demo-logins");
await c.close();

// 2. Maya: overview, security check, own file opens, other client's file id 404
c = await ctx(); p = await c.newPage();
note("maya sign-in ms", await demoLogin(p, "Maya"));
await shot(p, "2-client-overview");
await p.goto(BASE + "/portal/security"); await p.waitForLoadState("networkidle");
note("maya security check", await p.locator(".page-head .pass, .page-head .fail").innerText());
await shot(p, "3-security-check-blocked");
await p.goto(BASE + "/portal/files");
const fileLinks = await p.locator('a:has-text("Open")').evaluateAll((as) => as.map((a) => a.getAttribute("href")));
note("maya file count", fileLinks.length);
const r = await p.request.get(BASE + fileLinks[0], { maxRedirects: 0 });
note("maya open own file", { status: r.status(), redirectsToSignedStorageUrl: /\/storage\/v1\/object\/sign\/portal-client-files\//.test(r.headers()["location"] ?? "") });
const signed = await p.request.get(r.headers()["location"]);
note("signed url fetch", { status: signed.status(), type: signed.headers()["content-type"] });
await c.close();

// 3. Admin: invoices (all clients), admin page, post update, upload, mark paid
c = await ctx(); p = await c.newPage();
note("admin sign-in ms", await demoLogin(p, "Priya"));
await p.goto(BASE + "/portal/admin"); await p.waitForLoadState("networkidle");
const stamp = new Date().toISOString().slice(11, 16);
await p.locator("#status-project select").selectOption({ label: "Larkspur Bakery · Website redesign" });
await p.locator("#status-body").fill(`Catering page is live on the preview link. Please check prices and photos by Friday.`);
await p.getByRole("button", { name: "Post update" }).click();
await p.getByText("Update posted").waitFor({ timeout: 20000 });
note("admin posted update", true);
await p.locator("#upload-project select").selectOption({ label: "Harbor Lane Yoga · Class booking app" });
const pdf = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n";
await p.locator("#upload-file").setInputFiles({ name: "Class schedule draft.pdf", mimeType: "application/pdf", buffer: Buffer.from(pdf) });
await p.getByRole("button", { name: "Upload to client" }).click();
await p.getByText("Uploaded").waitFor({ timeout: 20000 });
note("admin uploaded file to Harbor Lane", true);
await shot(p, "5-admin-post-update-and-upload");
await p.goto(BASE + "/portal/invoices"); await p.waitForLoadState("networkidle");
await shot(p, "4-admin-all-invoices");
const row = p.locator("tr", { hasText: "NB-1003" });
await row.getByRole("button", { name: "Mark paid" }).click();
await row.getByText("Paid", { exact: true }).waitFor({ timeout: 20000 });
note("admin marked NB-1003 paid", true);
await c.close();

// 4. Maya sees update + payment in activity; does NOT see Harbor's upload
c = await ctx(); p = await c.newPage();
await demoLogin(p, "Maya");
await p.goto(BASE + "/portal/activity"); await p.waitForLoadState("networkidle");
const mayaLog = await p.locator(".list li").allInnerTexts();
note("maya activity has NB-1003 paid", mayaLog.some((t) => t.includes("NB-1003 marked paid")));
note("maya activity has status update", mayaLog.some((t) => t.includes("Status update on Website redesign")));
note("maya activity has Harbor upload (must be false)", mayaLog.some((t) => t.includes("Class-schedule")));
await shot(p, "6-client-activity-log");
await c.close();

// 5. Sam sees the upload, not Maya's payment
c = await ctx(); p = await c.newPage();
await demoLogin(p, "Sam");
await p.goto(BASE + "/portal/files"); await p.waitForLoadState("networkidle");
note("sam sees uploaded file", (await p.content()).includes("Class-schedule-draft.pdf"));
await p.goto(BASE + "/portal/activity");
note("sam activity has NB-1003 (must be false)", (await p.content()).includes("NB-1003"));
await c.close();

// 6. phone view, Maya invoices
c = await ctx({ width: 390, height: 844 }); p = await c.newPage();
await demoLogin(p, "Maya");
await p.goto(BASE + "/portal/invoices"); await p.waitForLoadState("networkidle");
await shot(p, "7-phone-client-invoices");
const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
note("phone horizontal overflow (must be false)", overflow);
await c.close();

// 7. dark mode check (not for portfolio)
c = await browser.newContext({ viewport: { width: 1280, height: 860 }, colorScheme: "dark" }); p = await c.newPage();
await p.goto(BASE + "/"); 
note("dark mode body background", await p.evaluate(() => getComputedStyle(document.body).backgroundColor));
await c.close();

// 8. admin reset
c = await ctx(); p = await c.newPage();
await demoLogin(p, "Priya");
await p.goto(BASE + "/portal/admin");
await p.getByRole("button", { name: "Reset demo data" }).click();
await p.waitForLoadState("networkidle"); await p.waitForTimeout(2000);
await p.goto(BASE + "/portal/invoices");
note("after reset NB-1003 open", await p.locator("tr", { hasText: "NB-1003" }).getByRole("button", { name: "Mark paid" }).count() === 1);
await c.close();

await browser.close();
writeFileSync(`${OUT}/e2e-log.json`, JSON.stringify(log, null, 2));
