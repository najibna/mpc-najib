import { useEffect } from "react";
import { getMeta, getPolicy } from "../api/smb";

/** Warm only lightweight tab data after the demo dataset is ready. */
export default function DataPrefetch() {
  useEffect(() => {
    const run = () => {
      getMeta().then((meta) => {
        if (meta.loaded !== false && meta.data_source != null) {
          getPolicy();
        }
      });
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(run, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(run, 800);
    return () => clearTimeout(t);
  }, []);

  return null;
}
