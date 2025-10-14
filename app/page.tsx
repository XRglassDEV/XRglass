// app/page.tsx
import Link from "next/link";
import Scanner from "@/components/Scanner";

/* ---------- Types ---------- */
type Stat = { label: string; value: string };
type Pillar = { title: string; description: string; highlight: string };
type Capability = { eyebrow: string; title: string; copy: string; bullets: string[] };
type Stage = { title: string; description: string; time: string };
type Testimonial = { quote: string; author: string; role: string };

/* ---------- Content ---------- */
const heroStats: Stat[] = [
  { label: "wallets verified", value: "2.4M+" },
  { label: "alerts processed", value: "54B" },
  { label: "global uptime", value: "99.998%" },
];

const platformPillars: Pillar[] = [
  {
    title: "Prism Trust Graph",
    description:
      "Cluster XRPL wallets with live heuristics, sanction screening, and provenance tracing. Visualise ownership and counterparties instantly.",
    highlight: "11M+ labelled relationships",
  },
  {
    title: "Sentinel Automations",
    description:
      "Compose real-time policies from high-signal triggers. Route to Slack, Telegram, SIEM, or custom webhooks without code.",
    highlight: "70+ programmable actions",
  },
  {
    title: "Aurora Risk Studio",
    description:
      "Layer AI narratives, anomaly explanations, and compliance-grade exports. Designed for boards, regulators, and elite partners.",
    highlight: "GDPR & SOC2 aligned",
  },
];

const capabilityCards: Capability[] = [
  {
    eyebrow: "Real-time Intelligence",
    title: "Decode every XRPL wallet in milliseconds",
    copy:
      "XRglass ingests on-chain, sanction, darknet, and behavioural intelligence into a single cinematic profile. Align your risk desk, compliance, and investigations in one lens.",
    bullets: [
      "Live reputation scoring with contextual confidence",
      "Path tracing for 30 hops with automated anomaly notes",
      "Persona stitching across custodial exchange, DeFi, and NFT activity",
    ],
  },
  {
    eyebrow: "Automation",
    title: "Design precision guardrails that run themselves",
    copy:
      "Build workflows that combine deterministic checks with AI heuristics. Approvals, escalations, and audit trails ship out-of-the-box.",
    bullets: [
      "Policy composer with role-based controls",
      "Native Slack, Teams, and PagerDuty bridges",
      "Immutable evidence vault with exportable attestations",
    ],
  },
  {
    eyebrow: "Enterprise trust",
    title: "Premium security posture, globally replicated",
    copy:
      "Hardened infrastructure with multi-region presence, private networking, and on-premise deployment options to satisfy the most demanding regulators.",
    bullets: [
      "EU and US data residency with dedicated clusters",
      "Hardware-backed key isolation and zero-trust access",
      "Quarterly third-party audits with shared reports",
    ],
  },
];

const workflowStages: Stage[] = [
  { title: "Sense",    description: "Continuous monitoring across XRPL, DEX, NFT, sanction, and behavioural feeds.", time: "sub-second ingest" },
  { title: "Interpret",description: "AI narratives and heuristics summarise risk posture for every wallet and project.", time: "<120ms inference" },
  { title: "Decide",   description: "Policy automations escalate to the right teams with approval routing and evidence.", time: "0 manual triage" },
  { title: "Assure",   description: "Export branded attestations and compliance packets for partners and regulators.", time: "one-click" },
];

const testimonials: Testimonial[] = [
  {
    quote:
      "XRglass became our mission control for XRPL trust overnight. The cinematic narratives mean every stakeholder speaks the same language.",
    author: "Elena Marques",
    role: "Chief Risk Officer, RippleWave",
  },
  {
    quote:
      "Their Sentinel automations cleared 68% of manual reviews in month one. We now orchestrate escalations directly into ServiceNow.",
    author: "Noah Park",
    role: "Head of Compliance, HorizonX",
  },
  {
    quote:
      "Aurora Studio delivers board-ready reporting in minutes. It’s the premium standard for regulated XRPL institutions.",
    author: "Sofia Laurent",
    role: "Managing Partner, Meridian Capital",
  },
];

const partnerHighlights = ["XRPL Foundation", "Gatehub", "Coil", "Uphold", "OnXRP", "Bitstamp"];

