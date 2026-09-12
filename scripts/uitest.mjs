/**
 * End-to-end browser test: plays a full solo round the way a person does.
 *
 * This exists because a unit test cannot catch a screen that never advances.
 * Run against a running server:
 *   npm run build && npx next start -p 3499
 *   npm run test:ui                       # or: BASE=https://lexiroll.vercel.app npm run test:ui
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE ?? "http://localhost:3499";
const SHOTS = process.env.SHOTS ?? "";
const LOCALE = process.env.LOCALE ?? "de-DE";

let failures = 0;
const check = (label, ok, detail = "") => {
  console.log(`  ${ok ? "ok  " : "FAIL"} ${label}${ok || !detail ? "" : ` - ${detail}`}`);
  if (!ok) failures++;
};

if (SHOTS) await mkdir(SHOTS, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  locale: LOCALE,
});

const problems = [];
page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") problems.push(`console: ${m.text()}`);
});

const shot = async (name) => {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` });
};

console.log(`\nsolo round at ${BASE} (${LOCALE})`);

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(1200); // boot screen fades out
check("home page loads", (await page.title()).includes("Lexiroll"));
await shot("01-home");

await page.getByRole("link", { name: /Solo/i }).first().click();
await page.waitForURL(/\/solo/, { timeout: 10_000 });
await page.waitForTimeout(800);
check("solo setup opens", await page.getByRole("button", { name: /Let's go|Los geht|Si parte/i }).isVisible());
await shot("02-setup");

await page.getByRole("button", { name: /Let's go|Los geht|Si parte/i }).click();
await page.waitForTimeout(700);
await shot("03-rolling");

// The regression this test exists for: the die used to skip its animation on
// mount, never fire onLanded, and leave the game stuck on the roll screen.
const playing = await page
  .waitForSelector("input[placeholder]", { timeout: 9000 })
  .then(() => true)
  .catch(() => false);
check("the die lands and the round starts", playing);
if (!playing) {
  console.log(problems.length ? problems : "(no page errors)");
  await shot("04-STUCK");
  await browser.close();
  process.exit(1);
}
await shot("04-playing");

const letter = (await page.locator("header").first().innerText()).trim().charAt(0);
check("a letter was rolled", /[A-Z]/.test(letter), letter);

const inputs = page.locator("input[placeholder]");
const count = await inputs.count();
check("one input per category", count >= 3, `${count}`);
for (let i = 0; i < count; i++) await inputs.nth(i).fill(`${letter}oremipsum${i}`);
await page.waitForTimeout(300);
await shot("05-filled");

await page.getByRole("button", { name: /^(STOP|STOPP)!?$/i }).click();
const reviewed = await page
  .waitForSelector("text=/Check the answers|Antworten prüfen|Verifica le risposte/i", { timeout: 9000 })
  .then(() => true)
  .catch(() => false);
check("stop opens the review phase", reviewed);
await shot("06-review");

if (reviewed) {
  await page.getByRole("button", { name: /Looks good|Passt so|Per me va bene/i }).click();
  await page.waitForTimeout(1200);
  const scored = await page
    .locator("text=/Points this round|Punkte diese Runde|Punti di questo turno/i")
    .count();
  check("the round is scored", scored > 0);
  await shot("07-results");

  await page.getByRole("button", { name: /Next round|Nächste Runde|Prossimo turno/i }).click();
  const secondRound = await page
    .waitForSelector("input[placeholder]", { timeout: 12_000 })
    .then(() => true)
    .catch(() => false);
  check("round two starts too", secondRound);
  await shot("08-round-two");
}

check("no page errors", problems.length === 0, problems.slice(0, 3).join(" | "));

await browser.close();
console.log(failures === 0 ? "\nall good\n" : `\n${failures} failing check(s)\n`);
process.exit(failures === 0 ? 0 : 1);
