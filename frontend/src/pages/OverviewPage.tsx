import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadHomeProgressive } from "../api/smb";
import ChartView from "../components/ChartView";
import UploadCard from "../components/UploadCard";
import { Panel } from "../components/ui/Card";
import PageHeader, { fmtCurrency } from "../components/ui/PageHeader";
import { PAGES } from "../copy";
import { useDataVersion } from "../hooks/useDataVersion";
import { DEMO_HOME, seedDemoHome } from "../data/demoHome";
import type { CommandCenter, Overview } from "../types/smb";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card text-center sm:text-left">
      <p className="text-sm text-charcoal-muted">{label}</p>
      <p className="mt-3 font-serif text-3xl font-bold text-charcoal">{value}</p>
    </div>
  );
}

function fallbackCommandCenter(data: Overview): CommandCenter {
  return {
    cfo_summary: null,
    scores: {
      transaction_risk: { score: 0, level: "-", label: "Risk", detail: "", drilldown: "/insights" },
      policy_compliance: { score: 0, level: "-", label: "Rules", detail: "", drilldown: "/compliance" },
      vendor_optimization: { score: 0, level: "-", label: "Vendors", detail: "", drilldown: "/insights" },
      methodology: "",
    },
    overview: data,
    violation_count: 0,
    anomaly_count: 0,
    fragmented_vendor_spend: 0,
    projected_burn: data.monthly_avg,
    debit_vs_credit: [],
    budget_disclaimer: null,
  };
}

export default function OverviewPage() {
  const dataVersion = useDataVersion();
  const [data, setData] = useState<Overview | null>(DEMO_HOME.overview);
  const [cc, setCc] = useState<CommandCenter | null>(DEMO_HOME.command_center);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    seedDemoHome();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const force = reloadKey > 0 || dataVersion > 0;
    loadHomeProgressive(force, (overview) => {
      if (!cancelled) setData(overview);
    })
      .then((home) => {
        if (cancelled) return;
        setData(home.overview);
        setCc(home.command_center);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [reloadKey, dataVersion]);

  if (!data) return null;

  const ccData = cc ?? fallbackCommandCenter(data);
  const range = `${data.date_range.start} – ${data.date_range.end}`;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-2 sm:px-8">
      <PageHeader
        hero
        title={PAGES.home.title}
        subtitle={PAGES.home.subtitle}
        actions={
          <>
            <Link to="/ask" className="btn-primary min-w-[180px]">
              {PAGES.home.ctaAsk}
            </Link>
            <Link to="/compliance" className="btn-secondary min-w-[180px]">
              {PAGES.home.ctaRules}
            </Link>
          </>
        }
      />

      <p className="-mt-4 mb-12 text-center text-sm text-charcoal-light">{range}</p>

      <UploadCard onImported={() => setReloadKey((k) => k + 1)} />

      <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-4 lg:gap-6">
        <StatCard label={PAGES.home.stats.totalSpend} value={fmtCurrency(data.total_spend)} />
        <StatCard label={PAGES.home.stats.monthlyAvg} value={fmtCurrency(data.monthly_avg)} />
        <StatCard label={PAGES.home.stats.ruleBreaks} value={String(ccData.violation_count)} />
        <StatCard label={PAGES.home.stats.cards} value={String(data.employee_count)} />
      </div>

      <Panel title={PAGES.home.chartTitle} className="mt-10 chart-panel">
        <ChartView chart="line" data={data.by_month} height={240} />
      </Panel>

      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          { to: "/approvals", label: PAGES.home.links.review, desc: "Say yes or no to flagged charges." },
          { to: "/reports", label: PAGES.home.links.reports, desc: "See charges grouped together." },
          { to: "/insights", label: PAGES.home.links.trends, desc: "Charts about where money goes." },
        ].map((item) => (
          <Link key={item.to} to={item.to} className="feature-card block p-8">
            <h3 className="font-serif text-xl font-semibold text-charcoal">{item.label.replace(" →", "")}</h3>
            <p className="mt-3 text-sm leading-relaxed text-charcoal-muted">{item.desc}</p>
            <span className="mt-5 inline-block text-sm font-semibold text-intact">Learn more →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
