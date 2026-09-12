import type { Client } from "@libsql/client";
import { ensureSchema } from "./db";
import { answersAt, makeBots, planBotRound, type BotPlan } from "./game/bots";
import { rollLetter } from "./game/letters";
import { scoreRound, type VetoMap } from "./game/scoring";
import type { Answers, GameSettings, Phase, Player, RoundResult } from "./game/types";
import { DEFAULT_SETTINGS } from "./game/types";
import { DEFAULT_CATEGORIES } from "./game/categories";

/** Everyone must stop this long after someone hits Stopp. */
const STOP_GRACE_MS = 3000;
/** How long the review phase runs before it scores itself. */
const VOTE_WINDOW_MS = 75_000;
/** Rooms older than this are fair game for cleanup. */
const ROOM_TTL_MS = 12 * 60 * 60 * 1000;

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type RoomRound = {
  no: number;
  letter: string;
  startedAt: number;
  endsAt: number | null;
  stoppedAt: number | null;
  stoppedBy: string | null;
  deadline: number | null;
  locked: string[];
  progress: Record<string, number>;
};

export type RoomState = {
  code: string;
  phase: Phase;
  hostId: string;
  settings: GameSettings;
  roundNo: number;
  players: Player[];
  round: RoomRound | null;
  review: {
    answers: Record<string, Answers>;
    vetoes: Record<string, string[]>;
    confirmed: string[];
    endsAt: number;
  } | null;
  result: RoundResult | null;
  usedLetters: string[];
  serverNow: number;
};

export class RoomError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

function newCode(): string {
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return out;
}

async function client(): Promise<Client> {
  const c = await ensureSchema();
  if (!c) throw new RoomError("Online-Modus ist nicht konfiguriert (keine Datenbank verbunden).", 503);
  return c;
}

function sanitizeSettings(raw: unknown): GameSettings {
  const base: GameSettings = { ...DEFAULT_SETTINGS, categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })) };
  if (!raw || typeof raw !== "object") return base;
  const s = raw as Partial<GameSettings>;
  const categories = Array.isArray(s.categories)
    ? s.categories
        .filter((c) => c && typeof c.name === "string" && c.name.trim())
        .slice(0, 12)
        .map((c) => ({
          id: String(c.id ?? c.name).slice(0, 60),
          name: String(c.name).trim().slice(0, 40),
          bank: c.bank ?? null,
          custom: !!c.custom,
        }))
    : base.categories;
  const roundSeconds = clampInt(s.roundSeconds, 0, 600, base.roundSeconds);
  return {
    categories: categories.length ? categories : base.categories,
    rounds: clampInt(s.rounds, 1, 20, base.rounds),
    roundSeconds,
    // Without a clock, Stopp is the only thing that can end a round.
    allowStop: roundSeconds === 0 ? true : typeof s.allowStop === "boolean" ? s.allowStop : base.allowStop,
    excludedLetters: Array.isArray(s.excludedLetters)
      ? s.excludedLetters.map((l) => String(l).toUpperCase().slice(0, 1)).slice(0, 20)
      : base.excludedLetters,
    soloBonus: typeof s.soloBonus === "boolean" ? s.soloBonus : base.soloBonus,
    botDifficulty: ["chill", "normal", "brutal"].includes(String(s.botDifficulty))
      ? (s.botDifficulty as GameSettings["botDifficulty"])
      : base.botDifficulty,
  };
}

