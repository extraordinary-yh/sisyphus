"use client";
import { useId } from "react";
import { RANKS, rankAt } from "@/lib/game";

export function Crest({ index = 0, size = 100 }: { index?: number; size?: number }) {
  return <div role="img" aria-label={`${RANKS[index].name}段位徽章`} className="crest"
    style={{ width: size, height: size, backgroundPosition: `${((index % 4) * 100) / 3}% ${index < 4 ? 0 : 100}%` }} />;
}
// Ten individually shaded planes give the star a bevel and a raised central ridge.
export function ForgedStar({ lit = true, className = "" }: { lit?: boolean; className?: string }) {
  const id = useId().replace(/:/g, "");
  const points = [[50,3],[61,34],[95,36],[69,57],[78,91],[50,72],[22,91],[31,57],[5,36],[39,34]];
  const shades = ["#fff5cd", "#c08828", "#fff2b0", "#85501a", "#f0c968", "#b77a23", "#fbe9a6", "#68451e", "#e2b350", "#fff6d6"];
  return <svg viewBox="0 0 100 100" className={`forged-star ${lit ? "is-lit" : "is-empty"} ${className}`} aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-edge`} x1="0" y1="0" x2=".7" y2="1"><stop stopColor="#fff7dc"/><stop offset=".43" stopColor="#d6a94b"/><stop offset=".7" stopColor="#755027"/><stop offset="1" stopColor="#fff0bd"/></linearGradient>
      <radialGradient id={`${id}-light`} cx=".35" cy=".2" r=".85"><stop stopColor="#fff" stopOpacity=".7"/><stop offset=".45" stopColor="#ffe7a6" stopOpacity=".06"/><stop offset="1" stopColor="#110a04" stopOpacity=".4"/></radialGradient>
    </defs>
    <polygon points={points.map(p => p.join(",")).join(" ")} fill={lit ? "#b08035" : "#152532"} stroke={lit ? `url(#${id}-edge)` : "#647381"} strokeWidth="3" strokeLinejoin="round"/>
    <g opacity={lit ? 1 : .08}>{points.map((p, i) => <polygon key={i} points={`50,49 ${p.join(",")} ${points[(i+1)%10].join(",")}`} fill={shades[i]}/>)}</g>
    <polygon points={points.map(p => p.join(",")).join(" ")} fill={`url(#${id}-light)`} opacity={lit ? .65 : .12}/>
    <path d="M50 5 50 49 7 36M50 49 77 88M50 49 94 36" fill="none" stroke={lit ? "#fff4cd" : "#728392"} strokeWidth=".65" opacity={lit ? .7 : .24}/>
  </svg>;
}
export function RankStars({ score }: { score: number }) {
  const rank = rankAt(score);
  return <div className="forged-sockets lobby-sockets" aria-label={`${rank.label} · ${rank.filled} 颗星`}>
    {Array.from({length: rank.index === 7 ? 1 : rank.stars}, (_, i) => <span className="star-socket" key={i}><ForgedStar lit={i < rank.filled}/></span>)}
    {rank.index === 7 && <b className="king-count">× {rank.filled}</b>}
  </div>;
}
