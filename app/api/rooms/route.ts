import { NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db";
import { createRoom, RoomError } from "@/lib/rooms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ online: isDbConfigured() });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      playerId?: string;
      name?: string;
      emoji?: string;
      settings?: unknown;
    };
    if (!body.playerId || typeof body.playerId !== "string") {
      return NextResponse.json({ error: "GENERIC" }, { status: 400 });
    }
    const code = await createRoom({
      playerId: body.playerId.slice(0, 64),
      name: String(body.name ?? ""),
      emoji: String(body.emoji ?? ""),
      settings: body.settings,
    });
    return NextResponse.json({ code });
  } catch (err) {
    if (err instanceof RoomError) {
      return NextResponse.json({ error: err.code }, { status: err.status });
    }
    console.error("create room failed", err);
    return NextResponse.json({ error: "GENERIC" }, { status: 500 });
  }
}
