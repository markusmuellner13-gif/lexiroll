import { NextResponse } from "next/server";
import { applyAction, getRoomState, RoomError, type Action } from "@/lib/rooms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIONS = new Set([
  "settings",
  "addBot",
  "removeBot",
  "kick",
  "start",
  "draft",
  "submit",
  "veto",
  "confirmVote",
  "next",
  "restart",
  "leave",
]);

export async function POST(request: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  try {
    const body = (await request.json()) as { playerId?: string; action?: Action };
    if (!body.playerId || !body.action || !ACTIONS.has(body.action.type)) {
      return NextResponse.json({ error: "GENERIC" }, { status: 400 });
    }
    await applyAction(normalized, body.playerId.slice(0, 64), body.action);

    if (body.action.type === "leave") return NextResponse.json({ ok: true });

    const state = await getRoomState(normalized, body.playerId);
    return NextResponse.json(state, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    if (err instanceof RoomError) {
      return NextResponse.json({ error: err.code }, { status: err.status });
    }
    console.error("action failed", err);
    return NextResponse.json({ error: "GENERIC" }, { status: 500 });
  }
}
