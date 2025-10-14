'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function AddonCard({ addon, userId, status }:{
  addon:{id:string;name:string;tagline:string;price_cents:number;trial_days:number;icon:string;},
  userId:string|null,status?:string
}){
  const [loading,setLoading]=useState(false);
  const owned=status==='active'||status==='trial';
  const price=(addon.price_cents/100).toFixed(2);
  async function purchase(){
    if(!userId) return alert('Sign in to activate.');
    setLoading(true);
    const r=await fetch('/api/addons/purchase',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:userId,addon_id:addon.id})});
    setLoading(false); if(!r.ok) return alert('Error'); location.reload();
  }
  return (
    <motion.div initial={{opacity:0,y:12}} whileInView={{opacity:1,y:0}} transition={{duration:.35}}
      className="ribbon glass border-grad inner-glow p-6 shine">
      <div className="text-3xl">{addon.icon}</div>
      <div className="mt-3 font-semibold">{addon.name}</div>
      <div className="text-sm text-slate-600">{addon.tagline}</div>
      <div className="mt-4 text-sm text-slate-700">€{price}/mo · {addon.trial_days}-day trial</div>
      <div className="mt-5">
        {owned ? <span className="inline-flex px-3 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-sm">Active</span>
          : <button onClick={purchase} disabled={loading} className="px-4 py-2 rounded-lg btn-prem">{loading?'Activating…':'Start Trial'}</button>}
      </div>
    </motion.div>
  );
}
