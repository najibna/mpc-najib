import PageHeader from "../components/ui/PageHeader";

const STACK = [
  "Java",
  "Spring Boot",
  "Maven",
  "MongoDB",
  "RabbitMQ",
  "Docker",
  "Kubernetes",
  "AWS-ready",
  "React",
  "TypeScript",
] as const;

const FLOW = [
  { title: "React frontend", detail: "TypeScript UI for uploads, rule checks, approvals, and Ask AI." },
  { title: "Spring Boot API", detail: "REST controllers, services, DTOs, and policy engine (Maven / Java 21)." },
  { title: "MongoDB", detail: "Transactions, violations, review decisions, AI explanations, and reports." },
  { title: "RabbitMQ", detail: "Async events: transactions.uploaded → policy checks → review & report events." },
] as const;

export default function ArchitecturePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="System architecture"
        subtitle="Microservices-style demo: layered Spring Boot backend, document store, and async messaging."
      />

      <section className="rounded-2xl border border-intact-red/15 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-intact-navy">Request flow</h2>
        <div className="mt-6 flex flex-col items-center gap-3 text-center md:flex-row md:justify-center md:gap-4">
          {FLOW.map((step, i) => (
            <div key={step.title} className="flex flex-col items-center gap-3 md:flex-row">
              <div className="min-w-[200px] rounded-xl border border-intact-cream bg-intact-cream/40 px-4 py-3">
                <p className="font-semibold text-intact-red">{step.title}</p>
                <p className="mt-1 text-sm text-intact-navy/80">{step.detail}</p>
              </div>
              {i < FLOW.length - 1 && (
                <span className="hidden text-2xl text-intact-red md:inline" aria-hidden>
                  →
                </span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-intact-navy/70">
          Upload Excel → API stores rows in MongoDB → RabbitMQ triggers policy scan → violations & reports
          persisted → UI reads via REST.
        </p>
      </section>

      <section className="rounded-2xl border border-intact-red/15 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-intact-navy">Tech stack</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {STACK.map((label) => (
            <span
              key={label}
              className="rounded-full border border-intact-red/25 bg-intact-red/5 px-3 py-1 text-sm font-medium text-intact-navy"
            >
              {label}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-intact-red/15 bg-intact-cream/30 p-6">
        <h2 className="text-lg font-semibold text-intact-navy">API surface (intern-ready)</h2>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-intact-navy/90">
          <li><code className="text-intact-red">GET /api/health</code> — service, MongoDB, RabbitMQ status</li>
          <li><code className="text-intact-red">GET /api/transactions</code> · <code className="text-intact-red">POST /api/transactions/upload</code></li>
          <li><code className="text-intact-red">GET /api/transactions/risky</code></li>
          <li>
            <code className="text-intact-red">POST /api/reviews/{"{id}"}/approve|deny</code>
          </li>
          <li><code className="text-intact-red">GET /api/reports/summary</code></li>
          <li>Legacy demo routes under <code className="text-intact-red">/api/smb/*</code> unchanged for the UI</li>
        </ul>
      </section>
    </div>
  );
}
