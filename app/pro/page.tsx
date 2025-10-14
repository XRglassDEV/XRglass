const plans = [
  {
    name: "Starter",
    price: "€12",
    cadence: "per month",
    description: "Perfect for individual analysts validating a handful of wallets each week.",
    highlights: [
      "Real-time XRPL wallet screening",
      "Up to 10 smart alerts",
      "CSV export of weekly scans",
    ],
    cta: "Start trial",
    popular: false,
  },
  {
    name: "Premium",
    price: "€29",
    cadence: "per month",
    description: "Unlock AI heuristics, anomaly hints and priority support for growing teams.",
    highlights: [
      "VaultGuard AI heuristics",
      "Unlimited WhaleScope alerts",
      "TrustShield badge toolkit",
    ],
    cta: "Upgrade to Premium",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Let’s talk",
    cadence: "custom pricing",
    description: "For exchanges, regulators and partners who need white-glove onboarding.",
    highlights: [
      "Dedicated success engineer",
      "High-volume Verify API access",
      "On-prem compliance workflows",
    ],
    cta: "Book a call",
    popular: false,
  },
];

const addOns = [
  {
    name: "TrustShield Badge",
    price: "€2.99/m",
    desc: "Showcase verification anywhere with a live-updating trust widget.",
  },
  {
    name: "WhaleScope Alerts",
    price: "€4.99/m",
    desc: "Receive push alerts for large holder or sanctioned wallet activity.",
  },
  {
    name: "VaultGuard AI",
    price: "€5.99/m",
    desc: "Machine learning anomaly hints and confidence scoring per scan.",
  },
  {
    name: "Verify API",
    price: "€1.99/m",
    desc: "Embed streamlined verifications directly inside your own product UI.",
  },
  {
    name: "Audit Reports",
    price: "€3.99/m",
    desc: "Schedule branded PDF summaries and forensic-ready CSV exports.",
  },
  {
    name: "All-Access Pack",
    price: "€24.99/m",
    desc: "Every add-on bundled with centralized billing and SLA upgrades.",
  },
];

const trustSignals = [
  {
    label: "99.98% API uptime",
    description: "Globally replicated infrastructure with active failover.",
  },
  {
    label: "SOC2 Type II ready",
    description: "Security controls audited annually by independent assessors.",
  },
  {
    label: "256-bit encryption",
    description: "Data encrypted in transit and at rest with rotating keys.",
  },
];

const faqs = [
  {
    q: "Can I move between plans whenever I want?",
    a: "Yes. Upgrades are instant and downgrades take effect at the end of your billing cycle so you never lose data mid-month.",
  },
  {
    q: "Do you support teams or multi-seat billing?",
    a: "Premium includes five seats by default and Enterprise expands to unlimited seats plus SCIM provisioning.",
  },
  {
    q: "Is there a non-profit or educator discount?",
    a: "Absolutely. Reach out to hello@xrglass.io and we can apply a 40% credit to verified non-profit accounts.",
  },
];