function clampInt(v: unknown, lo: number, hi: number, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

export function cleanName(name: unknown): string {
  const n = String(name ?? "").trim().replace(/\s+/g, " ").slice(0, 18);
  return n || "Gast";
}

export function cleanEmoji(emoji: unknown): string {
  const e = String(emoji ?? "").trim();
  return e ? [...e][0] ?? "🦊" : "🦊";
}

// ---------------------------------------------------------------- room setup

export async function createRoom(opts: {
  playerId: string;
  name: string;
  emoji: string;
  settings: unknown;
}): Promise<string> {
  const c = await client();
  const now = Date.now();
  const settings = sanitizeSettings(opts.settings);

  for (let attempt = 0; attempt < 6; attempt++) {
    const code = newCode();
    const existing = await c.execute({ sql: "SELECT code FROM rooms WHERE code = ?", args: [code] });
    if (existing.rows.length) continue;
    await c.batch([
      {
        sql: `INSERT INTO rooms (code, host_id, settings, phase, round_no, used_letters, phase_at, created_at, updated_at)
              VALUES (?, ?, ?, 'lobby', 0, '[]', ?, ?, ?)`,
        args: [code, opts.playerId, JSON.stringify(settings), now, now, now],
      },
      {
        sql: `INSERT INTO players (room_code, id, name, emoji, kind, score, is_host, joined_at, last_seen)
              VALUES (?, ?, ?, ?, 'human', 0, 1, ?, ?)`,
        args: [code, opts.playerId, cleanName(opts.name), cleanEmoji(opts.emoji), now, now],
      },
    ]);
    return code;
  }
  throw new RoomError("Konnte keinen freien Raumcode finden. Nochmal versuchen.", 500);
}

export async function joinRoom(code: string, player: { id: string; name: string; emoji: string }) {
  const c = await client();
  const now = Date.now();
  const room = await c.execute({ sql: "SELECT * FROM rooms WHERE code = ?", args: [code] });
  if (!room.rows.length) throw new RoomError("Diesen Raum gibt es nicht (mehr).", 404);
  if (now - Number(room.rows[0].created_at) > ROOM_TTL_MS) {
    throw new RoomError("Dieser Raum ist abgelaufen.", 410);
  }

  const existing = await c.execute({
    sql: "SELECT id FROM players WHERE room_code = ? AND id = ?",
    args: [code, player.id],
  });
  if (existing.rows.length) {
    await c.execute({
      sql: "UPDATE players SET name = ?, emoji = ?, last_seen = ? WHERE room_code = ? AND id = ?",
      args: [cleanName(player.name), cleanEmoji(player.emoji), now, code, player.id],
    });
    return;
  }

  const count = await c.execute({
    sql: "SELECT COUNT(*) AS n FROM players WHERE room_code = ?",
    args: [code],
  });
  if (Number(count.rows[0].n) >= 10) throw new RoomError("Der Raum ist voll (10 Spieler).", 409);
  if (String(room.rows[0].phase) !== "lobby") {
    throw new RoomError("Die Runde läuft schon - warte, bis sie vorbei ist.", 409);
  }

  await c.execute({
    sql: `INSERT INTO players (room_code, id, name, emoji, kind, score, is_host, joined_at, last_seen)
          VALUES (?, ?, ?, ?, 'human', 0, 0, ?, ?)`,
    args: [code, player.id, cleanName(player.name), cleanEmoji(player.emoji), now, now],
  });
}

// ------------------------------------------------------------- state reading

type RoomRow = {
  code: string;
  host_id: string;
  settings: string;
  phase: Phase;
  round_no: number;
  used_letters: string;
  phase_at: number;
  created_at: number;
};

async function loadPlayers(c: Client, code: string): Promise<Player[]> {
  const res = await c.execute({
    sql: "SELECT * FROM players WHERE room_code = ? ORDER BY joined_at ASC",
    args: [code],
  });
  return res.rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    emoji: String(r.emoji),
    kind: String(r.kind) === "bot" ? "bot" : "human",
    skill: r.skill === null ? undefined : Number(r.skill),
    pace: r.pace === null ? undefined : Number(r.pace),
    score: Number(r.score),
    isHost: Number(r.is_host) === 1,
    connected: Date.now() - Number(r.last_seen) < 20_000,
  }));
}

async function loadRoom(c: Client, code: string): Promise<RoomRow> {
  const res = await c.execute({ sql: "SELECT * FROM rooms WHERE code = ?", args: [code] });
  if (!res.rows.length) throw new RoomError("Diesen Raum gibt es nicht (mehr).", 404);
  const r = res.rows[0];
  return {
    code: String(r.code),
    host_id: String(r.host_id),
    settings: String(r.settings),
    phase: String(r.phase) as Phase,
    round_no: Number(r.round_no),
    used_letters: String(r.used_letters),
    phase_at: Number(r.phase_at),
    created_at: Number(r.created_at),
  };
}

