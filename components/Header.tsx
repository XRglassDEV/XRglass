export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/50 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="font-semibold text-xl">XRglass</a>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="/">Home</a>
          <a href="/marketplace">Marketplace</a>
          <a href="/pricing">Pricing</a>
          <a href="/dashboard" className="px-3 py-1 rounded-md bg-gradient-to-r from-sky-400 to-blue-700 text-white">XRglass Pro</a>
        </nav>
        <button className="md:hidden text-slate-700">☰</button>
      </div>
    </header>
  );
}
