"use client";
import { useState } from "react";
import { rankAt, type Result, type StarEvent } from "@/lib/game";
import { RankCeremony } from "@/components/rank-ceremony";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { IMPACT_MS, TRANSFORM_MS, type Playback } from "@/lib/ceremony";
import { synthesizeCue, type ForgeCue } from "@/lib/ceremony-audio";
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
  const renderAudio = async () => {
    const report=[];
    for (const cue of ["rise","impact","fracture","promotion","demotion","finish"] as ForgeCue[]) {
      const ctx=new OfflineAudioContext(1,96000,48000), gain=ctx.createGain();gain.gain.value=.6;gain.connect(ctx.destination);
      synthesizeCue(ctx,gain,cue); const data=(await ctx.startRendering()).getChannelData(0);
      let peak=0,energy=0;for(const x of data){peak=Math.max(peak,Math.abs(x));energy+=x*x;}
      report.push(`${cue}: peak ${peak.toFixed(3)}, RMS ${Math.sqrt(energy/data.length).toFixed(4)}`);
    }
    setAudioReport(report.join("\n"));
  };
  return <main style={{padding:40,maxWidth:1000,margin:"auto"}}>
    <h1>段位演出预览</h1><p>仅开发环境 · 虚构数据 · 不读取或写入个人数据库</p>
    <div style={{display:"flex",flexWrap:"wrap",gap:14,marginTop:30}}>{scenarios.map(s=><button className="gold-button" key={s.name} onClick={()=>{setInitialPlayback(undefined);setResult(fixture(s.before,s.deltas));}}>{s.name}</button>)}</div>
    <div style={{display:"flex",gap:12,marginTop:20}}>{[{name:"落星定格",index:0,elapsed:IMPACT_MS-220},{name:"晋级定格",index:0,elapsed:TRANSFORM_MS+900},{name:"掉段定格",index:3,elapsed:TRANSFORM_MS+900}].map(p=><button className="outline-button" key={p.name} onClick={()=>{setInitialPlayback({index:p.index,elapsed:p.elapsed});setResult(fixture(26,[1,1,-1,-1]));}}>{p.name}</button>)}</div>
    <button className="outline-button" style={{marginTop:24}} onClick={renderAudio}>检验合成音效</button><pre aria-label="音效渲染结果">{audioReport}</pre>
    <Dialog open={!!result} onOpenChange={open=>{if(!open)setResult(null);}}><DialogContent className="game-dialog settlement-dialog" onInteractOutside={e=>e.preventDefault()}>
      <DialogTitle className="sr-only">段位演出测试</DialogTitle><DialogDescription className="sr-only">虚构数据，不计入个人战绩</DialogDescription>
      {result && <RankCeremony initialPlayback={initialPlayback} result={result} replay welcome={false} sound={sound} onSoundToggle={()=>setSound(s=>!s)} onClose={()=>setResult(null)}/>}
    </DialogContent></Dialog>
  </main>;
}