/**
 * Reads the room and advances it as far as the clock allows. Every transition
 * (bot hits Stopp, timer runs out, vote window closes) happens here, so no
 * background worker is needed - any request drives the game forward.
 */
export async function getRoomState(code: string, viewerId?: string): Promise<RoomState> {
  const c = await client();
  if (viewerId) {
    await c.execute({
      sql: "UPDATE players SET last_seen = ? WHERE room_code = ? AND id = ?",
      args: [Date.now(), code, viewerId],
    });
  }

  let room = await loadRoom(c, code);
  let players = await loadPlayers(c, code);
  let settings = sanitizeSettings(JSON.parse(room.settings));

  // Two passes are enough: playing -> voting -> results.
  for (let i = 0; i < 2; i++) {
    const advanced = await advance(c, room, players, settings);
    if (!advanced) break;
    room = await loadRoom(c, code);
    players = await loadPlayers(c, code);
    settings = sanitizeSettings(JSON.parse(room.settings));
  }

  return buildState(c, room, players, settings);
}

async function buildState(
  c: Client,
  room: RoomRow,
  players: Player[],
  settings: GameSettings,
): Promise<RoomState> {
  const now = Date.now();
  const state: RoomState = {
    code: room.code,
    phase: room.phase,
    hostId: room.host_id,
    settings,
    roundNo: room.round_no,
    players,
    round: null,
    review: null,
    result: null,
    usedLetters: JSON.parse(room.used_letters) as string[],
    serverNow: now,
  };

  if (room.phase === "lobby" || room.round_no === 0) return state;

  const roundRow = await getRound(c, room.code, room.round_no);
  if (!roundRow) return state;

  if (room.phase === "playing") {
    const plans = roundRow.plans;
    const elapsed = now - roundRow.started_at;
    const subs = await getSubmissions(c, room.code, room.round_no);
    const progress: Record<string, number> = {};
    for (const p of players) {
      if (p.kind === "bot") {
        const plan = plans.find((pl) => pl.playerId === p.id);
        progress[p.id] = plan ? plan.fills.filter((f) => f.atMs <= elapsed).length : 0;
      } else {
        const answers = subs[p.id]?.answers ?? {};
        progress[p.id] = Object.values(answers).filter((v) => v.trim()).length;
      }
    }
    state.round = {
      no: room.round_no,
      letter: roundRow.letter,
      startedAt: roundRow.started_at,
      endsAt: roundRow.ends_at,
      stoppedAt: roundRow.stopped_at,
      stoppedBy: roundRow.stopped_by,
      deadline: deadlineFor(roundRow),
      locked: Object.entries(subs).filter(([, s]) => s.locked).map(([id]) => id),
      progress,
    };
    return state;
  }

  if (room.phase === "voting" || room.phase === "results" || room.phase === "final") {
    const subs = await getSubmissions(c, room.code, room.round_no);
    const answers: Record<string, Answers> = {};
    for (const p of players) answers[p.id] = subs[p.id]?.answers ?? {};

    state.round = {
      no: room.round_no,
      letter: roundRow.letter,
      startedAt: roundRow.started_at,
      endsAt: roundRow.ends_at,
      stoppedAt: roundRow.stopped_at,
      stoppedBy: roundRow.stopped_by,
      deadline: null,
      locked: players.map((p) => p.id),
      progress: {},
    };

    if (room.phase === "voting") {
      const { vetoes, confirmed } = await getVotes(c, room.code, room.round_no);
      state.review = {
        answers,
        vetoes,
        confirmed,
        endsAt: room.phase_at + VOTE_WINDOW_MS,
      };
    } else if (roundRow.result) {
      state.result = roundRow.result;
      state.review = { answers, vetoes: {}, confirmed: [], endsAt: 0 };
    }
  }

  return state;
}

type RoundRow = {
  letter: string;
  started_at: number;
  ends_at: number | null;
  stopped_at: number | null;
  stopped_by: string | null;
  plans: BotPlan[];
  result: RoundResult | null;
};

