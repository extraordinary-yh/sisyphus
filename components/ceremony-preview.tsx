"use client";
import { useEffect, useRef, useState } from "react";
import { rankAt, type Result, type StarEvent } from "@/lib/game";
import { RankCeremony } from "@/components/rank-ceremony";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { IMPACT_MS, TRANSFORM_MS, type Playback } from "@/lib/ceremony";
import { createForgeMix, ForgeAudio, synthesizeCue, type ForgeCue } from "@/lib/ceremony-audio";
const scenarios = [
  { name: "升星与小段晋级", before: 1, deltas: [1, 1, 1] },
  { name: "跨大段晋级与掉段", before: 26, deltas: [1, 1, -1, -1] },
  { name: "王者称号变化", before: 208, deltas: [1, 1, -1, -1] },
  { name: "底分保护", before: 0, deltas: [-1, 1, -1] },
  { name: "零星账单", before: 4, deltas: [] },
];
function fixture(before: number, deltas: number[]): Result {
  let score = before;
  const events: StarEvent[] = deltas.map((delta, i) => {
    const from = score; score = Math.max(0, score + delta);
    return { label: `演出测试 ${i + 1} · ${delta > 0 ? "完成学习" : "娱乐超时"}`, before: from, after: score, delta,
      type: delta > 0 ? "study" : "video", promotion: score > from && rankAt(score).label !== rankAt(from).label,
      demotion: score < from && rankAt(score).label !== rankAt(from).label };
  });
  return { date: "演出预览 · 虚构数据", before, after: score, gained: deltas.filter(d=>d>0).length,
    lost: deltas.filter(d=>d<0).length, net: deltas.reduce((a,b)=>a+b,0), applied: score-before, events,
    perfect:false, streak:0, strictStreak:0, shieldUsed:false, shields:0, bonus:0, studyRemainder:0 };
}
export function CeremonyPreview() {
  const [result, setResult] = useState<Result | null>(null), [sound,setSound]=useState(true), [audioReport,setAudioReport]=useState("");
  const [initialPlayback, setInitialPlayback] = useState<Playback | undefined>();
  const audition = useRef<ForgeAudio | null>(null), auditionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [auditioning, setAuditioning] = useState(false);
  useEffect(() => () => { audition.current?.dispose(); if (auditionTimer.current) clearTimeout(auditionTimer.current); }, []);
  const previewImpact = async () => {
    audition.current?.dispose(); const audio = new ForgeAudio(); audition.current = audio;
    setAuditioning(true);
    try { await audio.unlock(); audio.play("impact"); } catch { setAuditioning(false); }
    auditionTimer.current = setTimeout(() => { audio.dispose(); setAuditioning(false); }, 3200);
  };
  const renderAudio = async () => {
    const report=[];
    for (const cue of ["impact","fracture","promotion","demotion","finish"] as ForgeCue[]) {
      const ctx=new OfflineAudioContext(2,192000,48000), mix=createForgeMix(ctx,ctx.destination);
      synthesizeCue(ctx,mix.input,cue); const buffer=await ctx.startRendering();
      let peak=0,energy=0,tail=0;
      for(let channel=0;channel<buffer.numberOfChannels;channel++) for(const [i,x] of buffer.getChannelData(channel).entries()) {
        peak=Math.max(peak,Math.abs(x));energy+=x*x;if(i>buffer.length-4800)tail=Math.max(tail,Math.abs(x));
      }
      report.push(`${cue}: peak ${peak.toFixed(3)}, RMS ${Math.sqrt(energy/(buffer.length*2)).toFixed(4)}, tail ${tail.toFixed(6)}`);
    }
    setAudioReport(report.join("\n"));
  };
  return <main style={{padding:40,maxWidth:1000,margin:"auto"}}>
    <h1>段位演出预览</h1><p>仅开发环境 · 虚构数据 · 不读取或写入个人数据库</p>
    <button className="gold-button" style={{marginTop:24}} disabled={auditioning} onClick={previewImpact}>{auditioning ? "升星音效播放中…" : "试听升星音效 · 强冲击版"}</button><p style={{fontSize:12,marginTop:10}}>无前置气流声 · 撞击时发声 · 金属共鸣与立体声余响</p>
    <div style={{display:"flex",flexWrap:"wrap",gap:14,marginTop:30}}>{scenarios.map(s=><button className="gold-button" key={s.name} onClick={()=>{setInitialPlayback(undefined);setResult(fixture(s.before,s.deltas));}}>{s.name}</button>)}</div>
    <div style={{display:"flex",gap:12,marginTop:20}}>{[{name:"落星定格",index:0,elapsed:IMPACT_MS-220},{name:"晋级定格",index:0,elapsed:TRANSFORM_MS+900},{name:"掉段定格",index:3,elapsed:TRANSFORM_MS+900}].map(p=><button className="outline-button" key={p.name} onClick={()=>{setInitialPlayback({index:p.index,elapsed:p.elapsed});setResult(fixture(26,[1,1,-1,-1]));}}>{p.name}</button>)}</div>
    <button className="outline-button" style={{marginTop:24}} onClick={renderAudio}>检验合成音效</button><pre aria-label="音效渲染结果">{audioReport}</pre>
    <Dialog open={!!result} onOpenChange={open=>{if(!open)setResult(null);}}><DialogContent className="game-dialog settlement-dialog" onInteractOutside={e=>e.preventDefault()}>
      <DialogTitle className="sr-only">段位演出测试</DialogTitle><DialogDescription className="sr-only">虚构数据，不计入个人战绩</DialogDescription>
      {result && <RankCeremony initialPlayback={initialPlayback} result={result} replay welcome={false} sound={sound} onSoundToggle={()=>setSound(s=>!s)} onClose={()=>setResult(null)}/>}
    </DialogContent></Dialog>
  </main>;
}
