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
    page.getByRole("progressbar", { name: "Health", exact: true }),
  ).toHaveAttribute("value", "30");
  await expect(
    page.getByRole("button", { name: "Use", exact: true }),
  ).toBeDisabled();
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
  await page.getByRole("button", { name: "Design notes" }).click();
  await expect(
    page.getByRole("region", { name: "Interface assessment" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Keep resources readable" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Hide notes" }).click();
  await expect(
    page.getByRole("region", { name: "Interface assessment" }),
  ).toBeHidden();
  await page.getByText("Prefer words? Type a command").click();
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

test("keeps the map, resources and actions usable across screen sizes", async ({
  page,
}) => {
  await page.goto("/?mockup=interface");
  for (const size of [
    { width: 320, height: 740 },
    { width: 390, height: 844 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(size);
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
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const action = await page
      .getByRole("button", { name: "Explore the chamber" })
      .boundingBox();
    expect(action!.height).toBeGreaterThanOrEqual(44);
    if (size.width === 390 || size.width === 1440)
      expect(action!.y + action!.height).toBeLessThanOrEqual(size.height);
  }
});
