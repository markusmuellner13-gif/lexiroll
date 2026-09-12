import { NextResponse } from "next/server";
import { getRoomState, joinRoom, RoomError } from "@/lib/rooms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

function fail(err: unknown) {
  if (err instanceof RoomError) return NextResponse.json({ error: err.code }, { status: err.status });
  console.error("room request failed", err);
  return NextResponse.json({ error: "GENERIC" }, { status: 500 });
}

export async function GET(request: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  const playerId = new URL(request.url).searchParams.get("playerId") ?? undefined;
  try {
    const state = await getRoomState(normalizeCode(code), playerId ?? undefined);
    return NextResponse.json(state, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(request: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  try {
    const body = (await request.json()) as { playerId?: string; name?: string; emoji?: string };
    if (!body.playerId) return NextResponse.json({ error: "GENERIC" }, { status: 400 });
    const normalized = normalizeCode(code);
    await joinRoom(normalized, {
      id: body.playerId.slice(0, 64),
      name: String(body.name ?? ""),
      emoji: String(body.emoji ?? ""),
    });
    const state = await getRoomState(normalized, body.playerId);
    return NextResponse.json(state, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    return fail(err);
  }
}
