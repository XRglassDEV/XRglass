import { supabaseServer } from '@/lib/supabaseServer';

export default async function Dashboard() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-slate-600">Please sign in to access XRglass Pro.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold">Welcome, {user.email}</h1>
      <p className="mt-2 text-slate-600">Your scans, watchlists and add-ons appear here.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="p-6 rounded-2xl border border-white/60 bg-white/60 backdrop-blur">
          <div className="font-semibold">Recent Scans</div>
          <div className="text-sm text-slate-600 mt-2">No scans yet.</div>
        </div>
        <div className="p-6 rounded-2xl border border-white/60 bg-white/60 backdrop-blur">
          <div className="font-semibold">Watchlist</div>
          <div className="text-sm text-slate-600 mt-2">Add wallets to monitor.</div>
        </div>
      </div>
    </div>
  );
}
