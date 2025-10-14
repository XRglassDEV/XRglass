export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

function isXrpAddress(s: string) {
  return /^r[1-9A-HJ-NP-Za-km-z]{25,35}$/.test(s.trim());
}
function isDomain(s: string) {
  try { const u = new URL(s.startsWith('http')?s:`https://${s}`); return !!u.hostname; } catch { return false; }
}

export async function POST(req: NextRequest) {
  const { input } = await req.json();
  if (!input || typeof input !== 'string') {
    return NextResponse.json({ status:'error', error:'No input' }, { status:400 });
  }
  const kind = isXrpAddress(input) ? 'address' : isDomain(input) ? 'domain' : null;
  if (!kind) return NextResponse.json({ status:'error', error:'Invalid address or domain' }, { status:400 });

  // TODO: plug real logic here
  const trustScore = Math.floor(55 + Math.random() * 45); // 55–99
  const riskLevel = trustScore >= 85 ? 'low' : trustScore >= 70 ? 'medium' : 'high';

  const allFlags = [
    'Owner not verified',
    'No destination tag requirement',
    'Recently created address',
    'Linked domain mismatches issuer',
    'Elevated outbound flow to mixers',
    'Non-standard transfer behavior detected',
  ];
  const flags = trustScore >= 85 ? [] : allFlags.sort(() => 0.5 - Math.random()).slice(2);

  const signals = [
    { label: 'First Seen', value: `${2016 + Math.floor(Math.random()*8)}` },
    { label: 'Exchange Exposure', value: `${Math.floor(Math.random()*40)}%` },
    { label: 'Wash-Trade Likelihood', value: `${Math.floor(Math.random()*25)}%` },
    { label: 'Known Cluster', value: Math.random() > 0.5 ? 'Yes' : 'No' },
    { label: 'Social Risk', value: ['Low','Elevated','High'][Math.floor(Math.random()*3)] },
  ];

  return NextResponse.json({
    status: 'ok',
    kind, input, trustScore, riskLevel, flags,
    recommendations: [
      'Verify issuer domain and meta-tags',
      'Enable RequireDestTag on receiving accounts',
      'Use watchlists for counterparties over 10k XRP'
    ],
    signals
  });
}
