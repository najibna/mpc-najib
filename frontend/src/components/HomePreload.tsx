import { useEffect } from "react";
import { ensureAskReady, getHome, probeApiLive, seedAllDemoData } from "../api/smb";

/** Warm live API in background (bundled demo already seeded in main.tsx). */
export default function HomePreload() {
  useEffect(() => {
    seedAllDemoData();
    probeApiLive().catch(() => undefined);
    ensureAskReady().catch(() => undefined);
    getHome().catch(() => undefined);
  }, []);
  return null;
}
