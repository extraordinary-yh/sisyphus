"use client";
import { useCallback, useEffect, useState } from 'react';
import type { Result } from '@/lib/game';
import { RankCeremony } from './rank-ceremony';
export function SettlementPlaylist({ results, sound, onSoundToggle, onWatched, onClose }: {
  results: Result[]; sound: boolean; onSoundToggle: () => void; onWatched: (result: Result) => void; onClose: () => void;
}) {
  const [index, setIndex] = useState(0), [finished, setFinished] = useState(false), [automatic, setAutomatic] = useState(true);
  const [visible, setVisible] = useState(true);
  useEffect(() => { const update = () => setVisible(!document.hidden); update(); document.addEventListener("visibilitychange", update); return () => document.removeEventListener("visibilitychange", update); }, []);
  const result = results[index];
  const completed = useCallback(() => setFinished(true), []);
  const next = useCallback(() => {
    if (finished) onWatched(result);
    if (index + 1 === results.length) { onClose(); return; }
    setFinished(false); setIndex(index + 1);
  }, [finished, onWatched, result, index, results.length, onClose]);
  useEffect(() => {
    if (!finished) return;
    onWatched(result);
    if (!automatic || !visible) return;
    const timer = setTimeout(() => { if (!document.hidden) next(); }, 5000);
    return () => clearTimeout(timer);
  }, [finished, automatic, visible, result, onWatched, next]);
  return <div className="settlement-playlist">
    <div className="playlist-toolbar" aria-live="polite">
      <strong>逐日回放 · {index + 1} / {results.length} · {result.date}</strong>
      <div><button className="quiet" onClick={() => setAutomatic(x => !x)}>{automatic ? '暂停自动换日' : '开启自动换日'}</button>
        <button className="quiet" onClick={next}>{index + 1 === results.length ? '结束回放' : finished ? '下一天' : '跳过本日'}</button>
        <button className="quiet" onClick={onClose}>退出连播</button></div>
      <small>{finished && automatic ? '本日结果停留 5 秒后继续；切到后台不会自动换日。' : '按日期从早到晚播放；跳过的未完成日期仍保留为未回顾。'}</small>
    </div>
    <RankCeremony key={result.date} result={result} replay welcome={false} sound={sound} onSoundToggle={onSoundToggle}
      onClose={next} onFinished={completed} closeLabel={index + 1 === results.length ? '完成全部回放' : '收下星光，播放下一天'} />
  </div>;
}
