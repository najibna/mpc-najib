import raw from "./demoHome.json";
import { seedFromHome } from "../api/cache";
import type { HomePayload } from "../types/smb";

/** Pre-built dashboard from bundled sample Excel — paints instantly on hosted demo. */
export const DEMO_HOME = raw as HomePayload;

export function seedDemoHome(): void {
  seedFromHome(DEMO_HOME as unknown as Record<string, unknown>);
}
