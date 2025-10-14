export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
export async function GET() {
  const sb = supabaseServer();
  const { data, error } = await sb.from('addons').select('*').order('sort_order');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ addons: data });
}
