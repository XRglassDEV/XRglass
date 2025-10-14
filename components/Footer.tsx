import Link from "next/link";

const footerLinks = [
  {
    heading: "Product",
    links: [
      { label: "XRglass Pro", href: "/pro" },
      { label: "Trust Engine", href: "#platform" },
      { label: "Workflow", href: "#workflow" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#stories" },
      { label: "Partners", href: "#ecosystem" },
      { label: "Support", href: "mailto:hello@xrglass.xyz" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "API Docs", href: "https://docs.xrglass.xyz" },
      { label: "Security", href: "#security" },
      { label: "Status", href: "https://status.xrglass.xyz" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative z-10 mt-24 border-t border-white/10 bg-black/40">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-16 sm:px-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-md space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-white/70">
            XRGLASS
          </div>
          <p className="text-sm text-white/60">
            Visionary trust infrastructure for XRPL ecosystems. Crafted in Europe, deployed to the world.
          </p>
          <div className="flex gap-4 text-xs text-white/40">
            <Link href="/terms" className="transition hover:text-white/80">
              Terms
            </Link>
            <Link href="/privacy" className="transition hover:text-white/80">
              Privacy
            </Link>
            <Link href="mailto:hello@xrglass.xyz" className="transition hover:text-white/80">
              hello@xrglass.xyz
            </Link>
          </div>
        </div>
        <div className="grid flex-1 grid-cols-1 gap-10 sm:grid-cols-2 lg:max-w-3xl lg:grid-cols-3">
          {footerLinks.map((column) => (
            <div key={column.heading} className="space-y-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">
                {column.heading}
              </h3>
              <ul className="space-y-3 text-sm text-white/60">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="transition hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10 bg-black/50 py-6 text-center text-xs text-white/40">
        © {new Date().getFullYear()} XRglass Labs. Crafted for premium XRPL due diligence.
      </div>
    </footer>
  );
}
