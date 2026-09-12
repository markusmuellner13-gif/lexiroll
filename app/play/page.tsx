import { PlayHub } from "@/components/PlayHub";
import { isDbConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function Page() {
  return <PlayHub online={isDbConfigured()} />;
}
