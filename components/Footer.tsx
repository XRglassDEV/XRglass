export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/60">
      <div className="max-w-7xl mx-auto px-6 py-10 text-sm text-slate-600 flex flex-wrap gap-6 justify-between">
        <div>© {new Date().getFullYear()} XRglass</div>
        <div className="flex gap-4">
          <a href="#">Terms</a>
          <a href="#">Privacy</a>
          <a href="#">Contact</a>
        </div>
      </div>
    </footer>
  );
}
