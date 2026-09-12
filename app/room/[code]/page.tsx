import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoomGame } from "@/components/RoomGame";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  return { title: `Raum ${code.toUpperCase()}` };
}

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length < 4 || clean.length > 6) notFound();
  return <RoomGame code={clean} />;
}
