import { useLayoutEffect, useMemo, useState, type ComponentType } from "react";
import { matchPath, useLocation } from "react-router-dom";
import AuditPage from "../pages/AuditPage";
import ApprovalsPage from "../pages/ApprovalsPage";
import AskPage from "../pages/AskPage";
import CompliancePage from "../pages/CompliancePage";
import EmployeesPage from "../pages/EmployeesPage";
import InsightsPage from "../pages/InsightsPage";
import OverviewPage from "../pages/OverviewPage";
import ReportsPage from "../pages/ReportsPage";

type RouteDef = { path: string; Component: ComponentType; end?: boolean };

const ROUTES: RouteDef[] = [
  { path: "/", Component: OverviewPage, end: true },
  { path: "/ask", Component: AskPage },
  { path: "/compliance", Component: CompliancePage },
  { path: "/approvals", Component: ApprovalsPage },
  { path: "/reports", Component: ReportsPage },
  { path: "/insights", Component: InsightsPage },
  { path: "/employees", Component: EmployeesPage },
  { path: "/audit", Component: AuditPage },
];

const HOME_KEY = "/#end";

function routeKey(path: string, end?: boolean): string {
  return end ? `${path}#end` : path;
}

function isActiveRoute(path: string, end: boolean | undefined, pathname: string): boolean {
  return !!matchPath({ path, end: end ?? false }, pathname);
}

function activeRouteKey(pathname: string): string | null {
  for (const r of ROUTES) {
    if (isActiveRoute(r.path, r.end, pathname)) {
      return routeKey(r.path, r.end);
    }
  }
  return null;
}

/** Keep visited pages mounted; always show the active route (fixes blank screen on refresh). */
export default function PersistentRoutes() {
  const location = useLocation();
  const pathname = location.pathname;
  const activeKey = activeRouteKey(pathname) ?? HOME_KEY;

  const [visited, setVisited] = useState<Set<string>>(() => new Set([HOME_KEY, activeKey]));

  useLayoutEffect(() => {
    const key = activeRouteKey(pathname) ?? HOME_KEY;
    setVisited((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }, [pathname]);

  const visibleKeys = useMemo(() => {
    const keys = new Set(visited);
    keys.add(HOME_KEY);
    keys.add(activeKey);
    return keys;
  }, [visited, activeKey]);

  return (
    <>
      {ROUTES.map(({ path, Component, end }) => {
        const key = routeKey(path, end);
        if (!visibleKeys.has(key)) return null;
        const active = key === activeKey;
        return (
          <div key={key} className={active ? undefined : "hidden"} aria-hidden={!active}>
            <Component />
          </div>
        );
      })}
    </>
  );
}