async function getRound(c: Client, code: string, no: number): Promise<RoundRow | null> {
  const res = await c.execute({
    sql: "SELECT * FROM rounds WHERE room_code = ? AND round_no = ?",
    args: [code, no],
  });
  if (!res.rows.length) return null;
  const r = res.rows[0];
  return {
    letter: String(r.letter),
    started_at: Number(r.started_at),
    ends_at: r.ends_at === null ? null : Number(r.ends_at),
    stopped_at: r.stopped_at === null ? null : Number(r.stopped_at),
    stopped_by: r.stopped_by === null ? null : String(r.stopped_by),
    plans: JSON.parse(String(r.bot_plans)) as BotPlan[],
    result: r.result ? (JSON.parse(String(r.result)) as RoundResult) : null,
  };
}

function deadlineFor(round: RoundRow): number | null {
  const stopDeadline = round.stopped_at ? round.stopped_at + STOP_GRACE_MS : null;
  if (round.ends_at && stopDeadline) return Math.min(round.ends_at, stopDeadline);
  return stopDeadline ?? round.ends_at;
}

async function getSubmissions(c: Client, code: string, no: number) {
  const res = await c.execute({
    sql: "SELECT player_id, answers, submitted_at FROM submissions WHERE room_code = ? AND round_no = ?",
    args: [code, no],
  });
  const out: Record<string, { answers: Answers; locked: boolean; at: number }> = {};
  for (const r of res.rows) {
    out[String(r.player_id)] = {
      answers: JSON.parse(String(r.answers)) as Answers,
      locked: Number(r.submitted_at) > 0,
      at: Number(r.submitted_at),
    };
  }
  return out;
}

async function getVotes(c: Client, code: string, no: number) {
  const res = await c.execute({
    sql: "SELECT voter_id, target FROM vetoes WHERE room_code = ? AND round_no = ?",
    args: [code, no],
  });
  const vetoes: Record<string, string[]> = {};
  const confirmed: string[] = [];
  for (const r of res.rows) {
    const target = String(r.target);
    const voter = String(r.voter_id);
    if (target === "__done__") {
      confirmed.push(voter);
      continue;
    }
    (vetoes[target] ??= []).push(voter);
  }
  return { vetoes, confirmed };
}

// ------------------------------------------------------------- state machine

/** Returns true when it changed something, so the caller re-reads. */
async function advance(
  c: Client,
  room: RoomRow,
  players: Player[],
  settings: GameSettings,
): Promise<boolean> {
  const now = Date.now();
  if (room.phase !== "playing" && room.phase !== "voting") return false;

  const round = await getRound(c, room.code, room.round_no);
  if (!round) return false;

  if (room.phase === "playing") {
    // A bot may call Stopp before anyone else does.
    if (!round.stopped_at) {
      const elapsed = now - round.started_at;
      const stopper = round.plans
        .filter((p) => p.stopAtMs !== null && p.stopAtMs <= elapsed)
        .sort((a, b) => (a.stopAtMs ?? 0) - (b.stopAtMs ?? 0))[0];
      if (stopper) {
        const at = round.started_at + (stopper.stopAtMs ?? 0);
        await c.execute({
          sql: "UPDATE rounds SET stopped_at = ?, stopped_by = ? WHERE room_code = ? AND round_no = ?",
          args: [at, stopper.playerId, room.code, room.round_no],
        });
        round.stopped_at = at;
        round.stopped_by = stopper.playerId;
      }
    }

    const humans = players.filter((p) => p.kind === "human");
    const subs = await getSubmissions(c, room.code, room.round_no);
    const allLocked = humans.length > 0 && humans.every((h) => subs[h.id]?.locked);
    const deadline = deadlineFor(round);
    const timeUp = deadline !== null && now >= deadline;

    if (!allLocked && !timeUp) return false;

    await closeRound(c, room, players, round, subs, now);
    return true;
  }

  // voting
  const { confirmed } = await getVotes(c, room.code, room.round_no);
  const humans = players.filter((p) => p.kind === "human");
  const everyoneDone = humans.length > 0 && humans.every((h) => confirmed.includes(h.id));
  if (!everyoneDone && now < room.phase_at + VOTE_WINDOW_MS) return false;

  await finishRound(c, room, players, settings, round);
  return true;
}

