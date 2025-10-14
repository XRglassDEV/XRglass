'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function AnimatedBackground(){
  const ripples = useRef<HTMLDivElement>(null);
  const lines = useRef<HTMLDivElement>(null);
  const inited = useRef(false);

  useEffect(() => {
    if (inited.current) return; inited.current = true;
    if (!ripples.current || !lines.current) return;

    const created: HTMLElement[] = [];

    // Liquid light blobs (A)
    Array.from({length:4}).forEach((_,i)=>{
      const el=document.createElement('div');
      el.style.position='absolute'; el.style.borderRadius='9999px';
      el.style.width=`${600+i*120}px`; el.style.height=`${600+i*120}px`;
      el.style.left=`${(i%2?62:22)}%`; el.style.top=`${(i%2?28:58)}%`;
      el.style.transform='translate(-50%,-50%)';
      el.style.background='radial-gradient(closest-side,rgba(255,255,255,.75),rgba(210,235,255,.08),rgba(0,0,0,0))';
      el.style.filter='blur(30px)'; el.style.opacity='0.55';
      ripples.current!.appendChild(el); created.push(el);
      gsap.to(el,{duration:12+i*2,yoyo:true,repeat:-1,opacity:.35+.25*Math.random(),x:(Math.random()*60-30),y:(Math.random()*40-20),ease:'sine.inOut'});
    });

    // Particle lines (B)
    Array.from({length:20}).forEach(()=>{
      const el=document.createElement('div');
      el.style.position='absolute'; el.style.height='1px';
      el.style.width=`${120+Math.random()*240}px`;
      el.style.background='linear-gradient(90deg,rgba(150,210,255,0),rgba(60,130,255,.65),rgba(150,210,255,0))';
      el.style.top=`${Math.random()*100}%`; el.style.left=`${Math.random()*100}%`;
      el.style.opacity=`${0.2+Math.random()*0.4}`; lines.current!.appendChild(el); created.push(el);
      gsap.to(el,{duration:8+Math.random()*6,x:100*(Math.random()<.5?-1:1),repeat:-1,yoyo:true,ease:'sine.inOut'});
    });

    return ()=>{ created.forEach(el=>el.remove()); };
  },[]);

  return (<>
    <div ref={ripples} className="pointer-events-none fixed inset-0 -z-10"/>
    <div ref={lines} className="pointer-events-none fixed inset-0 -z-10"/>
  </>);
}
