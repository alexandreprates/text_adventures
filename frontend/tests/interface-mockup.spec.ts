import { expect, test } from "@playwright/test";

test("previews combat, rewards and recovery without contacting the game API", async ({
  page,
}) => {
  const gameRequests: string[] = [];
  page.on("request", (request) => {
    if (/\/api\/|\/ws\b/.test(request.url())) gameRequests.push(request.url());
  });
  await page.goto("/?mockup=interface");
  await expect(
    page.getByRole("heading", { name: "The Eastern Chamber" }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(() => document.fonts.check('18px "Press Start 2P"')),
  ).toBe(true);
  await page.getByRole("button", { name: "Explore the chamber" }).click();
  const adventure = page.getByRole("region", { name: "Adventure preview" });
  await expect(adventure.getByRole("button", { name: "Town" })).toBeDisabled();
  for (let hit = 0; hit < 3; hit += 1) {
    await page.getByRole("button", { name: "Attack skeleton" }).click();
  }
  await expect(
    page.getByRole("status").filter({ hasText: "Skeleton defeated" }),
  ).toHaveText(/18 gold/);
  await page.getByRole("button", { name: "Collect rewards" }).click();
  await page.getByRole("button", { name: "Inventory", exact: true }).click();
  await expect(page.getByText("146 gold", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Use", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Use", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close panel" }).click();
  await expect(
    page.getByRole("progressbar", { name: "Health", exact: true }),
  ).toHaveAttribute("value", "30");
  await adventure.getByRole("button", { name: "Town" }).click();
  await expect(
    page.getByRole("heading", { name: "The town of Nee'Peh" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Enter the ruins" }).click();
  await expect(
    page.getByRole("heading", { name: "The Eastern Chamber" }),
  ).toBeVisible();
  expect(gameRequests).toEqual([]);
});

test("shows the assessment and validates optional commands", async ({
  page,
}) => {
  await page.goto("/?mockup=interface");
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await page.getByRole("button", { name: "Design notes" }).click();
  await expect(
    page.getByRole("region", { name: "Interface assessment" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Keep resources readable" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Preview", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("region", { name: "Interface assessment" }),
  ).toBeHidden();
  await page.getByRole("button", { name: "Terminal", exact: true }).click();
  await page.getByLabel("Command", { exact: true }).fill("unknown");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByRole("alert")).toHaveText(/Try “explore” or “look”/);
  await page.getByLabel("Command", { exact: true }).fill("explore");
  await page.getByLabel("Command", { exact: true }).press("Enter");
  await expect(
    page.getByRole("button", { name: "Attack skeleton" }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

for (const size of [
  { width: 320, height: 568, columns: 1 },
  { width: 390, height: 844, columns: 1 },
  { width: 844, height: 390, columns: 2 },
  { width: 667, height: 375, columns: 1 },
  { width: 1024, height: 768, columns: 2 },
  { width: 1440, height: 700, columns: 3 },
  { width: 1440, height: 900, columns: 3 },
]) {
  test(`keeps the map dominant and controls visible at ${size.width}x${size.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await page.goto("/?mockup=interface");
    await page.evaluate(() => document.fonts.ready);
    await expect
      .poll(() =>
        page.evaluate(() => ({ width: innerWidth, height: innerHeight })),
      )
      .toEqual({ width: size.width, height: size.height });
    await expect(
      page.getByRole("progressbar", { name: "Health", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Explore the chamber" }),
    ).toBeVisible();
    await expect(page.locator(".map-stage")).toHaveAttribute(
      "aria-busy",
      "false",
    );
    for (const scene of ["combat", "loot", "town", "exploration"]) {
      await page.getByRole("button", { name: "Preview", exact: true }).click();
      await page.getByLabel("Preview scenario").selectOption(scene);
      await expect(page.getByRole("dialog")).toBeHidden();
      expect(
        await page.evaluate(() => ({
          horizontal: document.documentElement.scrollWidth > innerWidth,
          vertical: document.documentElement.scrollHeight > innerHeight,
        })),
      ).toEqual({ horizontal: false, vertical: false });
      const map = await page.locator(".im-map").boundingBox();
      const minimumMapShare =
        size.height < 500 ? 0.55 : size.width <= 600 ? 0.6 : 0.75;
      expect(
        (map!.width * map!.height) / (size.width * size.height),
      ).toBeGreaterThanOrEqual(minimumMapShare);
      for (const selector of [
        ".im-primary",
        ".im-dock",
        ".im-resources",
        ".im-latest",
      ]) {
        const box = await page.locator(selector).boundingBox();
        expect(box!.y).toBeGreaterThanOrEqual(0);
        expect(box!.y + box!.height).toBeLessThanOrEqual(size.height);
        expect(box!.x + box!.width).toBeLessThanOrEqual(size.width);
      }
      const action = await page.locator(".im-primary").boundingBox();
      expect(action!.height).toBeGreaterThanOrEqual(44);
      const workspace = await page.locator(".im-player").boundingBox();
      const playerChildren = await page
        .locator(".im-player > *")
        .evaluateAll((elements) =>
          elements
            .map((element) => element.getBoundingClientRect().toJSON())
            .filter((box) => box.width > 0 && box.height > 0),
        );
      for (const box of playerChildren) {
        expect(box.y + box.height).toBeLessThanOrEqual(
          workspace!.y + workspace!.height,
        );
      }
    }
    await page.getByRole("button", { name: "Preview", exact: true }).click();
    await page.getByRole("button", { name: "Design notes" }).click();
    const grid = await page.locator(".im-findings").evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        display: style.display,
        columns: style.gridTemplateColumns.split(" ").length,
        gap: style.gap,
      };
    });
    expect(grid).toEqual({
      display: "grid",
      columns: size.columns,
      gap: "24px",
    });
    const dialog = page.getByRole("dialog");
    const bounds = await dialog.boundingBox();
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(size.height);
    await page.locator(".im-dialog-body").evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    expect(await page.evaluate(() => scrollY)).toBe(0);
    const tokenColors = await page.evaluate(() => ({
      utility: getComputedStyle(document.querySelector(".text-preview-muted")!)
        .color,
      existing: getComputedStyle(document.querySelector(".im-muted")!).color,
    }));
    expect(tokenColors.utility).toBe(tokenColors.existing);
    await page.getByRole("button", { name: "Close panel" }).click();
  });
}