/** Freezes every answer (bots included) and opens the review phase. */
async function closeRound(
  c: Client,
  room: RoomRow,
  players: Player[],
  round: RoundRow,
  subs: Record<string, { answers: Answers; locked: boolean; at: number }>,
  now: number,
) {
  const deadline = deadlineFor(round) ?? now;
  const cutoff = Math.min(now, deadline) - round.started_at;
  const statements = [];

  for (const player of players) {
    if (player.kind === "bot") {
      const plan = round.plans.find((p) => p.playerId === player.id);
      const answers = plan ? answersAt(plan, cutoff) : {};
      statements.push({
        sql: `INSERT OR REPLACE INTO submissions (room_code, round_no, player_id, answers, submitted_at)
              VALUES (?, ?, ?, ?, ?)`,
        args: [room.code, room.round_no, player.id, JSON.stringify(answers), now],
      });
    } else if (!subs[player.id]?.locked) {
      // Their draft (or nothing) becomes the final answer.
      statements.push({
        sql: `INSERT OR REPLACE INTO submissions (room_code, round_no, player_id, answers, submitted_at)
              VALUES (?, ?, ?, ?, ?)`,
        args: [room.code, room.round_no, player.id, JSON.stringify(subs[player.id]?.answers ?? {}), now],
      });
    }
  }

  statements.push({
    sql: "UPDATE rooms SET phase = 'voting', phase_at = ?, updated_at = ? WHERE code = ?",
    args: [now, now, room.code],
  });
  await c.batch(statements);
}

/** Applies the vetoes, scores the round and writes the result. */
async function finishRound(
  c: Client,
  room: RoomRow,
  players: Player[],
  settings: GameSettings,
  round: RoundRow,
) {
  const now = Date.now();
  const subs = await getSubmissions(c, room.code, room.round_no);
  const { vetoes } = await getVotes(c, room.code, room.round_no);
  const humanCount = players.filter((p) => p.kind === "human").length;

  const vetoMap: VetoMap = {};
  for (const [target, voters] of Object.entries(vetoes)) {
    const ownerId = target.split(":")[0];
    const ownerIsHuman = players.find((p) => p.id === ownerId)?.kind === "human";
    const electorate = Math.max(1, humanCount - (ownerIsHuman ? 1 : 0));
    const unique = new Set(voters.filter((v) => v !== ownerId));
    if (unique.size >= Math.ceil(electorate / 2)) vetoMap[target] = true;
  }

  const answersByPlayer: Record<string, Answers> = {};
  for (const p of players) answersByPlayer[p.id] = subs[p.id]?.answers ?? {};

  const result = scoreRound(
    round.letter,
    settings.categories,
    players.map((p) => p.id),
    answersByPlayer,
    settings,
    vetoMap,
  );

  const isFinal = room.round_no >= settings.rounds;
  const statements = [
    {
      sql: "UPDATE rounds SET result = ? WHERE room_code = ? AND round_no = ?",
      args: [JSON.stringify(result), room.code, room.round_no],
    },
    {
      sql: `UPDATE rooms SET phase = ?, phase_at = ?, updated_at = ? WHERE code = ?`,
      args: [isFinal ? "final" : "results", now, now, room.code],
    },
    ...players.map((p) => ({
      sql: "UPDATE players SET score = score + ? WHERE room_code = ? AND id = ?",
      args: [result.totals[p.id] ?? 0, room.code, p.id],
    })),
  ];
  await c.batch(statements);
}

// -------------------------------------------------------------------- actions

export type Action =
  | { type: "settings"; settings: unknown }
  | { type: "addBot" }
  | { type: "removeBot"; botId?: string }
  | { type: "kick"; playerId: string }
  | { type: "start" }
  | { type: "draft"; answers: Answers }
  | { type: "submit"; answers: Answers; stop?: boolean }
  | { type: "veto"; target: string; on: boolean }
  | { type: "confirmVote" }
  | { type: "next" }
  | { type: "restart" }
  | { type: "leave" };

