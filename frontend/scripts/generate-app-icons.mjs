import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const directory = new URL("../public/icons/", import.meta.url);
const svg = await readFile(new URL("app.svg", directory), "utf8");
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const [name, size] of [["app-192.png", 192], ["app-512.png", 512],
    ["app-maskable-512.png", 512], ["apple-touch-icon.png", 180]]) {
    const png = await page.evaluate(async ({ svg, size }) => {
      const image = new Image();
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      canvas.getContext("2d").drawImage(image, 0, 0, size, size);
      return canvas.toDataURL("image/png").split(",")[1];
    }, { svg, size });
    await writeFile(new URL(name, directory), Buffer.from(png, "base64"));
  }
} finally {
  await browser.close();
}
