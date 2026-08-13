import { chromium } from "playwright";
import fs from "fs";

const browser = await chromium.launch({
  headless: false,
  args: ["--start-maximized"],
});

const context = await browser.newContext({
  viewport: null,
});

const page = await context.newPage();

fs.mkdirSync("screenshots/dashboards", {
  recursive: true,
});

const portals = [
  {
    name: "super-admin",
    login: "/admin-login",
  },
  {
    name: "receptionist",
    login: "/login",
  },
  {
    name: "hr",
    login: "/hr-login",
  },
  {
    name: "embryologist",
    login: "/embryologist-login",
  },
  {
    name: "andrologist",
    login: "/andrologist-login",
  },
  {
    name: "doctor",
    login: "/doctor-login",
  },
  {
    name: "nurse",
    login: "/nurse-login",
  },
  {
    name: "pharmacist",
    login: "/pharmacist-login",
  },
  {
    name: "lab-technician",
    login: "/lab-login",
  },
];

for (const portal of portals) {
  console.log("\n========================================");
  console.log(`Opening ${portal.name}`);
  console.log("========================================");

  await page.goto(`http://localhost:5173${portal.login}`, {
    waitUntil: "domcontentloaded",
  });

  console.log(`Login to the ${portal.name} portal.`);
  console.log("After the dashboard loads, press ENTER here.");

  await waitForEnter();

  await page.waitForTimeout(2000);

  /*
   * Find the internal scrolling container.
   */
  const scrollInfo = await page.evaluate(() => {
    const elements = [...document.querySelectorAll("*")];

    const candidates = elements
      .map((el) => {
        const style = getComputedStyle(el);

        return {
          element: el,
          tag: el.tagName,
          className:
            typeof el.className === "string"
              ? el.className
              : "",
          clientHeight: el.clientHeight,
          scrollHeight: el.scrollHeight,
          overflowY: style.overflowY,
        };
      })
      .filter(
        (item) =>
          item.scrollHeight > item.clientHeight + 100 &&
          ["auto", "scroll"].includes(item.overflowY)
      )
      .sort(
        (a, b) =>
          b.scrollHeight - b.clientHeight -
          (a.scrollHeight - a.clientHeight)
      );

    return candidates.slice(0, 10).map((item) => ({
      tag: item.tag,
      className: item.className,
      clientHeight: item.clientHeight,
      scrollHeight: item.scrollHeight,
      overflowY: item.overflowY,
    }));
  });

  console.log("\nScrollable containers found:");

  if (scrollInfo.length === 0) {
    console.log("No internal scroll container found.");
  } else {
    console.table(scrollInfo);
  }

  /*
   * Temporarily remove page-level scrolling restrictions.
   */
  await page.addStyleTag({
    content: `
      html,
      body {
        height: auto !important;
        min-height: 0 !important;
        overflow: visible !important;
      }

      .superadmin-root,
      .superadmin-main,
      .superadmin-body {
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: visible !important;
      }
    `,
  });

  /*
   * Expand the largest internal scrolling container.
   */
  await page.evaluate(() => {
    const elements = [...document.querySelectorAll("*")];

    const candidates = elements
      .filter((el) => {
        const style = getComputedStyle(el);

        return (
          el.scrollHeight > el.clientHeight + 100 &&
          ["auto", "scroll"].includes(style.overflowY)
        );
      })
      .sort(
        (a, b) =>
          b.scrollHeight - b.clientHeight -
          (a.scrollHeight - a.clientHeight)
      );

    if (candidates.length > 0) {
      const mainScroller = candidates[0];

      mainScroller.style.height =
        `${mainScroller.scrollHeight}px`;

      mainScroller.style.maxHeight = "none";
      mainScroller.style.minHeight =
        `${mainScroller.scrollHeight}px`;

      mainScroller.style.overflow = "visible";

      console.log(
        "Expanded:",
        mainScroller.className
      );
    }
  });

  await page.waitForTimeout(1000);

  const filename =
    `screenshots/dashboards/${portal.name}.png`;

  await page.screenshot({
    path: filename,
    fullPage: true,
  });

  console.log(`✓ Saved: ${filename}`);
}

console.log("\n========================================");
console.log("ALL DASHBOARDS CAPTURED");
console.log("========================================");

await browser.close();

function waitForEnter() {
  return new Promise((resolve) => {
    process.stdin.resume();

    process.stdin.once("data", () => {
      resolve();
    });
  });
}