/* ---------- Page ---------- */
export default function HomePage() {
  return (
    <div className="space-y-28">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-[40px] border border-white/10 bg-white/5 px-6 pb-16 pt-24 shadow-[0_28px_80px_rgba(10,18,40,0.5)] sm:px-12 lg:px-16">
        <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/30 to-transparent" aria-hidden />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" aria-hidden />
        <div className="grid gap-12 lg:grid-cols-[1.35fr_1fr] lg:items-end">
          <div className="space-y-8">
            <span className="tag-pill">ultra-premium xrpl trust</span>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Cinematic intelligence for elite XRPL operators
            </h1>
            <p className="max-w-2xl text-balance text-base text-white/70 sm:text-lg">
              XRglass fuses AI narratives, behavioural analytics, and programmable automations into a single pane.
              See risk, orchestrate responses, and deliver regulator-grade evidence in minutes.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/pro" className="btn-premium">Request private preview</Link>
              <Link href="#platform"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm text-white/70 transition hover:border-white/40 hover:text-white">
                Explore platform <span aria-hidden>↗</span>
              </Link>
            </div>
          </div>
          <div className="glass-panel--soft relative overflow-hidden px-6 py-8 sm:px-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.22),transparent_65%)]" aria-hidden />
            <div className="relative space-y-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">live signal stream</p>
                <p className="mt-3 text-2xl font-semibold text-white">VaultGuard AI</p>
                <p className="mt-2 text-sm text-white/60">Predictive heuristics surface behavioural anomalies before funds move.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {heroStats.map((stat: Stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                    <p className="text-2xl font-semibold text-gradient">{stat.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.35em] text-white/50">{stat.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/40">enterprise ready · soc2 · gdpr · iso 27001</p>
            </div>
          </div>
        </div>
      </section>

      {/* 🔥 FREE SCANNER (for everyone) */}
      <Scanner />

      {/* PLATFORM */}
      <section id="platform" className="space-y-12">
        <div className="grid gap-6 text-center">
          <span className="tag-pill mx-auto">platform layers</span>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Three pillars that reimagine trust operations
          </h2>
          <p className="mx-auto max-w-2xl text-balance text-sm text-white/60 sm:text-base">
            Every layer is co-designed with exchanges, institutions, and regulators.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {platformPillars.map((p: Pillar) => (
            <div key={p.title} className="glass-panel--soft shadow-ring flex h-full flex-col gap-6 p-6">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.4em] text-white/60">
                {p.highlight}
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">{p.title}</h3>
                <p className="text-sm leading-relaxed text-white/60">{p.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CAPABILITIES */}
      <section id="capabilities" className="space-y-12">
        <div className="grid gap-6 text-center">
          <span className="tag-pill mx-auto">capabilities</span>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Designed for teams who cannot compromise on clarity
          </h2>
          <p className="mx-auto max-w-2xl text-balance text-sm text-white/60 sm:text-base">
            From compliance to investigations, XRglass aligns every stakeholder with a single truth.
          </p>
        </div>
        <div className="space-y-6">
          {capabilityCards.map((card: Capability) => (
            <div key={card.title} className="glass-panel--soft shadow-ring grid gap-6 px-6 py-10 md:grid-cols-[1.2fr_1fr] md:items-center md:px-10">
              <div className="space-y-5">
                <span className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-200/80">{card.eyebrow}</span>
                <h3 className="text-2xl font-semibold text-white sm:text-3xl">{card.title}</h3>
                <p className="text-sm text-white/60 sm:text-base">{card.copy}</p>
              </div>
              <ul className="space-y-4 text-sm text-white/70">
                {card.bullets.map((item: string) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-gradient-to-br from-sky-400 to-violet-500" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* WORKFLOW */}
      <section id="workflow" className="space-y-12">
        <div className="grid gap-6 text-center">
          <span className="tag-pill mx-auto">workflow</span>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            A cinematic loop from signal to assurance
          </h2>
        </div>
        <div className="glass-panel overflow-hidden px-6 py-12 sm:px-10">
          <div className="grid gap-10 md:grid-cols-4">
            {workflowStages.map((stage: Stage, i: number) => (
              <div key={stage.title} className="space-y-5">
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.4em] text-white/60">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm text-white/80">
                    0{i + 1}
                  </span>
                  {stage.time}
                </div>
                <h3 className="text-lg font-semibold text-white">{stage.title}</h3>
                <p className="text-sm leading-relaxed text-white/60">{stage.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STORIES / PARTNERS */}
      <section id="stories" className="space-y-12">
        <div className="grid gap-6 text-center">
          <span className="tag-pill mx-auto">stories</span>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Trusted by the most discerning XRPL institutions
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm uppercase tracking-[0.35em] text-white/40">
            {partnerHighlights.map((partner: string) => (
              <span key={partner} className="rounded-full border border-white/10 px-5 py-2 text-white/60">
                {partner}
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t: Testimonial) => (
            <div key={t.author} className="glass-panel--soft flex h-full flex-col gap-6 p-6">
              <p className="text-sm leading-relaxed text-white/80">“{t.quote}”</p>
              <div className="space-y-1 text-xs uppercase tracking-[0.35em] text-white/50">
                <p>{t.author}</p>
                <p className="text-white/40">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-900/40 px-6 py-16 text-center shadow-[0_28px_80px_rgba(10,18,40,0.5)] sm:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_65%)]" aria-hidden />
        <div className="relative space-y-6">
          <span className="tag-pill mx-auto">next chapter</span>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Request the ultra-premium XRglass private preview
          </h2>
          <p className="mx-auto max-w-2xl text-balance text-sm text-white/60 sm:text-base">
            Join a curated collective shaping the future of XRPL trust.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/pro" className="btn-premium">Schedule immersion call</Link>
            <Link href="mailto:hello@xrglass.xyz"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm text-white/70 transition hover:border-white/40 hover:text-white">
              Email our trust desk
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
