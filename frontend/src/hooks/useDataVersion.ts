import { useEffect, useState } from "react";
import { getDataVersion, subscribeDataVersion } from "../api/cache";

/** Re-run effects when dataset changes (import, reset, mutations). */
export function useDataVersion(): number {
  const [version, setVersion] = useState(getDataVersion);
  useEffect(() => subscribeDataVersion(() => setVersion(getDataVersion())), []);
  return version;
}
