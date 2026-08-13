import { chromium } from "playwright";
import fs from "fs";

// Ensure output directories exist
const outputDirs = [
  "screenshots/admin",
  "screenshots/doctor",
  "screenshots/lab",
  "screenshots/pharmacist",
  "screenshots/receptionist",
];

outputDirs.forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
});

const createdScreenshots = [];
const BASE_URL = "http://localhost:5173";

function waitForEnter() {
  return new Promise((resolve) => {
    process.stdin.resume();
    process.stdin.once("data", () => {
      resolve();
    });
  });
}

async function capturePage(page, title, screenshotPath) {
  console.log(`Capturing:\n${title}...\n`);

  // Wait for dynamic React rendering, API calls, charts, and images to settle
  await page.waitForTimeout(2000);

  // 1. Reset any previously applied fullpage style overrides so we can measure the clean container
  await page.evaluate(() => {
    const oldStyle = document.getElementById("playwright-fullpage-styles");
    if (oldStyle) oldStyle.remove();

    const elements = Array.from(document.querySelectorAll("*"));
    elements.forEach((el) => {
      if (el._origStyleHeight !== undefined) {
        el.style.height = el._origStyleHeight;
        el.style.maxHeight = el._origStyleMaxHeight;
        el.style.minHeight = el._origStyleMinHeight;
        el.style.overflow = el._origStyleOverflow;
        el.style.overflowY = el._origStyleOverflowY;
      }
    });
  });

  // 2. Detect internal scrollable container
  const scrollInfo = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll("*"));
    const candidates = elements
      .map((el) => {
        const style = window.getComputedStyle(el);
        return {
          tag: el.tagName.toLowerCase(),
          className: typeof el.className === "string" ? el.className.trim() : "",
          clientHeight: el.clientHeight,
          scrollHeight: el.scrollHeight,
          overflowY: style.overflowY,
        };
      })
      .filter(
        (item) =>
          item.scrollHeight > item.clientHeight + 50 &&
          ["auto", "scroll"].includes(item.overflowY)
      )
      .sort(
        (a, b) =>
          (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight)
      );

    return candidates;
  });

  if (scrollInfo.length > 0) {
    const mainContainer = scrollInfo[0];
    const selectorDisplay = mainContainer.className ? `.${mainContainer.className.split(/\s+/).join(".")}` : `<${mainContainer.tag}>`;
    console.log("Detected scroll container:");
    console.log(selectorDisplay);
    console.log(`clientHeight: ${mainContainer.clientHeight}`);
    console.log(`scrollHeight: ${mainContainer.scrollHeight}`);
    console.log(`overflowY: ${mainContainer.overflowY}\n`);
  } else {
    console.log("No internal scroll container detected (using document scroll).\n");
  }

  // 3. Temporarily expand layout CSS for full-page capture
  await page.addStyleTag({
    id: "playwright-fullpage-styles",
    content: `
      html, body {
        height: auto !important;
        min-height: 0 !important;
        overflow: visible !important;
      }
      .superadmin-root, .sad-root, .lab-root, #root {
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: visible !important;
      }
      .superadmin-main, .sad-main, .lab-main {
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: visible !important;
      }
      .superadmin-body, .sad-body, .lab-body {
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: visible !important;
      }
    `,
  });

  // 4. Inline expand the primary scroll container if present
  await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll("*"));
    const candidates = elements
      .filter((el) => {
        const style = window.getComputedStyle(el);
        return (
          el.scrollHeight > el.clientHeight + 50 &&
          ["auto", "scroll"].includes(style.overflowY)
        );
      })
      .sort(
        (a, b) =>
          (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight)
      );

    if (candidates.length > 0) {
      const mainScroller = candidates[0];

      mainScroller._origStyleHeight = mainScroller.style.height;
      mainScroller._origStyleMaxHeight = mainScroller.style.maxHeight;
      mainScroller._origStyleMinHeight = mainScroller.style.minHeight;
      mainScroller._origStyleOverflow = mainScroller.style.overflow;
      mainScroller._origStyleOverflowY = mainScroller.style.overflowY;

      const sHeight = mainScroller.scrollHeight;
      mainScroller.style.setProperty("height", `${sHeight}px`, "important");
      mainScroller.style.setProperty("max-height", "none", "important");
      mainScroller.style.setProperty("min-height", `${sHeight}px`, "important");
      mainScroller.style.setProperty("overflow", "visible", "important");
      mainScroller.style.setProperty("overflow-y", "visible", "important");
    }
  });

  await page.waitForTimeout(500);

  // 5. Take fullPage screenshot
  console.log(`Saving:\n${screenshotPath}\n`);
  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });

  createdScreenshots.push(screenshotPath);
  console.log("✓ Saved\n");
}

async function safeClickNav(page, targetText, parentText = null) {
  if (parentText) {
    const parent = page.locator("aside button, nav button, aside div, nav div").filter({ hasText: new RegExp(parentText, "i") }).first();
    if (await parent.isVisible().catch(() => false)) {
      await parent.click();
      await page.waitForTimeout(400);
    }
  }

  const target = page.locator("aside button, nav button, aside a, nav a, aside div, nav div").filter({ hasText: new RegExp(`^${targetText}$`, "i") }).first();
  if (await target.isVisible().catch(() => false)) {
    await target.click();
  } else {
    await page.locator(`text="${targetText}"`).first().click();
  }
  await page.waitForTimeout(1000);
}

