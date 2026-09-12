import type { Metadata } from "next";
import { SoloGame } from "@/components/SoloGame";

export const metadata: Metadata = { title: "Solo gegen Bots" };

export default function Page() {
  return <SoloGame />;
}
