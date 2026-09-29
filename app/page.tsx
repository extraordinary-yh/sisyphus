"use client";
import { useEffect, useRef, useState } from "react";
import {
  Swords,
  Shield,
  Star,
  Target,
  Flame,
  Play,
  Pause,
  History,
  Settings2,
  ChevronRight,
  ChevronLeft,
  Plus,
  Timer,
  BookOpen,
  Guitar,
  Dumbbell,
  Languages,
  Moon,
  Check,
  Upload,
  Download,
  Volume2,
  VolumeX,
  X,
  RotateCcw,
  Save,
  ArrowUpRight,
  Trophy,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Toaster, toast } from "sonner";
import {
  RANKS,
  DEFAULT_RULES,
  emptyState,
  today,
  shiftDay,
  rankAt,
  newDay,
  replay,
  previewDay,
  entertainmentSeconds,
  dayVideoPenalty,
  daySleepScore,
  canSettle,
  blockDurationLabel,
  duration,
  parseUsage,
  focusRemaining,
  type Day,
  type GameState,
  type Result,
  type Focus,
  type Block,
} from "@/lib/game";

type Modal = "day" | "rules" | "focus" | "ranks" | "data" | "settlement" | null;
const uid = () => crypto.randomUUID();
const sign = (n: number) => (n > 0 ? `+${n}` : `${n}`);
const hobbyIcons = [Guitar, Languages, BookOpen, Dumbbell];
function Crest({ index = 0, size = 100 }: { index?: number; size?: number }) {
  return (
    <div
      role="img"
      aria-label={`${RANKS[index].name}段位徽章`}
      className="crest"
      style={{
        width: size,
        height: size,
        backgroundPosition: `${((index % 4) * 100) / 3}% ${index < 4 ? 0 : 100}%`,
      }}
    />
  );
}
function download(name: string, data: unknown) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
export default function Page() {
  const [state, setState] = useState<GameState>(emptyState),
    [version, setVersion] = useState(0),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false);
  const [date, setDate] = useState(""),
    [day, setDay] = useState<Day>(newDay(today())),
    [view, setView] = useState("lobby"),
    [modal, setModal] = useState<Modal>(null),
    [tab, setTab] = useState("study"),
    [plans, setPlans] = useState<{ date: string; blocks: Block[] }[]>([]),
    [planSync, setPlanSync] = useState("");
  const [sound, setSound] = useState(false),
    [now, setNow] = useState(Date.now()),
    [result, setResult] = useState<Result | null>(null),
    [eventIndex, setEventIndex] = useState(-1),
    [playing, setPlaying] = useState(false),
    [isReplay, setIsReplay] = useState(false),
    [range, setRange] = useState(30),
    [usageText, setUsageText] = useState(""),
    [inspectRank, setInspectRank] = useState(0);
  const [focusChoice, setFocusChoice] = useState("study:"),
    [focusMinutes, setFocusMinutes] = useState(30),
    [recovery, setRecovery] = useState<GameState | null>(null);
  const versionRef = useRef(0),
    busyRef = useRef(false),
    audioRef = useRef<AudioContext | null>(null),
    importRef = useRef<HTMLInputElement>(null),
    planRef = useRef<HTMLInputElement>(null);
  const results = replay(state.days),
    last = results.at(-1),
    score = last?.after ?? 0,
    rank = rankAt(score),
    preview = previewDay(day, state.days),
    totalSeconds = entertainmentSeconds(day);
  const activeStreak =
    last && last.date >= shiftDay(today(), -1) ? last.streak : 0;
  const assembled = (): GameState => ({
    ...state,
    days: [...state.days.filter((d) => d.date !== day.date), day].sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
  });
  const load = async () => {
    setError("");
    try {
      const r = await fetch("/api/state", { signal: AbortSignal.timeout(12000) });
      const x = (await r.json()) as {
        state: GameState;
        version: number;
        error?: string;
        date: string;
        source: string;
        usage: Day["usage"];
      };
      if (!r.ok) throw new Error(x.error);
      setState(x.state);
      setVersion(x.version);
      versionRef.current = x.version;
      const d = today();
      setDate(d);
      setDay(
        x.state.days.find((v: Day) => v.date === d) || newDay(d, x.state.rules),
      );
      setLoaded(true);
      setDirty(false);
    } catch (e) {
      setError(String((e as Error).message));
    }
  };
  useEffect(() => {
    load();
    fetch("/local/jobhub")
      .then((r) => r.json())
      .then((raw) => {
        const x = raw as {
          plans: { date: string; blocks: Block[] }[];
          syncedAt: string;
        };
        if (Array.isArray(x.plans)) setPlans(x.plans);
        if (x.syncedAt) setPlanSync(x.syncedAt);
      })
      .catch(() => {});
    setSound(localStorage.getItem("sisyphus-sound") === "1");
    try {
      const s = localStorage.getItem("sisyphus-unsaved");
      if (s) setRecovery(JSON.parse(s));
    } catch {}
  }, []);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (dirty && loaded)
      localStorage.setItem("sisyphus-unsaved", JSON.stringify(assembled()));
  }, [day, dirty, state, loaded]);
  const tone = (positive: boolean) => {
    if (!sound) return;
    try {
      const ac = audioRef.current ?? new AudioContext();
      audioRef.current = ac;
      void ac.resume();
      const o = ac.createOscillator(),
        g = ac.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(positive ? 660 : 220, ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(
        positive ? 990 : 110,
        ac.currentTime + 0.25,
      );
      g.gain.setValueAtTime(0.08, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.45);
      o.connect(g);
      g.connect(ac.destination);
      o.start();
      o.stop(ac.currentTime + 0.45);
    } catch {}
  };
  useEffect(() => {
    if (!playing || !result) return;
    const id = setTimeout(
      () => {
        setEventIndex((i) => {
          if (i + 1 >= result.events.length) {
            setPlaying(false);
            return result.events.length;
          }
          tone(result.events[i + 1].delta > 0);
          return i + 1;
        });
      },
      eventIndex < 0 ? 550 : result.events[eventIndex]?.promotion ? 1500 : 850,
    );
    return () => clearTimeout(id);
  }, [playing, eventIndex, result]);
  const persist = async (next: GameState) => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/state", {
        method: "PUT",
        signal: AbortSignal.timeout(15000),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: versionRef.current, state: next }),
      });
      const x = (await r.json()) as {
        state: GameState;
        version: number;
        error?: string;
        date: string;
        source: string;
        usage: Day["usage"];
      };
      if (!r.ok) throw new Error(x.error);
      setState(x.state);
      setVersion(x.version);
      versionRef.current = x.version;
      setDirty(false);
      localStorage.removeItem("sisyphus-unsaved");
      setRecovery(null);
      return true;
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      toast.error(msg);
      localStorage.setItem("sisyphus-unsaved", JSON.stringify(next));
      return false;
    } finally {
      setBusy(false);
      busyRef.current = false;
    }
  };
  const update = (patch: Partial<Day>) => {
    setDay((d) => ({ ...d, ...patch }));
    setDirty(true);
  };
  const selectDate = async (d: string) => {
    if (!d || d > today() || d === date || busyRef.current) return;
    if (dirty && !(await persist(assembled()))) return;
    setDate(d);
    setDay(state.days.find((x) => x.date === d) || newDay(d, state.rules));
    setDirty(false);
  };
  const edit = (t = "study") => {
    setTab(t);
    setModal("day");
  };
  const saveDraft = async () => {
    if (await persist(assembled()))
      toast.success(
        day.settled ? "修订已保存，后续战绩已重新计算" : "今日草稿已保存",
      );
  };
  const importPlan = (p: { date: string; blocks: Block[] }) => {
    update({
      blocks: p.blocks.map((b) => ({
        ...b,
        id: b.id || uid(),
        done: p.date === day.date ? !!b.done : false,
        firstAction: b.firstAction || "",
      })),
      planSource:
        p.date === day.date
          ? `Job Hub · ${p.date}`
          : `沿用 Job Hub ${p.date} 计划 · 完成状态已清空`,
    });
    toast.success("计划已载入草稿，保存后生效");
  };
  const settle = async () => {
    if (!canSettle(day)) {
      toast.error("请先确认全天娱乐时长，并填写关闭设备时间。");
      edit("usage");
      return;
    }
    const next = { ...day, settled: true };
    const ns = {
      ...state,
      days: [...state.days.filter((d) => d.date !== next.date), next],
    };
    const res = previewDay(next, state.days);
    if (await persist(ns)) {
      setDay(next);
      setResult(res);
      setEventIndex(-1);
      setPlaying(true);
      setIsReplay(false);
      setModal("settlement");
    }
  };
  const replayResult = (r: Result) => {
    setResult(r);
    setEventIndex(-1);
    setPlaying(true);
    setIsReplay(true);
    setModal("settlement");
  };
  const startFocus = async () => {
    const [kind, id] = focusChoice.split(":");
    const item =
      kind === "study"
        ? day.blocks.find((b) => b.id === id)
        : day.hobbies.find((h) => h.id === id);
    if (!item) {
      toast.error("请先选择一个任务");
      return;
    }
    const sec = Math.max(1, Math.min(480, focusMinutes)) * 60;
    const f: Focus = {
      id: uid(),
      day: day.date,
      kind: kind as "study" | "hobby",
      targetId: id,
      title: item.title,
      duration: sec,
      remaining: sec,
      endsAt: Date.now() + sec * 1000,
      status: "running",
    };
    if (await persist({ ...assembled(), focus: f }))
      toast.success("专注开始。现在只做这一件事。");
  };
  const focus = state.focus,
    remaining = focusRemaining(focus, now);
  const focusToggle = async () => {
    if (!focus) return;
    const f = {
      ...focus,
      status: focus.status === "running" ? "paused" : "running",
      remaining,
      endsAt: focus.status === "running" ? null : Date.now() + remaining * 1000,
    } as Focus;
    await persist({ ...assembled(), focus: f });
  };
  const finishFocus = async () => {
    if (!focus) return;
    let d =
      state.days.find((d) => d.date === focus.day) ||
      newDay(focus.day, state.rules);
    if (day.date === focus.day) d = day;
    const mins = Math.floor((focus.duration - remaining) / 60);
    if (focus.kind === "hobby") {
      d = {
        ...d,
        hobbies: d.hobbies.map((h) =>
          h.id === focus.targetId
            ? { ...h, minutes: Math.min(1440, h.minutes + mins) }
            : h,
        ),
      };
    } else if (remaining === 0) {
      d = {
        ...d,
        blocks: d.blocks.map((b) =>
          b.id === focus.targetId ? { ...b, done: true } : b,
        ),
      };
    }
    const ns = {
      ...assembled(),
      focus: null,
      days: [...assembled().days.filter((x) => x.date !== d.date), d],
    };
    if (await persist(ns)) {
      if (day.date === d.date) setDay(d);
      toast.success(
        focus.kind === "study" && remaining > 0
          ? "本次计时已结束，学习任务仍待完成"
          : `已确认 ${mins} 分钟专注`,
      );
      setModal(null);
    }
  };
  const useScreenshot = async () => {
    try {
      const r = await fetch("/local/stayfree");
      if (!r.ok)
        throw Error("当前没有可用的本机快照。请粘贴或手动录入 StayFree 时长。");
      const x = (await r.json()) as {
        state: GameState;
        version: number;
        error?: string;
        date: string;
        source: string;
        usage: Day["usage"];
      };
      if (x.date !== day.date) {
        toast.error(`快照属于 ${x.date}，请先选择该日期。`);
        return;
      }
      update({ usage: x.usage, source: x.source, usageConfirmed: false });
      toast.success("快照已载入，结算前请更新为全天总量");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const importUsage = () => {
    const rows = parseUsage(usageText);
    if (!rows.length) {
      toast.error("未识别数据。请使用“名称,分钟”或“bilibili 4h 30m 35s”。");
      return;
    }
    update({
      usage: rows,
      source: "粘贴导入 · 待确认分类与重复",
      usageConfirmed: false,
    });
    setUsageText("");
    toast.success("已导入，请核对分类与合计");
  };
  const inputFile = async (file: File | undefined, kind: "plan" | "backup") => {
    if (!file) return;
    try {
      const x = JSON.parse(await file.text());
      if (kind === "plan") {
        if (!Array.isArray(x.blocks)) throw Error("计划需要包含 blocks");
        importPlan({
          date: x.date || day.date,
          blocks: x.blocks.map((b: Record<string, unknown>) => ({
            id: String(b.id || uid()),
            title: String(b.title || "学习任务"),
            minutes: Number(b.minutes || 30),
            done: !!b.done,
            firstAction: String(b.firstAction || b.first_action || ""),
          })),
        });
      } else {
        const candidate = x.state || x;
        if (!candidate.days || !candidate.rules)
          throw Error("不是 Sisyphus 备份");
        setRecovery(candidate);
        toast("备份已读取。点击“恢复这份草稿”后才会保存。");
      }
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const soundToggle = () => {
    setSound(!sound);
    localStorage.setItem("sisyphus-sound", sound ? "0" : "1");
  };
  const startTask = (id: string, minutes: number, kind = "study") => {
    setFocusChoice(`${kind}:${id}`);
    setFocusMinutes(minutes);
    setModal("focus");
  };
  const exportBackup = () =>
    download(`sisyphus-${today()}.json`, {
      format: "sisyphus-v1",
      exportedAt: new Date().toISOString(),
      state: assembled(),
    });
  useEffect(() => {
    const nav = navigator as Navigator & {
      modelContext?: {
        registerTool: (tool: unknown) => void;
        unregisterTool: (name: string) => void;
      };
    };
    if (!nav.modelContext) return;
    const name = "sisyphus_read_progress";
    nav.modelContext.registerTool({
      name,
      description:
        "Read saved Sisyphus rank and daily settlement history. Does not award stars or mark tasks complete.",
      inputSchema: { type: "object", properties: {} },
      execute: async () => ({
        content: [
          {
            type: "text",
            text: JSON.stringify({ score, rank: rank.label, results }),
          },
        ],
      }),
    });
    return () => nav.modelContext?.unregisterTool(name);
  }, [state]);
  const shownResults = results.filter(
    (r) => r.date >= shiftDay(today(), -(range - 1)) && r.date <= today(),
  );
  const dayTitle = date
    ? new Intl.DateTimeFormat("zh-CN", {
        month: "long",
        day: "numeric",
        weekday: "long",
        timeZone: "UTC",
      }).format(new Date(date + "T12:00:00Z"))
    : "今日";
  return (
    <main className="game-shell">
      <Toaster theme="dark" position="top-center" />
      <header className="topbar">
        <a className="brand" href="/">
          <Swords />
          <span>
            SISYPHUS<small>西西弗斯 · 自律排位</small>
          </span>
        </a>
        <nav aria-label="主导航">
          <button
            className={view === "lobby" ? "active" : ""}
            onClick={() => setView("lobby")}
          >
            <Swords size={16} />
            排位大厅
          </button>
          <button
            className={view === "history" ? "active" : ""}
            onClick={() => setView("history")}
          >
            <History size={16} />
            征战记录
          </button>
          <button
            className={view === "ranks" ? "active" : ""}
            onClick={() => setView("ranks")}
          >
            <Shield size={16} />
            荣耀之路
          </button>
        </nav>
        <div className="player">
          <button
            className="quiet"
            onClick={soundToggle}
            aria-label={sound ? "关闭音效" : "开启音效"}
          >
            {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          <span>PLAYER</span>
          <b className="avatar">S</b>
        </div>
      </header>
      <div className="lobby">
        <div className="lobby-top">
          <div>
            <span className="eyebrow">THE ASCENT · 你的第一赛季</span>
            <h1>
              {view === "lobby"
                ? "把今天，打成一场胜仗。"
                : view === "history"
                  ? "每一步，都有迹可循。"
                  : "从废铁出发，向王者进发。"}
            </h1>
          </div>
          <div className="top-actions">
            <button className="quiet" onClick={() => setModal("data")}>
              <Download size={15} />
              数据背包
            </button>
            <button className="quiet" onClick={() => setModal("rules")}>
              <Settings2 size={16} />
              排位规则
            </button>
          </div>
        </div>
        {error && (
          <div role="alert" className="error-banner">
            {error}
            <button onClick={load}>重新载入</button>
            <button onClick={exportBackup}>导出当前草稿</button>
            {!loaded && <a href="/signin-with-chatgpt?return_to=%2F">登录</a>}
          </div>
        )}
        {recovery && (
          <div className="notice">
            发现未保存的草稿或导入备份。
            <button
              onClick={async () => {
                if (await persist(recovery)) {
                  const d = recovery.days.find((x) => x.date === date);
                  if (d) setDay(d);
                  setRecovery(null);
                  toast.success("已恢复并保存");
                }
              }}
            >
              恢复这份草稿
            </button>
            <button
              onClick={() => {
                download("sisyphus-recovered-draft.json", recovery);
                setRecovery(null);
              }}
            >
              先下载备份
            </button>
          </div>
        )}
        {!loaded && !error && (
          <div className="notice">正在读取你的征战记录…</div>
        )}
        {view === "lobby" && (
          <>
            <div className="date-strip">
              <div>
                <button
                  aria-label="前一天"
                  onClick={() => selectDate(shiftDay(date || today(), -1))}
                >
                  <ChevronLeft size={16} />
                </button>
                <input
                  aria-label="记录日期"
                  type="date"
                  value={date}
                  max={today()}
                  onChange={(e) => selectDate(e.target.value)}
                />
                <button
                  disabled={date >= today()}
                  aria-label="后一天"
                  onClick={() => selectDate(shiftDay(date, 1))}
                >
                  <ChevronRight size={16} />
                </button>
                <span>
                  {date === today() ? "今日排位" : dayTitle}{" "}
                  <i>
                    · {day.settled ? "已结算" : dirty ? "草稿未保存" : "待结算"}
                  </i>
                </span>
              </div>
              <button
                disabled={!loaded || busy}
                className="quiet"
                onClick={saveDraft}
              >
                <Save size={14} />
                {busy ? "保存中…" : "保存草稿"}
              </button>
            </div>
            {day.rewardOnlyReason && (
              <p className="notice gold-text">✦ 奖励结算 · {day.rewardOnlyReason}</p>
            )}
            <div className="arena">
              <section className="rank-chamber">
                <div className="season-tag">
                  S01 <span>{rank.subtitle}</span>
                </div>
                <div className="rank-art">
                  <Crest index={rank.index} size={218} />
                </div>
                <span className="eyebrow">
                  {rank.index === 0
                    ? "A NEW BEGINNING"
                    : "THE ASCENT CONTINUES"}
                </span>
                <h2>{rank.label}</h2>
                <div className="rank-stars" aria-label={`${rank.filled} 颗星`}>
                  {rank.index === 7 ? (
                    <span className="lit">★ {rank.filled}</span>
                  ) : (
                    Array.from({ length: rank.stars }, (_, i) => (
                      <span className={i < rank.filled ? "lit" : ""} key={i}>
                        {i < rank.filled ? "★" : "☆"}
                      </span>
                    ))
                  )}
                </div>
                <p>每一颗星，都是你拿回的时间。</p>
                <div className="next-rank">
                  <span>
                    {rank.index === 7
                      ? "王者之路 · 没有上限"
                      : `下一站 · ${rankAt(score + rank.needed!).label}`}
                  </span>
                  <span>
                    {rank.filled} / {rank.index === 7 ? "∞" : rank.stars} ★
                  </span>
                </div>
                <Progress
                  value={
                    rank.index === 7 ? 100 : (rank.filled / rank.stars) * 100
                  }
                  className="rank-progress"
                />
                <button
                  disabled={!loaded || busy}
                  className="gold-button"
                  onClick={() => edit("review")}
                >
                  {day.settled ? "查看 / 修订战报" : "结算今日排位"}
                  <ChevronRight size={18} />
                </button>
                <button
                  className="text-link"
                  onClick={() => {
                    const r = results.find((r) => r.date === day.date);
                    if (r) replayResult(r);
                    else {
                      setResult({
                        ...preview,
                        events: preview.events.length
                          ? preview.events
                          : [
                              {
                                label: "演示 · 完成学习",
                                delta: 1,
                                before: 0,
                                after: 1,
                                type: "study",
                                promotion: false,
                                demotion: false,
                              },
                            ],
                        after: preview.events.length ? preview.after : 1,
                      });
                      setEventIndex(-1);
                      setPlaying(true);
                      setIsReplay(true);
                      setModal("settlement");
                    }
                  }}
                >
                  {day.settled ? "重播结算动画" : "预览结算演出 · 不计入战绩"}
                </button>
              </section>
              <section className="quest-column">
                <div className="section-title">
                  <h2>
                    <Target size={19} />
                    今日主线
                  </h2>
                  <button className="quiet" onClick={() => edit("study")}>
                    {day.blocks.filter((b) => b.done).length}/
                    {day.blocks.length} <Settings2 size={13} />
                  </button>
                </div>
                {day.blocks.length ? (
                  day.blocks.map((b, i) => (
                    <div className={`quest ${b.done ? "done" : ""}`} key={b.id}>
                      <Checkbox
                        aria-label={`完成 ${b.title}`}
                        checked={b.done}
                        disabled={!loaded || busy}
                        onCheckedChange={(c) =>
                          update({
                            blocks: day.blocks.map((x) =>
                              x.id === b.id ? { ...x, done: !!c } : x,
                            ),
                          })
                        }
                      />
                      <div>
                        <h3>{b.title}</h3>
                        <p>
                          {blockDurationLabel(b)}{" "}
                          <span>· {b.done ? "已完成" : "学习主线"}</span>
                        </p>
                      </div>
                      <span className="reward">
                        {rankAt(preview.before).index >= 5 ? "½" : "+1"} ★
                      </span>
                      <button
                        className="icon-button"
                        aria-label={`专注 ${b.title}`}
                        onClick={() => startTask(b.id, b.minutes ?? 30)}
                      >
                        <Play size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="empty-quests">
                    <BookOpen size={28} />
                    <h3>今天的主线，由你开启</h3>
                    <p>导入 Job Hub 的 study blocks，或添加今日任务。</p>
                    {plans.length > 0 && (
                      <button
                        disabled={!loaded}
                        className="outline-button"
                        onClick={() =>
                          importPlan(
                            plans.find((p) => p.date === date) || plans.at(-1)!,
                          )
                        }
                      >
                        载入{" "}
                        {plans.find((p) => p.date === date)
                          ? "今日"
                          : plans.at(-1)!.date}{" "}
                        计划 <ChevronRight size={14} />
                      </button>
                    )}
                    <button className="text-link" onClick={() => edit("study")}>
                      自己添加任务
                    </button>
                  </div>
                )}
                <p className="plan-source">{day.planSource}</p>
                <div className="section-title">
                  <h2>
                    <Flame size={19} />
                    连胜之火
                  </h2>
                  <span>
                    <b className="gold-text">{activeStreak}</b> DAYS
                  </span>
                </div>
                <div className="streak-track">
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <span
                      className={
                        d <= ((activeStreak - 1) % 7) + 1 && activeStreak
                          ? "on"
                          : ""
                      }
                      key={d}
                    >
                      <Flame size={23} />
                      <small>
                        {d === 3 ? "+1 ★" : d === 7 ? "+2 ★" : `第 ${d} 天`}
                      </small>
                    </span>
                  ))}
                </div>
                <div className="tip">
                  <Shield size={19} />
                  <p>
                    全部主线完成 + 娱乐 ≤60 min
                    <br />
                    <span>
                      护盾 {last?.shields ?? 0}/1 · 严格连续{" "}
                      {last?.strictStreak ?? 0} 天
                    </span>
                  </p>
                  <button className="quiet" onClick={() => setModal("rules")}>
                    <Info size={14} />
                  </button>
                </div>
                <div className="section-title sidequests-title">
                  <h2>生活支线</h2>
                  <span>MAKE ROOM FOR LIFE</span>
                </div>
                <div className="hobby-shortcuts">
                  {day.hobbies.map((h, i) => {
                    const Icon = hobbyIcons[i] || Star;
                    return (
                      <button
                        key={h.id}
                        className={h.minutes >= h.target ? "complete" : ""}
                        onClick={() => startTask(h.id, h.target, "hobby")}
                      >
                        <Icon size={19} />
                        <span>{h.title}</span>
                        <small>
                          {h.minutes >= h.target ? "✓ +1 ★" : `${h.target} min`}
                        </small>
                      </button>
                    );
                  })}
                </div>
                <button className="text-link" onClick={() => edit("life")}>
                  记录已完成的生活支线
                </button>
              </section>
              <aside className="side-column">
                <div className="panel usage-panel">
                  <span className="eyebrow">YOUR TIME, YOUR CHOICE</span>
                  <h3>守住专注边界</h3>
                  <div
                    className={`usage-count ${totalSeconds > 3600 ? "danger-text" : ""}`}
                  >
                    {Math.floor(totalSeconds / 60)} <small>min / 60 min</small>
                  </div>
                  <Progress
                    value={Math.min(100, (totalSeconds / 3600) * 100)}
                    className={`usage-progress ${totalSeconds > 3600 ? "over" : ""}`}
                  />
                  <div className="usage-detail">
                    <span>
                      {day.usageConfirmed
                        ? "全天时长已确认"
                        : "尚未确认全天时长"}
                    </span>
                    <b className={dayVideoPenalty(day) > 0 ? "danger-text" : "gold-text"}>
                      {dayVideoPenalty(day)
                        ? `−${dayVideoPenalty(day)} ★`
                        : "0 ★"}
                    </b>
                  </div>
                  {day.usage
                    .filter((u) => u.category !== "excluded")
                    .slice(0, 3)
                    .map((u) => (
                      <div className="usage-row" key={u.id}>
                        <span>{u.name}</span>
                        <span>{duration(u.seconds)}</span>
                      </div>
                    ))}
                  <p>
                    {day.rewardOnlyReason
                      ? "本日仅计正向奖励 · 使用时长保留，不扣星"
                      : day.rules.mode === "gradient"
                        ? "首小时免费 · 超时梯度扣星，最多 −32"
                        : "首小时免费 · 超时每开始一小时 −1"}
                  </p>
                  <button
                    className="outline-button"
                    onClick={() => edit("usage")}
                  >
                    <Plus size={13} />
                    录入 / 导入时长
                  </button>
                </div>
                <div className="panel focus-panel">
                  <Timer size={23} />
                  <h3>{focus ? "专注进行中" : "进入心流"}</h3>
                  <p>{focus ? focus.title : "一段时间，只做一件事。"}</p>
                  {focus && (
                    <div className="mini-time">
                      {String(Math.floor(remaining / 60)).padStart(2, "0")}:
                      {String(remaining % 60).padStart(2, "0")}
                    </div>
                  )}
                  <button
                    disabled={!loaded}
                    className="outline-button"
                    onClick={() => {
                      if (!focus)
                        setFocusChoice(`study:${day.blocks[0]?.id || ""}`);
                      setModal("focus");
                    }}
                  >
                    {focus ? "返回专注" : "开始专注"}
                    <Play size={13} />
                  </button>
                </div>
                <button className="night-note" onClick={() => edit("life")}>
                  <Moon size={15} />
                  <span>
                    {day.bedtime
                      ? `${day.bedtime} 关闭设备`
                      : "00:30 前关闭设备"}
                  </span>
                  <b>
                    {day.bedtime
                      ? sign(daySleepScore(day))
                      : day.rewardOnlyReason ? "0" : "+1"}{" "}
                    ★
                  </b>
                </button>
              </aside>
            </div>
            <section className="rank-road">
              <span className="eyebrow">你的登顶之路</span>
              <div>
                {RANKS.map((r, i) => (
                  <button
                    key={r.name}
                    className={rank.index === i ? "current" : ""}
                    onClick={() => {
                      setInspectRank(i);
                      setModal("ranks");
                    }}
                  >
                    <Crest index={i} size={78} />
                    <span>{r.name}</span>
                    <small>
                      {rank.index === i
                        ? "当前段位"
                        : score >= r.start
                          ? "已抵达"
                          : `${r.start} 星解锁`}
                    </small>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
        {view === "history" && (
          <section className="history-page">
            <div className="section-title">
              <h2>
                <History size={20} />
                征战记录
              </h2>
              <div className="range-buttons">
                {[7, 30, 90].map((n) => (
                  <button
                    className={range === n ? "selected" : ""}
                    onClick={() => setRange(n)}
                    key={n}
                  >
                    {n} 天
                  </button>
                ))}
              </div>
            </div>
            <div className="history-stats">
              <div>
                <small>获得星星</small>
                <strong className="gold-text">
                  +{shownResults.reduce((n, r) => n + r.gained, 0)}
                </strong>
              </div>
              <div>
                <small>扣除星星</small>
                <strong className="danger-text">
                  −{shownResults.reduce((n, r) => n + r.lost, 0)}
                </strong>
              </div>
              <div>
                <small>累计段位星</small>
                <strong>{score}</strong>
              </div>
              <div>
                <small>达标天数</small>
                <strong>
                  {shownResults.filter((r) => r.perfect).length}
                  <small> / {range}</small>
                </strong>
              </div>
            </div>
            <Trajectory results={results} range={range} />
            {shownResults.length ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>日期</th>
                      <th>结果</th>
                      <th>获得</th>
                      <th>扣除</th>
                      <th>实际变化</th>
                      <th>结算后段位</th>
                      <th>回顾</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...shownResults].reverse().map((r) => (
                      <tr key={r.date}>
                        <td>{r.date}</td>
                        <td>
                          {r.rewardOnlyReason ? "✦ 奖励结算" : r.perfect ? (
                            <span className="gold-text">✦ 完美一天</span>
                          ) : r.shieldUsed ? (
                            "◇ 护盾守护"
                          ) : (
                            "已结算"
                          )}
                        </td>
                        <td className="gold-text">+{r.gained}</td>
                        <td className={r.lost ? "danger-text" : ""}>{r.lost ? `−${r.lost}` : "0"}</td>
                        <td>{sign(r.applied)}</td>
                        <td>
                          {rankAt(r.after).label} · {rankAt(r.after).filled} ★
                        </td>
                        <td>
                          <button
                            className="quiet"
                            onClick={() => replayResult(r)}
                          >
                            重播 <Play size={12} />
                          </button>
                          <button
                            className="text-link"
                            onClick={async () => {
                              await selectDate(r.date);
                              setView("lobby");
                              edit("review");
                            }}
                          >
                            修订记录
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-record">
                <History size={35} />
                <h3>你的第一份战报，即将诞生。</h3>
                <p>结算一天后，这里会留下每一颗星的来处。</p>
                <button
                  className="outline-button"
                  onClick={() => {
                    setView("lobby");
                    edit("review");
                  }}
                >
                  去完成首次结算
                </button>
              </div>
            )}
            <p className="fine-print">
              图表展示每日结算后的段位星；未记录日沿用上一次星数。底分保护可能让实际变化与「获得
              − 扣除」不同。补录或修订历史会按日期重算后续段位和连胜。
            </p>
          </section>
        )}
        {view === "ranks" && (
          <section className="rank-gallery">
            {RANKS.map((r, i) => (
              <button
                className={`rank-card ${rank.index === i ? "current" : ""}`}
                key={r.name}
                onClick={() => {
                  setInspectRank(i);
                  setModal("ranks");
                }}
              >
                <span className="eyebrow">
                  {i === 7 ? "ENDLESS ASCENT" : `TIER 0${i + 1}`}
                </span>
                <Crest index={i} size={170} />
                <h2>{r.name}</h2>
                <p>
                  {i === 7
                    ? "25 · 50 · 100 星，继续攀登"
                    : `${r.divisions} 个小段位 · 每段 ${r.stars} 星`}
                </p>
                <small>
                  {score >= r.start ? "✦ 已抵达" : `累计 ${r.start} 星抵达`}
                </small>
              </button>
            ))}
          </section>
        )}
      </div>
      <footer>
        <span>
          {dirty
            ? "● 草稿未保存"
            : loaded
              ? "● 记录已连接 · 保存到个人数据库"
              : "正在连接记录"}{" "}
          · America/Los_Angeles
        </span>
        <span>SISYPHUS · 每一次专注，都让山顶近一点。</span>
      </footer>
      <Dialog
        open={modal !== null}
        onOpenChange={(o) => {
          if (!o) {
            setModal(null);
            setPlaying(false);
          }
        }}
      >
        <DialogContent
          className={`game-dialog ${modal === "settlement" ? "settlement-dialog" : modal === "focus" ? "focus-dialog" : ""}`}
        >
          <DialogTitle>
            {modal === "day"
              ? `${day.date} · 每日排位`
              : modal === "rules"
                ? "排位法则"
                : modal === "focus"
                  ? "专注领域"
                  : modal === "ranks"
                    ? RANKS[inspectRank].subtitle
                    : modal === "data"
                      ? "数据背包"
                      : isReplay
                        ? "战报回放"
                        : "每日结算"}
          </DialogTitle>
          <DialogDescription>
            {modal === "day"
              ? "记录实际完成的行为。星星在结算时统一发放。"
              : modal === "rules"
                ? "明确的规则，让每一颗星都有来处。"
                : modal === "focus"
                  ? "此刻，只做这一件事。"
                  : modal === "ranks"
                    ? "你不必一次登顶，只需再向前一步。"
                    : modal === "data"
                      ? "导出备份、恢复记录，或导入你的学习计划。"
                      : isReplay
                        ? "仅播放动画，不重复计分。"
                        : "记录已保存。即使关闭动画，也不会漏记或重复计分。"}
          </DialogDescription>
          {modal === "day" && (
            <fieldset disabled={busy || !loaded} className="form-fieldset">
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="game-tabs">
                  <TabsTrigger value="study">学习主线</TabsTrigger>
                  <TabsTrigger value="usage">视频时长</TabsTrigger>
                  <TabsTrigger value="life">生活与睡眠</TabsTrigger>
                  <TabsTrigger value="review">结算预览</TabsTrigger>
                </TabsList>
                <TabsContent value="study">
                  <div className="dialog-section">
                    <div className="toolbar">
                      <button
                        className="outline-button"
                        onClick={() => planRef.current?.click()}
                      >
                        <Upload size={14} />
                        导入计划 JSON
                      </button>
                      {plans.length > 0 && (
                        <button
                          className="outline-button"
                          onClick={() =>
                            importPlan(
                              plans.find((p) => p.date === date) ||
                                plans.at(-1)!,
                            )
                          }
                        >
                          载入最近 Job Hub 计划
                        </button>
                      )}
                    </div>
                    <p className="fine-print">
                      {day.planSource}。钻石以下每个 block +1；钻石起每两个
                      +1，当天不足两个的余数不跨日累计。
                    </p>
                    {day.blocks.map((b, i) => (
                      <div className="block-editor" key={b.id}>
                        <div className="input-row">
                          <Checkbox
                            aria-label={`完成任务 ${i + 1}`}
                            checked={b.done}
                            onCheckedChange={(c) =>
                              update({
                                blocks: day.blocks.map((x) =>
                                  x.id === b.id ? { ...x, done: !!c } : x,
                                ),
                              })
                            }
                          />
                          <input
                            aria-label={`任务 ${i + 1} 名称`}
                            value={b.title}
                            maxLength={180}
                            onChange={(e) =>
                              update({
                                blocks: day.blocks.map((x) =>
                                  x.id === b.id
                                    ? { ...x, title: e.target.value }
                                    : x,
                                ),
                              })
                            }
                          />
                          <input
                            aria-label={`任务 ${i + 1} 分钟`}
                            className="number-input"
                            type="number"
                            min={1}
                            max={480}
                            value={b.minutes ?? ""}
                            placeholder="未确认"
                            onChange={(e) =>
                              update({
                                blocks: day.blocks.map((x) =>
                                  x.id === b.id
                                    ? { ...x, minutes: e.target.value === "" ? null : Number(e.target.value), minutesRange: undefined }
                                    : x,
                                ),
                              })
                            }
                          />
                          <small>min</small>
                          <button
                            className="quiet"
                            aria-label={`移除任务 ${i + 1}`}
                            onClick={() =>
                              update({
                                blocks: day.blocks.filter((x) => x.id !== b.id),
                              })
                            }
                          >
                            <X size={15} />
                          </button>
                        </div>
                        <textarea
                          aria-label={`任务 ${i + 1} 第一步`}
                          placeholder="第一步：打开哪一页，先做什么？"
                          value={b.firstAction}
                          rows={2}
                          onChange={(e) =>
                            update({
                              blocks: day.blocks.map((x) =>
                                x.id === b.id
                                  ? { ...x, firstAction: e.target.value }
                                  : x,
                              ),
                            })
                          }
                        />
                      </div>
                    ))}
                    <button
                      className="outline-button"
                      disabled={day.blocks.length >= 20}
                      onClick={() =>
                        update({
                          blocks: [
                            ...day.blocks,
                            {
                              id: uid(),
                              title: "新的学习任务",
                              minutes: 30,
                              done: false,
                              firstAction: "",
                            },
                          ],
                          planSource: day.blocks.length
                            ? day.planSource
                            : "手动计划",
                        })
                      }
                    >
                      <Plus size={14} />
                      添加 study block
                    </button>
                  </div>
                </TabsContent>
                <TabsContent value="usage">
                  <div className="dialog-section">
                    <p className="fine-print">
                      填写同一天的跨设备合计。聚合应用和它的子域名可能重复，请核对后保留一份。学习视频可选择「不计入」。游戏先支持手动录入。
                    </p>
                    {day.usage.map((u, i) => (
                      <div className="usage-editor" key={u.id}>
                        <input
                          aria-label={`来源 ${i + 1}`}
                          value={u.name}
                          placeholder="YouTube / bilibili"
                          onChange={(e) =>
                            update({
                              usage: day.usage.map((x) =>
                                x.id === u.id
                                  ? { ...x, name: e.target.value }
                                  : x,
                              ),
                              usageConfirmed: false,
                            })
                          }
                        />
                        <label>
                          <input
                            aria-label={`${u.name} 分钟`}
                            type="number"
                            min={0}
                            max={1440}
                            step="0.01"
                            value={Math.round((u.seconds / 60) * 100) / 100}
                            onChange={(e) =>
                              update({
                                usage: day.usage.map((x) =>
                                  x.id === u.id
                                    ? {
                                        ...x,
                                        seconds: Math.round(
                                          Number(e.target.value) * 60,
                                        ),
                                      }
                                    : x,
                                ),
                                usageConfirmed: false,
                              })
                            }
                          />
                          <small>分钟</small>
                        </label>
                        <select
                          aria-label={`${u.name} 分类`}
                          value={u.category}
                          onChange={(e) =>
                            update({
                              usage: day.usage.map((x) =>
                                x.id === u.id
                                  ? {
                                      ...x,
                                      category: e.target.value as
                                        | "video"
                                        | "game"
                                        | "excluded",
                                    }
                                  : x,
                              ),
                              usageConfirmed: false,
                            })
                          }
                        >
                          <option value="video">娱乐视频</option>
                          <option value="game">游戏</option>
                          <option value="excluded">不计入</option>
                        </select>
                        <button
                          className="quiet"
                          aria-label={`移除 ${u.name}`}
                          onClick={() =>
                            update({
                              usage: day.usage.filter((x) => x.id !== u.id),
                              usageConfirmed: false,
                            })
                          }
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <div className="toolbar">
                      <button
                        className="outline-button"
                        onClick={() =>
                          update({
                            usage: [
                              ...day.usage,
                              {
                                id: uid(),
                                name: "",
                                seconds: 0,
                                category: "video",
                              },
                            ],
                            usageConfirmed: false,
                          })
                        }
                      >
                        <Plus size={14} />
                        添加来源
                      </button>
                      <button className="text-link" onClick={useScreenshot}>
                        读取本机 StayFree 快照
                      </button>
                    </div>
                    <details className="import-box">
                      <summary>粘贴 StayFree 时长 / 简单 CSV</summary>
                      <p>
                        格式：名称,分钟。或 bilibili 4h 30m
                        35s。未知应用默认不计入，请手动分类。
                      </p>
                      <textarea
                        aria-label="粘贴使用时长"
                        placeholder={"bilibili 1h 20m\nYouTube 15m"}
                        value={usageText}
                        onChange={(e) => setUsageText(e.target.value)}
                        rows={4}
                      />
                      <button className="outline-button" onClick={importUsage}>
                        解析并替换来源列表
                      </button>
                    </details>
                    <div className="total-line">
                      <span>
                        娱乐总量 <b>{duration(totalSeconds)}</b>
                      </span>
                      <strong className="danger-text">
                        {dayVideoPenalty(day)
                          ? `−${dayVideoPenalty(day)}`
                          : "0"}{" "}
                        ★
                      </strong>
                    </div>
                    <p className="fine-print">{day.source}</p>
                    <label className="check-label">
                      <Checkbox
                        checked={day.usageConfirmed}
                        onCheckedChange={(c) => update({ usageConfirmed: !!c })}
                      />
                      我已核对这是全天总时长，并排除了重复统计
                    </label>
                    <p className="fine-print">
                      StayFree 尚未自动同步。当前可读取本机已保存快照，或粘贴 /
                      手动录入；未确认的时长不会自动视为零。
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="life">
                  <div className="dialog-section">
                    <div className="hobby-editor-grid">
                      {day.hobbies.map((h, i) => {
                        const Icon = hobbyIcons[i] || Star;
                        return (
                          <div className="hobby-editor" key={h.id}>
                            <Icon size={24} />
                            <h3>{h.title}</h3>
                            <label>
                              实际分钟
                              <input
                                aria-label={`${h.title} 实际分钟`}
                                type="number"
                                min={0}
                                max={1440}
                                value={h.minutes}
                                onChange={(e) =>
                                  update({
                                    hobbies: day.hobbies.map((x) =>
                                      x.id === h.id
                                        ? {
                                            ...x,
                                            minutes: Number(e.target.value),
                                          }
                                        : x,
                                    ),
                                  })
                                }
                              />
                            </label>
                            <span className="reward">
                              {h.minutes >= h.target
                                ? "✓ +1 ★"
                                : `满 ${h.target} min +1 ★`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      className="text-link"
                      onClick={() =>
                        update({
                          hobbies: [
                            ...day.hobbies,
                            {
                              id: uid(),
                              title: "新习惯",
                              minutes: 0,
                              target: 30,
                            },
                          ],
                        })
                      }
                      disabled={day.hobbies.length >= 12}
                    >
                      + 添加其他习惯
                    </button>
                    {day.hobbies.slice(4).map((h) => (
                      <label key={h.id} className="input-row">
                        习惯名称
                        <input
                          value={h.title}
                          aria-label="自定义习惯名称"
                          onChange={(e) =>
                            update({
                              hobbies: day.hobbies.map((x) =>
                                x.id === h.id
                                  ? { ...x, title: e.target.value }
                                  : x,
                              ),
                            })
                          }
                        />
                      </label>
                    ))}
                    <p className="fine-print">
                      每种生活支线每天最多 +1 星。健身第一版以完成 30
                      分钟记一次。
                    </p>
                    <div className="sleep-editor">
                      <Moon size={25} />
                      <div>
                        <h3>关闭所有设备，尝试入睡</h3>
                        <p>归属 {day.date} 这一晚；凌晨时间按次日计算。</p>
                      </div>
                      <input
                        aria-label="关闭设备时间"
                        type="time"
                        value={day.bedtime}
                        onChange={(e) => update({ bedtime: e.target.value })}
                      />
                      <strong
                        className={
                          daySleepScore(day) < 0
                            ? "danger-text"
                            : "gold-text"
                        }
                      >
                        {day.bedtime
                          ? `${sign(daySleepScore(day))} ★`
                          : "待录入"}
                      </strong>
                    </div>
                    <p className="fine-print">
                      ≤00:30 +1；00:31–00:59 0；01点 −1；02点 −2；03点 −4；04点
                      −8；05点及以后 −16。
                    </p>
                  </div>
                </TabsContent>
                <TabsContent value="review">
                  <div className="dialog-section">
                    {day.rewardOnlyReason && <p className="notice gold-text">✦ {day.rewardOnlyReason}。本日扣星已豁免，未知时长与睡眠保持未确认。</p>}
                    <div className="review-score">
                      <span>今日预计净变化</span>
                      <strong
                        className={
                          preview.net < 0 ? "danger-text" : "gold-text"
                        }
                      >
                        {sign(preview.net)} <small>★</small>
                      </strong>
                      <p>
                        获得 {preview.gained} · 扣除 {preview.lost} ·
                        实际段位变化 {sign(preview.applied)}
                      </p>
                    </div>
                    <div className="review-list">
                      {(
                        ["study", "hobby", "streak", "video", "sleep"] as const
                      ).map((type, i) => {
                        const ev = preview.events.filter(
                          (e) => e.type === type,
                        );
                        return (
                          <div key={type}>
                            <span>
                              {
                                [
                                  "学习主线",
                                  "生活支线",
                                  "连胜奖励",
                                  "视频 / 游戏",
                                  "睡眠",
                                ][i]
                              }
                            </span>
                            <b
                              className={
                                ev.reduce((n, e) => n + e.delta, 0) < 0
                                  ? "danger-text"
                                  : "gold-text"
                              }
                            >
                              {sign(ev.reduce((n, e) => n + e.delta, 0))} ★
                            </b>
                          </div>
                        );
                      })}
                    </div>
                    {preview.studyRemainder > 0 && (
                      <p className="fine-print">
                        钻石以上还有 1 个未配对的学习 block；本日再完成 1 个即可
                        +1。
                      </p>
                    )}
                    <label className="check-label">
                      <Checkbox
                        checked={day.useShield}
                        disabled={!day.rules.shield}
                        onCheckedChange={(c) => update({ useShield: !!c })}
                      />
                      若今天未达标，使用已拥有的连胜护盾（仅保留连胜，不抵扣星）
                    </label>
                    <textarea
                      aria-label="每日复盘"
                      placeholder="今天拿回了哪些时间？明天第一步是什么？"
                      value={day.note}
                      maxLength={2000}
                      onChange={(e) => update({ note: e.target.value })}
                      rows={3}
                    />
                    <p className="fine-print">
                      规则：
                      {day.rewardOnlyReason ? "本日仅计正向奖励" : day.rules.mode === "gradient" ? "梯度惩罚" : "线性惩罚"}
                      。全天时长{day.usageConfirmed ? " ✓" : " 未确认"} ·
                      入睡时间{day.bedtime ? " ✓" : " 未填写"}。
                      {day.settled
                        ? "修订此日后，后续战绩会按时间顺序重算；不会额外再发一份奖励。"
                        : "废铁Ⅲ 0 星为底线。无法扣除的星也会逐颗显示，不产生负债。"}
                    </p>
                    <button
                      className="gold-button full"
                      disabled={!canSettle(day) || busy}
                      onClick={settle}
                    >
                      {day.settled
                        ? "保存修订并重算"
                        : "确认行为 · 开始逐星结算"}
                      <Star size={17} />
                    </button>
                  </div>
                </TabsContent>
              </Tabs>
              <div className="dialog-bottom">
                <span>{dirty ? "● 草稿未保存" : "记录已保存"}</span>
                <button className="outline-button" onClick={saveDraft}>
                  <Save size={14} />
                  保存草稿
                </button>
              </div>
            </fieldset>
          )}
          {modal === "rules" && (
            <div className="dialog-section rules-content">
              <h3>段位阶梯</h3>
              <p>
                废铁 3×3 → 青铜 3×3 → 白银 3×3 → 黄金 4×4 → 铂金 4×4 → 钻石 5×5
                → 星耀 5×5 → 王者。共 109 颗段位星抵达王者，之后无上限。
              </p>
              <p>
                钻石以下每个完成的 study block
                +1；从每天开始时的段位判断，钻石及以上每两个
                +1。每种生活支线每天 +1。每天只结算一次，允许修订和重算。
              </p>
              <h3>时间的代价</h3>
              <div className="rule-table">
                <div>
                  <b>娱乐视频 / 游戏</b>
                  <span>≤1h 0 · &gt;1h −1 · &gt;2h −2 · &gt;3h −4</span>
                  <span>&gt;4h −8 · &gt;5h −16 · &gt;6h −32（上限）</span>
                </div>
                <div>
                  <b>关闭电子设备并尝试入睡</b>
                  <span>≤00:30 +1 · 00:31–00:59 0 · 01点 −1</span>
                  <span>02点 −2 · 03点 −4 · 04点 −8 · 05点后 −16</span>
                </div>
              </div>
              <p>
                两项分别计分。整点边界：视频恰好 2h 为 −1，超过 2h 才是
                −2；睡眠到 02:00 即 −2。段位最低为废铁Ⅲ 0 星，不积累负债。
              </p>
              <h3>连胜与复归</h3>
              <p>
                完成全部学习主线，且全天娱乐 ≤60
                分钟，视为完美一天。非空计划才可达标。第 3 / 7 / 14 / 30 天额外
                +1 / +2 / +3 / +5，之后每 30 天重复这一周期。
              </p>
              <p>
                每累计 7 个连胜达标日可得 1 面护盾，最多持有 1
                面。主动勾选才使用：仅保留连胜，不增加天数，不发奖励，不抵扣惩罚。严格连续天数依然归零。未录入的空白日不能自动用护盾。
              </p>
              <label className="input-row">
                新记录默认惩罚
                <select
                  value={state.rules.mode}
                  onChange={(e) => {
                    const rules = {
                      ...state.rules,
                      mode: e.target.value as "gradient" | "linear",
                    };
                    setState((s) => ({ ...s, rules }));
                    if (!day.settled) update({ rules });
                    setDirty(true);
                  }}
                >
                  <option value="gradient">梯度模式（当前方案）</option>
                  <option value="linear">线性模式（原方案）</option>
                </select>
              </label>
              <label className="check-label">
                <Checkbox
                  checked={state.rules.streak}
                  onCheckedChange={(c) => {
                    const rules = { ...state.rules, streak: !!c };
                    setState((s) => ({ ...s, rules }));
                    if (!day.settled) update({ rules });
                    setDirty(true);
                  }}
                />
                启用连胜里程碑奖励
              </label>
              <label className="check-label">
                <Checkbox
                  checked={state.rules.shield}
                  onCheckedChange={(c) => {
                    const rules = { ...state.rules, shield: !!c };
                    setState((s) => ({ ...s, rules }));
                    if (!day.settled) update({ rules });
                    setDirty(true);
                  }}
                />
                启用可赚取的连胜护盾
              </label>
              <button
                className="gold-button"
                disabled={busy || !loaded}
                onClick={saveDraft}
              >
                保存规则
              </button>
              <p className="fine-print">
                历史日保留当时的规则。线性模式：首小时免费，此后每开始一小时
                −1；睡眠 ≤00:30 +1，否则 −1。
                <a
                  target="_blank"
                  rel="noreferrer"
                  href="https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/"
                >
                  设计参考：Duolingo streak 实验 ↗
                </a>
              </p>
            </div>
          )}
          {modal === "focus" && (
            <div className="focus-content">
              {focus ? (
                <>
                  <div className="focus-target">{focus.title}</div>
                  <div
                    className={`timer-face ${remaining === 0 ? "finished" : ""}`}
                  >
                    {String(Math.floor(remaining / 60)).padStart(2, "0")}
                    <span>:</span>
                    {String(remaining % 60).padStart(2, "0")}
                  </div>
                  <Progress
                    value={(1 - remaining / focus.duration) * 100}
                    className="rank-progress"
                  />
                  <p>
                    {remaining === 0
                      ? "时间到了。确认实际完成，再领取属于你的进度。"
                      : focus.status === "paused"
                        ? "已暂停。准备好时再回来。"
                        : focus.kind === "hobby"
                          ? "让屏幕留在这里。把注意力交给你正在做的事。"
                          : "只打开任务需要的页面。下一步，不需要完美。"}
                  </p>
                  <small>
                    计时跨刷新保留；页面无法阻止其他应用。暂停不计时，完成后请确认真实投入。
                  </small>
                  <div className="toolbar">
                    {remaining > 0 && (
                      <button
                        className="outline-button"
                        disabled={busy}
                        onClick={focusToggle}
                      >
                        {focus.status === "running" ? (
                          <Pause size={16} />
                        ) : (
                          <Play size={16} />
                        )}{" "}
                        {focus.status === "running" ? "暂停" : "继续"}
                      </button>
                    )}
                    <button
                      className="gold-button"
                      disabled={busy}
                      onClick={finishFocus}
                    >
                      {remaining === 0
                        ? "确认完成"
                        : focus.kind === "hobby"
                          ? "结束并记录实际分钟"
                          : "结束计时，保留待完成"}
                    </button>
                  </div>
                  <button
                    className="text-link"
                    disabled={busy}
                    onClick={() => persist({ ...assembled(), focus: null })}
                  >
                    放弃本次计时（不记进度）
                  </button>
                </>
              ) : (
                <>
                  <Timer size={42} />
                  <h3>选择你的下一件事</h3>
                  <select
                    aria-label="专注任务"
                    value={focusChoice}
                    onChange={(e) => {
                      setFocusChoice(e.target.value);
                      const [k, id] = e.target.value.split(":");
                      setFocusMinutes(
                        k === "study"
                          ? day.blocks.find((b) => b.id === id)?.minutes || 30
                          : day.hobbies.find((h) => h.id === id)?.target || 30,
                      );
                    }}
                  >
                    <option value="study:">请选择一个任务</option>
                    <optgroup label="学习主线">
                      {day.blocks.map((b) => (
                        <option value={`study:${b.id}`} key={b.id}>
                          {b.title}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="生活支线">
                      {day.hobbies.map((h) => (
                        <option value={`hobby:${h.id}`} key={h.id}>
                          {h.title}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <div className="first-action">
                    {focusChoice.startsWith("study:")
                      ? day.blocks.find((b) => b.id === focusChoice.slice(6))
                          ?.firstAction || "先选任务，再迈出第一步。"
                      : "先把需要的东西拿到手边，然后离开屏幕。"}
                  </div>
                  <label className="timer-duration">
                    专注时长
                    <input
                      aria-label="专注时长分钟"
                      type="number"
                      min={1}
                      max={480}
                      value={focusMinutes}
                      onChange={(e) => setFocusMinutes(Number(e.target.value))}
                    />
                    分钟
                  </label>
                  <button
                    className="gold-button full"
                    disabled={
                      busy || !loaded || focusMinutes < 1 || focusMinutes > 480
                    }
                    onClick={startFocus}
                  >
                    <Play size={16} />
                    进入专注领域
                  </button>
                </>
              )}
            </div>
          )}
          {modal === "ranks" && (
            <div className="rank-detail">
              <Crest index={inspectRank} size={230} />
              <h2>{RANKS[inspectRank].name}</h2>
              <p>
                {inspectRank === 7
                  ? "王者 0 星起步 · 25 星无双 · 50 星荣耀 · 100 星传奇 · 无上限"
                  : `${RANKS[inspectRank].divisions} 个小段位，每段 ${RANKS[inspectRank].stars} 星`}
              </p>
              <p>累计 {RANKS[inspectRank].start} 颗段位星解锁</p>
              <div className="rank-detail-switch">
                {RANKS.map((r, i) => (
                  <button
                    aria-label={r.name}
                    className={i === inspectRank ? "selected" : ""}
                    key={i}
                    onClick={() => setInspectRank(i)}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {modal === "data" && (
            <div className="dialog-section">
              <div className="data-item">
                <Download size={25} />
                <div>
                  <h3>随时带走你的全部战绩</h3>
                  <p>
                    导出记录、规则和计时状态。备份包含个人信息，请妥善保存。
                  </p>
                </div>
                <button className="outline-button" onClick={exportBackup}>
                  导出 JSON
                </button>
              </div>
              <div className="data-item">
                <Upload size={25} />
                <div>
                  <h3>恢复一份备份</h3>
                  <p>
                    先读取，再由你点击恢复。恢复会替换当前记录，建议先导出。
                  </p>
                </div>
                <button
                  className="outline-button"
                  onClick={() => importRef.current?.click()}
                >
                  读取备份
                </button>
              </div>
              <div className="data-item">
                <BookOpen size={25} />
                <div>
                  <h3>导入 Job Hub</h3>
                  <p>
                    支持 study-plan/plans 中的 JSON。跨日期沿用时清空完成状态。
                  </p>
                </div>
                <button
                  className="outline-button"
                  onClick={() => {
                    setModal("day");
                    setTab("study");
                    planRef.current?.click();
                  }}
                >
                  选择计划
                </button>
              </div>
              <p className="fine-print">
                个人记录保存在数据库。浏览器仅暂存未提交草稿和音效偏好。本机 Job
                Hub 快照
                {planSync
                  ? `更新于 ${new Date(planSync).toLocaleString("zh-CN")}`
                  : "尚未载入"}
                ，不会自动读取新的计划。StayFree 尚无已验证的自动同步接口。
              </p>
            </div>
          )}
          {modal === "settlement" && result && (
            <div
              className={`settlement-content ${eventIndex >= 0 && eventIndex < result.events.length && result.events[eventIndex].delta < 0 ? "loss" : "win"}`}
            >
              <span className="eyebrow">
                {result.date} · {isReplay ? "REPLAY" : "MATCH COMPLETE"}
              </span>
              {eventIndex < result.events.length ? (
                <>
                  <Crest
                    index={
                      rankAt(
                        eventIndex < 0
                          ? result.before
                          : result.events[eventIndex].after,
                      ).index
                    }
                    size={190}
                  />
                  <div
                    key={eventIndex}
                    className="star-burst"
                    aria-live="polite"
                  >
                    {eventIndex < 0
                      ? "✦"
                      : result.events[eventIndex].delta > 0
                        ? "+1 ★"
                        : "−1 ★"}
                  </div>
                  <h2>
                    {eventIndex < 0
                      ? "你的每一分努力，即将点亮。"
                      : result.events[eventIndex].label}
                  </h2>
                  {eventIndex >= 0 && (
                    <>
                      <p className="event-rank">
                        {rankAt(result.events[eventIndex].after).label} ·{" "}
                        {rankAt(result.events[eventIndex].after).filled} ★
                      </p>
                      {result.events[eventIndex].promotion && (
                        <div className="promotion-banner">
                          ✦ 晋级 ·{" "}
                          {rankAt(result.events[eventIndex].after).label} ✦
                        </div>
                      )}
                      {result.events[eventIndex].demotion && (
                        <div className="demotion-banner">
                          段位回落 · 下一局再赢回来
                        </div>
                      )}
                      {result.events[eventIndex].before === 0 &&
                        result.events[eventIndex].delta < 0 && (
                          <p>底分保护 · 已记录扣星，不产生负债</p>
                        )}
                      {result.events[eventIndex].type === "streak" && (
                        <div className="promotion-banner">
                          {result.streak} DAYS · 连胜爆发
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <Crest index={rankAt(result.after).index} size={190} />
                  <h2 className="settled-title">
                    {result.perfect
                      ? "完美一天"
                      : result.net > 0
                        ? "向上，再一步"
                        : result.net < 0
                          ? "明天，重新出发"
                          : "每一步都算数"}
                  </h2>
                  <div className="final-score">{sign(result.applied)} ★</div>
                  <p>
                    {rankAt(result.before).label} → {rankAt(result.after).label}
                  </p>
                  <div className="settlement-totals">
                    <span>
                      获得 <b>+{result.gained}</b>
                    </span>
                    <span>
                      扣除 <b>{result.lost ? `−${result.lost}` : "0"}</b>
                    </span>
                  </div>
                  {result.rewardOnlyReason && <p className="gold-text">✦ {result.rewardOnlyReason}</p>}
                  {result.shieldUsed && (
                    <p className="gold-text">◇ 护盾已消耗 · 连胜守住了</p>
                  )}
                  <button
                    className="gold-button"
                    onClick={() => setModal(null)}
                  >
                    收下今天，继续攀登
                  </button>
                  <details className="event-ledger">
                    <summary>逐星明细 · {result.events.length} 颗</summary>
                    {result.events.map((e, i) => (
                      <div key={i}>
                        <span>{e.label}</span>
                        <b>{sign(e.delta)} ★</b>
                      </div>
                    ))}
                  </details>
                </>
              )}
              {eventIndex < result.events.length && (
                <div className="playback-controls">
                  <span>
                    {Math.max(0, eventIndex + 1)} / {result.events.length}
                  </span>
                  <button
                    className="outline-button"
                    onClick={() => setPlaying(!playing)}
                  >
                    {playing ? <Pause size={14} /> : <Play size={14} />}
                    {playing ? "暂停" : "播放"}
                  </button>
                  <button
                    className="outline-button"
                    onClick={() => {
                      setPlaying(false);
                      setEventIndex((i) =>
                        Math.min(result.events.length, i + 1),
                      );
                    }}
                  >
                    下一颗
                  </button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <input
        ref={importRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          inputFile(e.target.files?.[0], "backup");
          e.target.value = "";
        }}
      />
      <input
        ref={planRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          inputFile(e.target.files?.[0], "plan");
          e.target.value = "";
        }}
      />
    </main>
  );
}
function Trajectory({ results, range }: { results: Result[]; range: number }) {
  const start = shiftDay(today(), -(range - 1)),
    dates = Array.from({ length: range }, (_, i) => shiftDay(start, i));
  let total = results.filter((r) => r.date < start).at(-1)?.after ?? 0;
  const values = dates.map((d) => {
    const r = results.find((r) => r.date === d);
    if (r) total = r.after;
    return total;
  });
  const max = Math.max(9, ...values),
    W = 900,
    H = 200;
  const points = values
    .map(
      (v, i) =>
        `${40 + (i / (range - 1)) * (W - 65)},${H - 30 - (v / max) * (H - 60)}`,
    )
    .join(" ");
  return (
    <div className="trajectory">
      <div className="section-title">
        <h3>星光轨迹</h3>
        <span>累计段位星</span>
      </div>
      <svg
        role="img"
        aria-label={`过去 ${range} 天累计星数从 ${values[0]} 到 ${values.at(-1)}`}
        viewBox={`0 0 ${W} ${H}`}
      >
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cfb174" stopOpacity=".2" />
            <stop offset="100%" stopColor="#cfb174" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line
              x1="40"
              x2={W - 25}
              y1={H - 30 - f * (H - 60)}
              y2={H - 30 - f * (H - 60)}
              stroke="#ffffff12"
            />
            <text x="4" y={H - 26 - f * (H - 60)} fill="#8493a5" fontSize="10">
              {Math.round(max * f)}
            </text>
          </g>
        ))}
        <polygon
          points={`40,${H - 30} ${points} ${W - 25},${H - 30}`}
          fill="url(#chartFill)"
        />
        <polyline
          fill="none"
          stroke="#d5b878"
          strokeWidth="2"
          points={points}
        />
        {values.map((v, i) => (
          <circle
            key={i}
            cx={40 + (i / (range - 1)) * (W - 65)}
            cy={H - 30 - (v / max) * (H - 60)}
            r={results.some((r) => r.date === dates[i]) ? 3 : 0}
            fill="#dec790"
          >
            <title>
              {dates[i]} · {v} 星
            </title>
          </circle>
        ))}
        <text x="40" y={H - 5} fill="#8292a5" fontSize="10">
          {dates[0]}
        </text>
        <text x={W - 100} y={H - 5} fill="#8292a5" fontSize="10">
          {dates.at(-1)}
        </text>
      </svg>
    </div>
  );
}
