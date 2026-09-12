import type { Metadata } from "next";
import { PlayHub } from "@/components/PlayHub";
import { isDbConfigured } from "@/lib/db";

export const metadata: Metadata = { title: "Mit Freunden spielen" };
export const dynamic = "force-dynamic";

export default function Page() {
  return <PlayHub online={isDbConfigured()} />;
}
