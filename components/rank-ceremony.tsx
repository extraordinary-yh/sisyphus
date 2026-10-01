"use client";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX, SkipForward } from "lucide-react";
import { rankAt, type Result } from "@/lib/game";
import { advancePlayback, eventDuration, IMPACT_MS, INTRO_MS, socketFrame, TRANSFORM_MS, type Playback } from "@/lib/ceremony";
import { ForgeAudio, type ForgeCue } from "@/lib/ceremony-audio";
import { Crest, ForgedStar } from "@/components/rank-art";
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => 1 - (1-clamp(n)) ** 3;
const signed = (n: number) => n > 0 ? `+${n}` : String(n);

export function RankCeremony({ result, replay, welcome, sound, onSoundToggle, onClose, initialPlayback }: {
  result: Result; replay: boolean; welcome: boolean; sound: boolean; onSoundToggle: () => void; onClose: () => void; initialPlayback?: Playback;
}) {
  const [cursor, setCursor] = useState<Playback>(initialPlayback ?? { index: -1, elapsed: 0 });
  const [paused, setPaused] = useState(!!initialPlayback), [speed, setSpeed] = useState(1);
  const [reduced, setReduced] = useState(false), [audioReady, setAudioReady] = useState(false);
  const engine = useRef<ForgeAudio | null>(null), cues = useRef(new Set<string>());
  const finished = cursor.index >= result.events.length;
  const event = cursor.index >= 0 && !finished ? result.events[cursor.index] : null;
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches); update(); media.addEventListener("change", update);
    const audio = new ForgeAudio(); engine.current = audio;
    let active = true;
    const unlock = () => { void audio.unlock().then(ready => { if (active) setAudioReady(ready); }).catch(() => { if (active) setAudioReady(false); }); };
    // May succeed on an already-authorized origin; otherwise the gesture below resumes it.
    unlock();
    window.addEventListener("pointerdown", unlock); window.addEventListener("keydown", unlock);
    return () => { active = false; media.removeEventListener("change", update); window.removeEventListener("pointerdown", unlock); window.removeEventListener("keydown", unlock); audio.dispose(); };
  }, []);
  useEffect(() => { engine.current?.setEnabled(sound && !paused); }, [sound, paused]);
  useEffect(() => {
    if (paused || finished) return;
    let raf = 0, previous = 0;
    const frame = (now: number) => {
      // Hidden tabs don't jump ahead or accumulate unheard impacts.
      const delta = previous && !document.hidden ? Math.min(64, now - previous) * speed : 0;
      previous = now;
      if (delta) setCursor(c => advancePlayback(c, delta, result.events));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [paused, finished, speed, result]);
  useEffect(() => {
    const cue = (name: ForgeCue, at: number) => {
      const key = `${cursor.index}:${name}`;
      if (cursor.elapsed >= at && !cues.current.has(key)) {
        cues.current.add(key);
        if (!paused && !document.hidden) engine.current?.play(name);
      }
    };
    if (event) {
      if (event.delta > 0) cue("rise", 240);
      cue(event.delta > 0 ? "impact" : "fracture", IMPACT_MS);
      if (event.promotion) cue("promotion", TRANSFORM_MS);
      if (event.demotion) cue("demotion", TRANSFORM_MS);
    } else if (finished && !cues.current.has("finish")) {
      cues.current.add("finish"); if (result.applied > 0) engine.current?.play("finish");
    }
  }, [cursor, event, finished, paused, result.applied]);
  const before = rankAt(event?.before ?? (finished ? result.after : result.before));
  const after = rankAt(event?.after ?? (finished ? result.after : result.before));
  const frame = event ? socketFrame(event, before, after, cursor.elapsed) : null;
  const displayRank = frame?.transformed ? after : before;
  const filled = frame?.filled ?? (displayRank.index === 7 ? Number(displayRank.filled > 0) : displayRank.filled);
  const count = frame?.count ?? (displayRank.index === 7 ? 1 : displayRank.stars);
  const isLoss = !!event && event.delta < 0;
  const progress = event ? clamp((cursor.elapsed - 400) / (IMPACT_MS - 400)) : 0;
  const impact = event ? clamp((cursor.elapsed - IMPACT_MS) / 850) : 0;
  const transition = frame?.transformed ? clamp((cursor.elapsed - TRANSFORM_MS) / 1400) : 0;
  const targetOffset = (frame?.target ?? 0) - (count - 1) / 2;
  const showFlight = !!event && (!isLoss || before.filled > 0) && !frame?.floor && !frame?.transformed && cursor.elapsed >= 280 && cursor.elapsed < (isLoss ? IMPACT_MS + 950 : IMPACT_MS + 130);
  const fall = clamp((cursor.elapsed - IMPACT_MS) / 900);
  const translateY = isLoss ? fall * fall * 350 : -Math.pow(1-progress, 1.8);
  const shake = !reduced && impact > 0 && impact < .45 ? Math.sin(impact*75) * (1-impact/.45) * (isLoss ? 3 : 5) : 0;
  const duration = event ? eventDuration(event) : INTRO_MS;
  const title = finished ? (result.applied > 0 ? "星光，终有所归" : result.applied < 0 ? "重整旗鼓，再赴征程" : "每一步，都算数")
    : frame?.transformed ? (event?.promotion ? before.index !== after.index ? "突破 · 新的荣耀" : "晋级 · 再上一阶" : "段位回落")
    : frame?.floor ? "底分守护" : cursor.index < 0 ? (welcome ? "昨日的努力，即将点亮" : "让每一分努力，化作星光")
    : isLoss ? "星光暂落" : event?.type === "streak" ? `${result.streak} 天连胜 · 星火燎原` : "淬炼成星";
  const kingStars = frame?.kingStars ?? displayRank.filled;
  return <div className={`rank-cinema ${isLoss ? "cinema-loss" : "cinema-gain"} ${frame?.transformed ? event?.promotion ? "cinema-promotion" : "cinema-demotion" : ""} ${paused ? "cinema-paused" : ""} ${reduced ? "cinema-reduced" : ""}`}
    data-testid="rank-ceremony" data-event-index={cursor.index} data-phase={finished ? "complete" : frame?.transformed ? "rank-change" : frame?.impacted ? "impact" : cursor.index < 0 ? "intro" : "flight"}>
    <div className="cinema-grain" aria-hidden="true"/>
    <div className="cinema-header"><span className="eyebrow">{welcome ? "YESTERDAY’S ASCENT" : replay ? "THE ASCENT · REPLAY" : "THE ASCENT · SETTLEMENT"}</span><span>{result.date} · {replay ? "战报回放" : "每日结算"}</span></div>
    <div className="cinema-tools">
      <button className="cinema-sound" onClick={() => { if (!sound || audioReady) onSoundToggle(); void engine.current?.unlock().then(setAudioReady).catch(() => {}); }}>
        {sound && audioReady ? <Volume2 size={16}/> : <VolumeX size={16}/>}{sound && audioReady ? "音效已开启" : "开启打铁音效"}
      </button>
      {!finished && <button onClick={() => setSpeed(s => s === 1 ? 2 : 1)} aria-label="切换演出速度">{speed}×</button>}
    </div>
    <div className="cinema-title" aria-live="polite"><span>{title}</span><i/></div>
    <div className="ceremony-stage" style={{ transform: `translateX(${shake}px)` }}>
      <div className="celestial-orbit orbit-outer" aria-hidden="true"/><div className="celestial-orbit orbit-inner" aria-hidden="true"/>
      <div className="crest-rays" aria-hidden="true" style={{opacity: frame?.transformed && !isLoss ? .8 * (1-transition*.6) : .25}}/>
      <div className="rank-pedestal" aria-hidden="true"/>
      <div className={`ceremony-crest ${frame?.transformed ? isLoss ? "crest-demote" : "crest-promote" : ""}`} style={frame?.transformed && !reduced ? {
        opacity: clamp(transition * 4),
        transform: `translateY(${(isLoss ? -35 : 30) * (1-ease(transition))}px) scale(${1 + (isLoss ? .1 : -.25) * (1-ease(transition)) + Math.sin(transition*Math.PI)*.04})`,
        filter: `brightness(${isLoss ? .6+transition*.4 : 1+(1-transition)*1.1}) drop-shadow(0 0 ${isLoss ? 28 : 60*(1-transition)}px ${isLoss ? "#ae5f69aa" : "#f0d286"})`,
      } : undefined}>
        <Crest index={displayRank.index} size={360}/>
      </div>
      {frame?.transformed && <div className="rank-transition-ribbon" role="status" style={{opacity: reduced ? 1 : ease(transition*2)}}>{before.label}<span>{isLoss ? "↘" : "↗"}</span>{after.label}</div>}
      <h2 className="ceremony-rank-name">{displayRank.label}</h2>
      <div className="forged-sockets ceremony-sockets" aria-label={`${displayRank.label} · ${displayRank.index === 7 ? kingStars : filled} 颗星`}>
        {Array.from({length:count}, (_, i) => <span className={`star-socket ${frame?.impacted && !frame.transformed && i === frame.target ? "socket-struck" : ""}`} key={i}>
          <ForgedStar lit={i < filled}/>
        </span>)}
        {displayRank.index === 7 && <b className="king-count">× {kingStars}</b>}
        {event && !frame?.transformed && <div className="star-target" style={{left: before.index === 7 ? "calc(var(--star-size) / 2)" : `calc(50% + var(--star-step) * ${targetOffset})`}} aria-hidden="true">
          {showFlight && !reduced && <div className={`travelling-star ${isLoss ? "star-breaking" : "star-arriving"}`} style={{
            opacity: isLoss ? 1-fall : Math.min(1,(cursor.elapsed-280)/200),
            transform: isLoss ? `translate3d(${fall*45}px,${translateY}px,0) rotate(${fall*125}deg) scale(${1-fall*.6})`
              : `translate3d(calc(var(--star-step) * ${-targetOffset*(1-ease(progress))}), calc(var(--flight-height) * ${translateY}), 0) rotateY(${(1-progress)*270}deg) rotateZ(${(1-progress)*-65}deg) scale(${1+2.4*(1-ease(progress))})`,
            filter: isLoss ? `brightness(${1-fall*.7})` : `brightness(${1+Math.sin(progress*Math.PI)*.8})`,
          }}><div className="meteor-trail" style={{opacity:isLoss ? 0 : Math.sin(progress*Math.PI)}}/><ForgedStar/></div>}
          {frame?.impacted && impact < 1 && !reduced && <>
            <div className="impact-ring" style={{transform:`translate(-50%,-50%) scale(${.1+impact*4.5})`,opacity:(1-impact)**2}}/>
            <div className="impact-core" style={{opacity:(1-impact)**5,transform:`translate(-50%,-50%) scale(${.5+impact*3})`}}/>
            {Array.from({length:24},(_,i)=>{const a=i*2.39996, r=(45+(i%5)*22)*ease(impact);return <i key={i} className={`forge-spark ${isLoss ? "shard" : ""}`} style={{opacity:(1-impact)**1.5,transform:`translate(${Math.cos(a)*r}px,${Math.sin(a)*r+(isLoss?impact*80:impact*25)}px) rotate(${a*180/Math.PI}deg) scale(${1-impact*.7})`}}/>;})}
          </>}
        </div>}
      </div>
      <div className={`cinema-event-label ${isLoss ? "loss-label" : ""}`} aria-live="polite">
        {event ? <><b>{frame?.impacted ? `${isLoss ? "−" : "+"}1` : "✦"}</b><span>{event.label}</span></> : finished ? <><b>{signed(result.applied)} ★</b><span>今日段位变化</span></> : <span>累计 {result.events.length} 颗星，逐颗见证</span>}
      </div>
      {frame?.floor && <p className="cinema-note">本颗计入扣星记录 · 已达废铁底线，不产生负债</p>}
    </div>
    {finished ? <div className="cinema-final">
      <p>{rankAt(result.before).label} · {rankAt(result.before).filled} 星 <span>→</span> {rankAt(result.after).label} · {rankAt(result.after).filled} 星</p>
      <div className="cinema-totals"><span>获得 <b>+{result.gained}</b></span><span>扣除 <b>{result.lost ? `−${result.lost}` : 0}</b></span><span>累计 <b>{result.after}</b></span></div>
      {result.rewardOnlyReason && <p className="cinema-note">{result.rewardOnlyReason}</p>}
      {result.shieldUsed && <p className="cinema-note">连胜护盾生效 · 连胜保留</p>}
      <button className="gold-button" onClick={onClose}>收下星光，继续攀登</button>
      <details className="event-ledger"><summary>逐星明细 · {result.events.length} 颗</summary>{result.events.map((e,i)=><div key={i}><span>{e.label}</span><b>{signed(e.delta)} ★</b></div>)}</details>
    </div> : <div className="cinema-controls">
      <div className="ceremony-progress" role="progressbar" aria-label="结算演出进度" aria-valuemin={0} aria-valuemax={result.events.length} aria-valuenow={Math.max(0,cursor.index)}><i style={{width:`${(Math.max(0,cursor.index + cursor.elapsed / duration)/Math.max(1,result.events.length))*100}%`}}/></div>
      <div><span>{Math.max(0,cursor.index+1)} / {result.events.length} 颗</span><button onClick={()=>setPaused(p=>!p)}>{paused?<Play size={14}/>:<Pause size={14}/>} {paused?"继续演出":"暂停演出"}</button><button onClick={()=>setCursor({index:result.events.length,elapsed:0})}><SkipForward size={14}/> 查看结果</button></div>
    </div>}
    <span className="cinema-readonly">{replay ? "回放不会重复加减星" : "结算已保存"}{reduced ? " · 已遵循减少动态效果设置" : ""}</span>
  </div>;
}
