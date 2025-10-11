type WatchType = "wallet" | "project";
type Threshold = "green" | "orange" | "red";
export type WatchItem = {
  id: string;
  type: WatchType;
  target: string;
  threshold: Threshold;
  webhook?: string | null;
  createdAt: string;
};

const hasSupabase = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE;

async function getSupabase() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!);
}

const MEMORY: WatchItem[] = [];

export async function listItems(): Promise<WatchItem[]> {
  if (hasSupabase) {
    const supa = await getSupabase();
    const { data, error } = await supa.from("watchlist").select("*").order("createdAt", { ascending: false });
    if (error) throw error;
    return data as WatchItem[];
  }
  return MEMORY;
}

export async function addItem(item: WatchItem): Promise<void> {
  if (hasSupabase) {
    const supa = await getSupabase();
    const { error } = await supa.from("watchlist").insert(item);
    if (error) throw error;
    return;
  }
  MEMORY.unshift(item);
}

export async function removeItem(id: string): Promise<void> {
  if (hasSupabase) {
    const supa = await getSupabase();
    const { error } = await supa.from("watchlist").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  const i = MEMORY.findIndex(x => x.id === id);
  if (i >= 0) MEMORY.splice(i, 1);
}

export function supabaseEnabled(): boolean { return hasSupabase; }