async function main() {
  const browser = await chromium.launch({
    headless: false,
    args: ["--start-maximized"],
  });

  const context = await browser.newContext({
    viewport: null,
  });

  const page = await context.newPage();

  // ==================================================
  // 1. SUPER ADMIN / ADMIN PORTAL
  // ==================================================
  console.log("========================================");
  console.log("ADMIN PORTAL");
  console.log("========================================\n");

  await page.goto(`${BASE_URL}/admin-login`, { waitUntil: "domcontentloaded" });
  console.log("Please login to the Admin portal.");
  console.log("After the dashboard loads, press ENTER.\n");
  await waitForEnter();

  // 1. Admin Dashboard
  await page.goto(`${BASE_URL}/superadmin`, { waitUntil: "domcontentloaded" });
  await capturePage(page, "Admin Dashboard", "screenshots/admin/dashboard.png");

  // 2. Hospital Management
  await page.goto(`${BASE_URL}/superadmin/hospital`, { waitUntil: "domcontentloaded" });
  await capturePage(page, "Hospital Management", "screenshots/admin/hospital-management.png");

  // 3. Lab Management Dashboard
  await page.goto(`${BASE_URL}/superadmin/lab/dashboard`, { waitUntil: "domcontentloaded" });
  await capturePage(page, "Lab Management Dashboard", "screenshots/admin/lab-management-dashboard.png");

  // 4. Departments
  await page.goto(`${BASE_URL}/superadmin/department`, { waitUntil: "domcontentloaded" });
  await capturePage(page, "Departments", "screenshots/admin/departments.png");

  // 5. EMR
  await page.goto(`${BASE_URL}/superadmin/emr`, { waitUntil: "domcontentloaded" });
  await capturePage(page, "EMR", "screenshots/admin/emr.png");

  // 6. Finance
  await page.goto(`${BASE_URL}/superadmin/finance/dashboard`, { waitUntil: "domcontentloaded" });
  await capturePage(page, "Finance", "screenshots/admin/finance.png");

  // ==================================================
  // 2. DOCTOR PORTAL
  // ==================================================
  console.log("========================================");
  console.log("DOCTOR PORTAL");
  console.log("========================================\n");

  await page.goto(`${BASE_URL}/doctor-login`, { waitUntil: "domcontentloaded" });
  console.log("Please login to the Doctor portal.");
  console.log("After the dashboard loads, press ENTER.\n");
  await waitForEnter();

  // 1. Doctor Dashboard
  await page.goto(`${BASE_URL}/gyn/`, { waitUntil: "domcontentloaded" });
  await capturePage(page, "Doctor Dashboard", "screenshots/doctor/dashboard.png");

  // 2. My Calendar
  await safeClickNav(page, "My Calendar");
  await capturePage(page, "My Calendar", "screenshots/doctor/my-calendar.png");

  // ==================================================
  // 3. LAB TECHNICIAN PORTAL
  // ==================================================
  console.log("========================================");
  console.log("LAB TECHNICIAN PORTAL");
  console.log("========================================\n");

  await page.goto(`${BASE_URL}/lab-login`, { waitUntil: "domcontentloaded" });
  console.log("Please login to the Lab Technician portal.");
  console.log("After the dashboard loads, press ENTER.\n");
  await waitForEnter();

  // 1. Lab Dashboard
  await page.goto(`${BASE_URL}/tec/`, { waitUntil: "domcontentloaded" });
  await capturePage(page, "Lab Dashboard", "screenshots/lab/dashboard.png");

  // ==================================================
  // 4. PHARMACIST PORTAL
  // ==================================================
  console.log("========================================");
  console.log("PHARMACIST PORTAL");
  console.log("========================================\n");

  await page.goto(`${BASE_URL}/pharmacist-login`, { waitUntil: "domcontentloaded" });
  console.log("Please login to the Pharmacist portal.");
  console.log("After the dashboard loads, press ENTER.\n");
  await waitForEnter();

  // 1. Pharmacist Dashboard
  await page.goto(`${BASE_URL}/pha/`, { waitUntil: "domcontentloaded" });
  await capturePage(page, "Pharmacist Dashboard", "screenshots/pharmacist/dashboard.png");

  // 2. Inventory Dashboard
  await safeClickNav(page, "Dashboard", "Inventory");
  await capturePage(page, "Inventory Dashboard", "screenshots/pharmacist/inventory-dashboard.png");

  // 3. Billing Overview
  await safeClickNav(page, "Overview", "Billing");
  await capturePage(page, "Billing Overview", "screenshots/pharmacist/billing-overview.png");

  // ==================================================
  // 5. RECEPTIONIST PORTAL
  // ==================================================
  console.log("========================================");
  console.log("RECEPTIONIST PORTAL");
  console.log("========================================\n");

  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  console.log("Please login to the Receptionist portal.");
  console.log("After the dashboard loads, press ENTER.\n");
  await waitForEnter();

  // 1. Receptionist Dashboard
  await page.goto(`${BASE_URL}/receptionist`, { waitUntil: "domcontentloaded" });
  await capturePage(page, "Receptionist Dashboard", "screenshots/receptionist/dashboard.png");

  // 2. Lab Orders -> All Orders
  await safeClickNav(page, "All Orders", "Lab Orders");
  await capturePage(page, "Lab Orders - All Orders", "screenshots/receptionist/lab-orders-all-orders.png");

  // 3. OP Tickets -> Today's Queue
  await safeClickNav(page, "Today's Queue", "OP Tickets");
  await capturePage(page, "OP Tickets - Today's Queue", "screenshots/receptionist/op-tickets-todays-queue.png");

  // ==================================================
  // COMPLETE SUMMARY
  // ==================================================
  console.log("========================================");
  console.log("SCREENSHOT CAPTURE COMPLETE");
  console.log("========================================\n");
  console.log("Successfully created screenshots:");
  createdScreenshots.forEach((filePath) => {
    console.log(`- ${filePath}`);
  });

  await browser.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("Error during screenshot capture automation:", err);
  process.exit(1);
});
