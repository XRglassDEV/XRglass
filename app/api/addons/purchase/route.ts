export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  const { user_id, addon_id } = await req.json();
  if (!user_id || !addon_id) return NextResponse.json({ error:'Missing fields' }, { status:400 });
  const sb = supabaseServer();
  const { error } = await sb.from('user_addons').upsert({ user_id, addon_id, status: 'trial' });
  if (error) return NextResponse.json({ error: error.message }, { status:500 });
  return NextResponse.json({ ok:true });
}
