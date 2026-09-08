import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { starAsset } from './domain';
import type { Star } from './domain';

export const timing = { fade: .4, reduced: .15, rise: 7.2, stagger: .8, arrival: 1.2, unfoldStep: .9, fold: 6 };
const positions = [[26,2],[2,26],[52,20],[18,50],[68,49],[44,73]];

export function Scenery({ reading = false }: { reading?: boolean }) {
  return <><div className="scene-decoration" aria-hidden="true">
    <img className="scene-background" src={`/assets/${reading ? 'read' : 'sky'}-background.svg`} alt=""/>
    <div className="scene-cloud-lane"><img src="/assets/entry-cloud-left.svg" alt=""/></div>
    <div className="scene-cloud-lane second"><img src="/assets/entry-cloud-right.svg" alt=""/></div>
  </div>{!reading && <div className="scene-foreground" aria-hidden="true"><img className="sky-companion" src="/assets/sky-companion.svg" alt=""/><div className="cloud-bank"/></div>}</>;
}

export function Paper({star, step=3}: {star: Star; step?: number}) {
  return <div className="paper" data-paper-step={step}>
    <img src={starAsset(star.emotion,step)} alt={step===3?'กระดาษดาวที่คลี่ออก':'ดาวกระดาษ'}/>{step===3&&<p>{star.content}</p>}</div>;
}

export function Sky({stars,selected,onSelect,paused=false}: {stars: Star[]; selected?:string; onSelect:(star:Star)=>void; paused?:boolean}) {
  const reduced=useReducedMotion();
  return <div className="star-field" aria-label="เลือกดาวที่อยากอ่าน">
    {[0,1,2].map(i=><img className={`wind wind-${i}`} src="/assets/sky-wind.svg" alt="" key={i}/>)}
    {stars.map((s,i)=><button key={s.id} className={`floating-star ${selected===s.id?'selected':''}`} style={{left:`${positions[i%6][0]}%`,top:reduced?`${positions[i%6][1]}%`:undefined,'--star-delay':`${-i*timing.stagger}s`,animationPlayState:paused||selected?'paused':'running'} as CSSProperties} aria-label={`เลือกดาวดวงที่ ${i+1}`} aria-pressed={selected===s.id} onClick={()=>onSelect(s)}><img src={starAsset(s.emotion)} alt=""/></button>)}
  </div>;
}

export function Fold({star,done}: {star:Star;done:()=>void}) {
  const reduced=useReducedMotion();
  const [step,setStep]=useState(3); const [sending,setSending]=useState(false);
  const callback=useRef(done); callback.current=done;
  useEffect(()=>{
    const schedule: Array<[number,()=>void]> = reduced
      ? [[150,()=>setStep(2)],[300,()=>setStep(1)],[450,()=>setStep(0)],[600,()=>callback.current()]]
      : [[1000,()=>setStep(2)],[2200,()=>setStep(1)],[4000,()=>setStep(0)],[4800,()=>setSending(true)],[6000,()=>callback.current()]];
    const timers=schedule.map(([ms,fn])=>setTimeout(fn,ms)); return ()=>timers.forEach(clearTimeout);
  },[reduced]);
  return <><motion.h1 animate={{opacity:sending?0:1}} transition={{duration:.4}}>กำลังส่งดาวของคุณแล้ว...</motion.h1>
    <motion.div className="fold-art" animate={{y:sending?-600:0,opacity:sending?0:1}} transition={{duration:timing.arrival,ease:'easeIn'}}>
      <div className="paper folding"><AnimatePresence initial={false}>{<motion.div key={step} className="fold-layer" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reduced?.15:.9}}><Paper star={star} step={step}/></motion.div>}</AnimatePresence></div>
    </motion.div></>;
}

export function Unfold({star,children}: {star:Star;children:ReactNode}) {
  const reduced=useReducedMotion(); const [step,setStep]=useState(0); const [ready,setReady]=useState(false);
  useEffect(()=>{
    setStep(0);setReady(false);
    const arrival=reduced?0:timing.arrival*1000, interval=reduced?150:timing.unfoldStep*1000;
    const timers=[1,2,3].map(i=>setTimeout(()=>setStep(i),arrival+i*interval));
    timers.push(setTimeout(()=>setReady(true),arrival+4*interval)); return ()=>timers.forEach(clearTimeout);
  },[star.id,reduced]);
  return <div className={`read-sequence ${ready?'is-ready':''}`} data-unfold-step={step}>
    <motion.div initial={reduced?false:{y:500,opacity:0}} animate={{y:0,opacity:1}} transition={{duration:timing.arrival,ease:'easeOut'}} className="read-art">
      <motion.div animate={{scale:step===3?1.44:1}} transition={{duration:reduced?.15:.9}} className="paper folding"><AnimatePresence initial={false}><motion.div key={step} className="fold-layer" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reduced?.15:.9}}><Paper star={star} step={step}/></motion.div></AnimatePresence></motion.div>
    </motion.div>
    {ready&&<motion.div className="read-actions" initial={{opacity:0}} animate={{opacity:1}} transition={{duration:reduced?.15:.4}}>{children}</motion.div>}
  </div>;
}

export function SentScene({star,paused,open}: {star:Star;paused:boolean;open:()=>void}) {
  const reduced=useReducedMotion();
  return <div className="success-field">
    {[0,1,2].map(i=><img className={`wind wind-${i}`} src="/assets/sky-wind.svg" alt="" key={`w${i}`}/>)}
    {positions.map(([x,y],i)=>i===3?<div className="own-star-position" style={{left:`${x}%`,top:`${y}%`,animationPlayState:paused?'paused':'running'}} key={i}>
      <motion.button className="sent-star" initial={reduced?false:{y:240,opacity:0}} animate={{y:0,opacity:1}} transition={{duration:1.2,ease:'easeOut'}} onClick={open} aria-label="อ่านดาวที่เพิ่งส่ง"><img src={starAsset(star.emotion)} alt="ดาวของคุณ"/><span className="sr-only">{star.content}</span></motion.button>
    </div>:<img className="success-star" key={i} src="/assets/sky-star.svg" alt="" style={{left:`${x}%`,top:`${y}%`,opacity:i===0?.3:i<3?.7:1,animationDelay:`${-i}s`,animationPlayState:paused?'paused':'running'}}/>)}
  </div>;
}