export default function ProPage() {
  return (
    <main className="space-y-16">
      <section className="relative overflow-hidden rounded-3xl border border-sky-100 bg-white/60 p-10 pb-14 shadow-[0_30px_80px_-40px_rgba(8,47,73,0.35)]">
        <div className="absolute -top-32 right-6 h-64 w-64 rounded-full bg-sky-200/50 blur-3xl" aria-hidden />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" aria-hidden />
        <div className="relative grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:items-center">
          <div className="space-y-6">
            <span className="badge">Introducing XRglass Pro</span>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Compliance-grade clarity for XRP wallets, projects and ecosystems.
            </h1>
            <p className="text-lg text-slate-600 md:text-xl">
              XRglass Pro unlocks deeper intelligence, automated workflows and actionable alerts designed for security teams and on-chain analysts.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button className="btn btn-glow btn-glow--pulse px-6 py-3 text-base font-semibold">
                Start 14-day free trial
              </button>
              <button className="btn bg-slate-900 text-white hover:bg-slate-800">
                Talk to sales
              </button>
            </div>
            <ul className="grid gap-4 sm:grid-cols-3">
              {trustSignals.map((signal) => (
                <li key={signal.label} className="card border-none bg-white/70 p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">{signal.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{signal.description}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="card relative overflow-hidden border-sky-100 bg-white/70 p-8">
            <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-sky-100 blur-2xl" aria-hidden />
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/60 to-white/20" aria-hidden />
            <div className="relative space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide text-sky-500">Live intelligence snapshot</p>
                  <p className="text-2xl font-semibold">XRPL Overview</p>
                </div>
                <span className="badge">Updated 2m ago</span>
              </div>
              <div className="grid gap-4">
                {["Wallet risk scoring", "Smart contract heuristics", "Exchange inflow tracking"].map((item) => (
                  <div key={item} className="rounded-xl border border-sky-100/80 bg-white/80 px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">{item}</p>
                    <p className="text-xs text-slate-500">Pro-only</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-sky-200 bg-slate-900 px-5 py-4 text-white">
                <p className="text-sm uppercase tracking-wide text-sky-200">Auto-export</p>
                <p className="mt-1 text-lg font-semibold">Send detailed reports every Monday at 08:00 UTC.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-10">
        <div className="space-y-3 text-center">
          <h2 className="text-3xl font-semibold">Choose a plan that scales with you</h2>
          <p className="mx-auto max-w-2xl text-slate-600">
            Every plan includes unlimited scans, instant blacklist checks and access to the XRglass dashboard. Upgrade for deeper intelligence, collaboration and governance tooling.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`card relative flex flex-col gap-6 p-8 ${
                plan.popular ? "border-sky-300 shadow-[0_25px_60px_-35px_rgba(14,165,233,0.65)]" : ""
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 right-6 rounded-full bg-sky-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-lg">
                  Most popular
                </span>
              )}
              <header className="space-y-2">
                <h3 className="text-2xl font-semibold">{plan.name}</h3>
                <p className="text-sm text-slate-500">{plan.description}</p>
              </header>
              <div>
                <span className="text-4xl font-semibold text-slate-900">{plan.price}</span>
                <span className="ml-2 text-sm text-slate-500">{plan.cadence}</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                {plan.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
              <button className={`btn w-full ${plan.popular ? "bg-sky-500 hover:bg-sky-400" : "bg-slate-900 hover:bg-slate-800"}`}>
                {plan.cta}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold">Add-ons crafted for compliance workflows</h2>
          <p className="text-slate-600">Mix and match capabilities to customise XRglass Pro for your organisation.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {addOns.map((addon) => (
            <div key={addon.name} className="card flex flex-col gap-3 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{addon.name}</h3>
                <span className="badge">{addon.price}</span>
              </div>
              <p className="text-sm text-slate-600">{addon.desc}</p>
              <button className="btn mt-auto w-full">Activate</button>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 rounded-3xl border border-sky-100 bg-white/70 p-10 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold">Pro-grade automation from first scan to audit trail</h2>
          <p className="text-slate-600">
            XRglass Pro is designed around the workflows our customers rely on: swift risk decisions, frictionless reporting and collaboration with the wider XRP community.
          </p>
          <ul className="space-y-4 text-sm text-slate-600">
            {[
              "Trigger on-chain scans from Slack, Teams or custom webhooks.",
              "Create saved views with wallet groups and alert presets.",
              "Automatically route high-risk findings to your compliance queue.",
              "Maintain immutable audit trails ready for regulators.",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-0.5 h-2.5 w-2.5 flex-none rounded-full bg-sky-400" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card space-y-4 p-8">
          <div className="rounded-2xl border border-sky-100/70 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 text-white">
            <p className="text-sm uppercase tracking-wide text-sky-200">Workflow recipe</p>
            <h3 className="mt-2 text-2xl font-semibold">XRglass → Slack → Jira</h3>
            <p className="mt-3 text-sm text-slate-200">
              Connect XRglass Pro with your workspace to triage risk events instantly, notify teams in Slack and create Jira issues with embedded scan context.
            </p>
          </div>
          <div className="rounded-2xl border border-sky-100/80 bg-white/70 p-6">
            <p className="text-sm font-semibold text-slate-900">&ldquo;The anomaly hints helped us detect a compromised validator in under five minutes.&rdquo;</p>
            <p className="mt-3 text-sm text-slate-500">— Sofia Martínez, Compliance Lead @ RippleNet Partner</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-sky-100 bg-white/70 p-10">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold">Frequently asked questions</h2>
            <p className="text-slate-600">Everything you need to know about XRglass Pro plans, billing and account management.</p>
          </div>
          <dl className="space-y-6">
            {faqs.map((item) => (
              <div key={item.q} className="rounded-2xl border border-sky-100/70 bg-white/60 p-6">
                <dt className="text-lg font-semibold text-slate-900">{item.q}</dt>
                <dd className="mt-2 text-sm text-slate-600">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </main>
  );
}
