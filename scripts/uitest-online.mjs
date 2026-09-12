/**
 * End-to-end browser test for online play: two real browsers, one room.
 *
 * Host creates a room, a friend joins by code, a bot is added, and they play a
 * full round through to the scoreboard. Needs a database, so point it at a
 * deployment that has one:
 *   BASE=https://lexiroll.vercel.app npm run test:online
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE ?? "http://localhost:3499";
const SHOTS = process.env.SHOTS ?? "";

let failures = 0;
const check = (label, ok, detail = "") => {
  console.log(`  ${ok ? "ok  " : "FAIL"} ${label}${ok || !detail ? "" : ` - ${detail}`}`);
  if (!ok) failures++;
};

if (SHOTS) await mkdir(SHOTS, { recursive: true });

const browser = await chromium.launch();
const problems = [];

const openPlayer = async (label) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    locale: "en-GB",
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => problems.push(`${label} pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") problems.push(`${label} console: ${m.text()}`);
  });
  return { context, page };
};

const shot = async (page, name) => {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` });
};

console.log(`\nonline round at ${BASE}`);

const host = await openPlayer("host");
const guest = await openPlayer("guest");

// --- host opens a room -------------------------------------------------------
await host.page.goto(`${BASE}/play`, { waitUntil: "networkidle" });
await host.page.waitForTimeout(1200);
await host.page.getByPlaceholder(/Your name|Dein Name|Il tuo nome/i).fill("Hosty");
await shot(host.page, "01-host-profile");
await host.page.getByRole("button", { name: /Create a room|Raum erstellen|Crea una stanza/i }).click();
await host.page.waitForURL(/\/room\/[A-Z0-9]{4}/, { timeout: 20_000 });
const code = host.page.url().split("/room/")[1];
check("host created a room", /^[A-Z0-9]{4}$/.test(code), code);
await host.page.waitForTimeout(1500);
await shot(host.page, "02-lobby-host");

// --- friend joins with the code ---------------------------------------------
await guest.page.goto(`${BASE}/play`, { waitUntil: "networkidle" });
await guest.page.waitForTimeout(1200);
await guest.page.getByPlaceholder(/Your name|Dein Name|Il tuo nome/i).fill("Guesty");
await guest.page.getByPlaceholder(/CODE|CODICE/i).fill(code);
await guest.page.getByRole("button", { name: /^(Go|Los|Vai)$/i }).click();
await guest.page.waitForURL(/\/room\//, { timeout: 20_000 });
await guest.page.waitForTimeout(2500);
const guestSeesHost = await guest.page.getByText("Hosty").count();
check("friend joined the same room", guestSeesHost > 0);
await shot(guest.page, "03-lobby-guest");

// The host must see the newcomer appear through polling alone.
await host.page.waitForTimeout(2500);
check("host sees the friend arrive", (await host.page.getByText("Guesty").count()) > 0);

// --- add a bot and start -----------------------------------------------------
await host.page.getByRole("button", { name: /\+ Bot/i }).click();
await host.page.waitForTimeout(1500);
check("bot joined the room", (await host.page.getByText(/Bot/).count()) > 0);
await shot(host.page, "04-lobby-with-bot");

await host.page.getByRole("button", { name: /Start the game|Spiel starten|Inizia la partita/i }).click();

const bothPlaying = await Promise.all([
  host.page.waitForSelector("input[placeholder]", { timeout: 25_000 }).then(() => true).catch(() => false),
  guest.page.waitForSelector("input[placeholder]", { timeout: 25_000 }).then(() => true).catch(() => false),
]);
check("host reaches the answer sheet", bothPlaying[0]);
check("friend reaches the answer sheet too", bothPlaying[1]);
if (!bothPlaying[0] || !bothPlaying[1]) {
  await shot(host.page, "05-STUCK-host");
  await shot(guest.page, "05-STUCK-guest");
  console.log(problems);
  await browser.close();
  process.exit(1);
}
await shot(host.page, "05-playing-host");

// --- both write, host calls stop --------------------------------------------
const fill = async (page, word) => {
  const inputs = page.locator("input[placeholder]");
  const n = await inputs.count();
  const letter = (await page.locator("header").first().innerText()).trim().charAt(0);
  for (let i = 0; i < n; i++) await inputs.nth(i).fill(`${letter}${word}${i}`);
  return letter;
};
const letter = await fill(host.page, "ostword");
await fill(guest.page, "uestword");
check("a letter is showing", /[A-Z]/.test(letter), letter);
await host.page.waitForTimeout(400);

await host.page.getByRole("button", { name: /^(STOP|STOPP)!?$/i }).click();

const bothReview = await Promise.all([
  host.page.waitForSelector("text=/Check the answers|Antworten prüfen|Verifica/i", { timeout: 25_000 }).then(() => true).catch(() => false),
  guest.page.waitForSelector("text=/Check the answers|Antworten prüfen|Verifica/i", { timeout: 25_000 }).then(() => true).catch(() => false),
]);
check("host reaches the review phase", bothReview[0]);
check("friend reaches the review phase", bothReview[1]);
await shot(host.page, "06-review-host");

// --- the friend strikes one of the host's answers ---------------------------
if (bothReview[1]) {
  const strike = guest.page.getByRole("button", { name: /^(strike|streichen|cancella)$/i }).first();
  if (await strike.count()) {
    await strike.click();
    await guest.page.waitForTimeout(1200);
    check("a struck answer shows up as struck", (await guest.page.getByText(/struck|gestrichen|cancellata/i).count()) > 0);
  }
  await guest.page.getByRole("button", { name: /Looks good|Passt so|Per me va bene/i }).click();
}
if (bothReview[0]) {
  await host.page.getByRole("button", { name: /Looks good|Passt so|Per me va bene/i }).click();
}

const scored = await host.page
  .waitForSelector("text=/Points this round|Punkte diese Runde|Punti di questo/i", { timeout: 25_000 })
  .then(() => true)
  .catch(() => false);
check("the round is scored for everyone", scored);
await shot(host.page, "07-results-host");
await shot(guest.page, "07-results-guest");

check("no page errors", problems.length === 0, problems.slice(0, 3).join(" | "));

// --- clean the room up -------------------------------------------------------
await guest.page.goto(`${BASE}/`).catch(() => {});
await host.page.goto(`${BASE}/`).catch(() => {});

await browser.close();
console.log(failures === 0 ? "\nall good\n" : `\n${failures} failing check(s)\n`);
process.exit(failures === 0 ? 0 : 1);