export async function applyAction(code: string, playerId: string, action: Action): Promise<void> {
  const c = await client();
  const room = await loadRoom(c, code);
  const players = await loadPlayers(c, code);
  const settings = sanitizeSettings(JSON.parse(room.settings));
  const me = players.find((p) => p.id === playerId);
  if (!me) throw new RoomError("Du bist nicht in diesem Raum.", 403);
  const isHost = room.host_id === playerId;
  const now = Date.now();

  const requireHost = () => {
    if (!isHost) throw new RoomError("Nur der Host darf das.", 403);
  };

  switch (action.type) {
    case "settings": {
      requireHost();
      if (room.phase !== "lobby") throw new RoomError("Einstellungen gehen nur in der Lobby.", 409);
      await c.execute({
        sql: "UPDATE rooms SET settings = ?, updated_at = ? WHERE code = ?",
        args: [JSON.stringify(sanitizeSettings(action.settings)), now, code],
      });
      return;
    }

    case "addBot": {
      requireHost();
      if (room.phase !== "lobby") throw new RoomError("Bots gehen nur in der Lobby.", 409);
      if (players.length >= 10) throw new RoomError("Der Raum ist voll.", 409);
      const taken = new Set(players.map((p) => p.name));
      let bot = makeBots(1, settings.botDifficulty)[0];
      for (let i = 0; i < 12 && taken.has(bot.name); i++) bot = makeBots(1, settings.botDifficulty)[0];
      if (taken.has(bot.name)) throw new RoomError("Keine Bots mehr übrig.", 409);
      await c.execute({
        sql: `INSERT INTO players (room_code, id, name, emoji, kind, skill, pace, score, is_host, joined_at, last_seen)
              VALUES (?, ?, ?, ?, 'bot', ?, ?, 0, 0, ?, ?)`,
        args: [code, `${bot.id}-${now.toString(36)}`, bot.name, bot.emoji, bot.skill ?? 0.7, bot.pace ?? 1, now, now],
      });
      return;
    }

    case "removeBot": {
      requireHost();
      const bots = players.filter((p) => p.kind === "bot");
      const target = action.botId ? bots.find((b) => b.id === action.botId) : bots[bots.length - 1];
      if (!target) return;
      await c.execute({
        sql: "DELETE FROM players WHERE room_code = ? AND id = ?",
        args: [code, target.id],
      });
      return;
    }

    case "kick": {
      requireHost();
      if (action.playerId === room.host_id) throw new RoomError("Der Host kann sich nicht kicken.", 400);
      await c.execute({
        sql: "DELETE FROM players WHERE room_code = ? AND id = ?",
        args: [code, action.playerId],
      });
      return;
    }

    case "leave": {
      if (isHost) {
        const next = players.find((p) => p.kind === "human" && p.id !== playerId);
        if (next) {
          await c.batch([
            { sql: "UPDATE rooms SET host_id = ?, updated_at = ? WHERE code = ?", args: [next.id, now, code] },
            { sql: "UPDATE players SET is_host = 1 WHERE room_code = ? AND id = ?", args: [code, next.id] },
            { sql: "DELETE FROM players WHERE room_code = ? AND id = ?", args: [code, playerId] },
          ]);
          return;
        }
        await c.batch([
          { sql: "DELETE FROM players WHERE room_code = ?", args: [code] },
          { sql: "DELETE FROM rooms WHERE code = ?", args: [code] },
        ]);
        return;
      }
      await c.execute({ sql: "DELETE FROM players WHERE room_code = ? AND id = ?", args: [code, playerId] });
      return;
    }

    case "start":
    case "next": {
      requireHost();
      if (room.phase === "playing" || room.phase === "voting") {
        throw new RoomError("Die Runde läuft noch.", 409);
      }
      if (room.phase === "final") throw new RoomError("Das Spiel ist vorbei.", 409);
      if (players.length < 2) throw new RoomError("Mindestens 2 Spieler (Bots zählen mit).", 400);
      await startRound(c, room, players, settings);
      return;
    }

    case "restart": {
      requireHost();
      await c.batch([
        { sql: "DELETE FROM rounds WHERE room_code = ?", args: [code] },
        { sql: "DELETE FROM submissions WHERE room_code = ?", args: [code] },
        { sql: "DELETE FROM vetoes WHERE room_code = ?", args: [code] },
        { sql: "UPDATE players SET score = 0 WHERE room_code = ?", args: [code] },
        {
          sql: "UPDATE rooms SET phase = 'lobby', round_no = 0, used_letters = '[]', phase_at = ?, updated_at = ? WHERE code = ?",
          args: [now, now, code],
        },
      ]);
      return;
    }

    case "draft":
    case "submit": {
      if (room.phase !== "playing") return;
      const round = await getRound(c, code, room.round_no);
      if (!round) return;
      const answers = sanitizeAnswers(action.answers, settings);
      const locked = action.type === "submit" ? now : 0;

      const statements: { sql: string; args: (string | number)[] }[] = [
        {
          sql: `INSERT OR REPLACE INTO submissions (room_code, round_no, player_id, answers, submitted_at)
                VALUES (?, ?, ?, ?, ?)`,
          args: [code, room.round_no, playerId, JSON.stringify(answers), locked],
        },
      ];

      if (action.type === "submit" && action.stop && settings.allowStop && !round.stopped_at) {
        statements.push({
          sql: "UPDATE rounds SET stopped_at = ?, stopped_by = ? WHERE room_code = ? AND round_no = ?",
          args: [now, playerId, code, room.round_no],
        });
      }
      await c.batch(statements);
      return;
    }

    case "veto": {
      if (room.phase !== "voting") return;
      const target = String(action.target).slice(0, 120);
      if (!target || target === "__done__") return;
      if (target.startsWith(`${playerId}:`)) throw new RoomError("Eigene Antworten kannst du nicht streichen.", 400);
      if (action.on) {
        await c.execute({
          sql: "INSERT OR IGNORE INTO vetoes (room_code, round_no, voter_id, target) VALUES (?, ?, ?, ?)",
          args: [code, room.round_no, playerId, target],
        });
      } else {
        await c.execute({
          sql: "DELETE FROM vetoes WHERE room_code = ? AND round_no = ? AND voter_id = ? AND target = ?",
          args: [code, room.round_no, playerId, target],
        });
      }
      return;
    }

    case "confirmVote": {
      if (room.phase !== "voting") return;
      await c.execute({
        sql: "INSERT OR IGNORE INTO vetoes (room_code, round_no, voter_id, target) VALUES (?, ?, ?, '__done__')",
        args: [code, room.round_no, playerId],
      });
      return;
    }
  }
}

