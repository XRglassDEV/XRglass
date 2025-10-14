export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

function isXrpAddress(s: string) {
  return /^r[1-9A-HJ-NP-Za-km-z]{25,35}$/.test(s.trim());
}
function isDomain(s: string) {
  try { const u = new URL(s.startsWith('http')?s:`https://${s}`); return !!u.hostname; } catch { return false; }
}

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json();
    if (!input || typeof input !== 'string')
      return NextResponse.json({ status:'error', error:'No input' }, { status:400 });

    const kind = isXrpAddress(input) ? 'address' : isDomain(input) ? 'domain' : null;
    if (!kind)
      return NextResponse.json({ status:'error', error:'Invalid address or domain' }, { status:400 });

    // TODO: call your existing internal XRglass logic instead of mock:
    // const resp = await fetch(process.env.INTERNAL_CHECK_URL!, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ input }) });
    // const data = await resp.json();

    // Mock result (replace with real):
    const trustScore = Math.floor(60 + Math.random()*35);
    const flags = trustScore > 85 ? [] : ['Owner not verified','No dest tag requirement'];
    const riskLevel = trustScore >= 85 ? 'low' : trustScore >= 70 ? 'medium' : 'high';

    return NextResponse.json({
      status:'ok',
      kind, input,
      trustScore, riskLevel,
      flags,
      recommendations: ['Enable RequireDestTag','Verify issuer domain','Rotate tokens if unused']
    });
  } catch (e: any) {
    return NextResponse.json({ status:'error', error: e?.message || 'Scan failed' }, { status:500 });
  }
}
