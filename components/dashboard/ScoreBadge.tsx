export function ScoreBadge({ label, score }:{label:string;score:number}) {
  const color = score>=85?"#16a34a":score>=60?"#f59e0b":"#dc2626";
  return (
    <div className="flex items-center justify-between">
      <span className="pill">{label}</span>
      <div className="flex items-center gap-4">
        <div className="bar w-44"><i style={{width:`${Math.min(100,Math.max(0,score))}%`,background:color}}/></div>
        <span className="text-2xl font-extrabold" style={{color}}>{score}/100</span>
      </div>
    </div>
  );
}