function sanitizeAnswers(raw: unknown, settings: GameSettings): Answers {
  const out: Answers = {};
  if (!raw || typeof raw !== "object") return out;
  const allowed = new Set(settings.categories.map((c) => c.id));
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!allowed.has(key)) continue;
    out[key] = String(value ?? "").trim().slice(0, 48);
  }
  return out;
}

async function startRound(c: Client, room: RoomRow, players: Player[], settings: GameSettings) {
  const now = Date.now();
  const used = JSON.parse(room.used_letters) as string[];
  const letter = rollLetter(used, settings.excludedLetters);
  const roundNo = room.round_no + 1;
  const startedAt = now + 2600; // dice animation runs first on every client
  const endsAt = settings.roundSeconds > 0 ? startedAt + settings.roundSeconds * 1000 : null;

  const plans = players
    .filter((p) => p.kind === "bot")
    .map((bot) => planBotRound(bot, settings.categories, letter, settings));

  await c.batch([
    {
      sql: `INSERT OR REPLACE INTO rounds (room_code, round_no, letter, started_at, ends_at, stopped_at, stopped_by, bot_plans, result)
            VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, NULL)`,
      args: [room.code, roundNo, letter, startedAt, endsAt, JSON.stringify(plans)],
    },
    {
      sql: `UPDATE rooms SET phase = 'playing', round_no = ?, used_letters = ?, phase_at = ?, updated_at = ? WHERE code = ?`,
      args: [roundNo, JSON.stringify([...used, letter]), now, now, room.code],
    },
  ]);
}
