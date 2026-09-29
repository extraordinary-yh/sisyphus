export const TIMEZONE = "America/Los_Angeles";
export const RANKS = [
  { name: "废铁", subtitle: "初始之火", divisions: 3, stars: 3, start: 0 },
  { name: "青铜", subtitle: "倔强青铜", divisions: 3, stars: 3, start: 9 },
  { name: "白银", subtitle: "秩序白银", divisions: 3, stars: 3, start: 18 },
  { name: "黄金", subtitle: "荣耀黄金", divisions: 4, stars: 4, start: 27 },
  { name: "铂金", subtitle: "尊贵铂金", divisions: 4, stars: 4, start: 43 },
  { name: "钻石", subtitle: "永恒钻石", divisions: 5, stars: 5, start: 59 },
  { name: "星耀", subtitle: "至尊星耀", divisions: 5, stars: 5, start: 84 },
  { name: "王者", subtitle: "最强王者", divisions: 0, stars: 0, start: 109 },
];
const roman = ["", "Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ"];
export type Block = {
  id: string;
  title: string;
  minutes: number;
  done: boolean;
  firstAction: string;
};
export type Hobby = {
  id: string;
  title: string;
  minutes: number;
  target: number;
};
export type Usage = {
  id: string;
  name: string;
  seconds: number;
  category: "video" | "game" | "excluded";
};
export type Rules = {
  mode: "gradient" | "linear";
  streak: boolean;
  shield: boolean;
};
export type Day = {
  date: string;
  blocks: Block[];
  hobbies: Hobby[];
  usage: Usage[];
  usageConfirmed: boolean;
  source: string;
  bedtime: string;
  note: string;
  settled: boolean;
  rules: Rules;
  planSource: string;
  useShield: boolean;
};
export type Focus = {
  id: string;
  day: string;
  kind: "study" | "hobby";
  targetId: string;
  title: string;
  duration: number;
  remaining: number;
  endsAt: number | null;
  status: "running" | "paused" | "finished";
};
export function focusRemaining(focus: Focus | null, now: number) {
  if (!focus) return 0;
  const remaining = focus.status === "running" && focus.endsAt !== null
    ? Math.ceil((focus.endsAt - now) / 1000)
    : focus.remaining;
  return Math.min(focus.duration, Math.max(0, remaining));
}
export type GameState = { days: Day[]; rules: Rules; focus: Focus | null };
export type StarEvent = {
  label: string;
  delta: number;
  before: number;
  after: number;
  type: "study" | "hobby" | "streak" | "video" | "sleep";
  promotion: boolean;
  demotion: boolean;
};
export type Result = {
  date: string;
  before: number;
  after: number;
  gained: number;
  lost: number;
  net: number;
  applied: number;
  events: StarEvent[];
  perfect: boolean;
  streak: number;
  strictStreak: number;
  shieldUsed: boolean;
  shields: number;
  bonus: number;
  studyRemainder: number;
};
export const DEFAULT_RULES: Rules = {
  mode: "gradient",
  streak: true,
  shield: true,
};
export const emptyState = (): GameState => ({
  days: [],
  rules: { ...DEFAULT_RULES },
  focus: null,
});
export function today(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function shiftDay(date: string, n: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function rankAt(score: number) {
  score = Math.max(0, Math.floor(score));
  let index = RANKS.findLastIndex((r) => score >= r.start);
  if (index < 0) index = 0;
  const r = RANKS[index];
  const offset = score - r.start;
  const division = index === 7 ? 0 : r.divisions - Math.floor(offset / r.stars);
  const stars = index === 7 ? offset : offset % r.stars;
  const name =
    index === 7
      ? stars >= 100
        ? "传奇王者"
        : stars >= 50
          ? "荣耀王者"
          : stars >= 25
            ? "无双王者"
            : "最强王者"
      : `${r.name} ${roman[division]}`;
  return {
    ...r,
    index,
    division,
    filled: stars,
    label: name,
    needed: index === 7 ? null : r.stars - stars,
  };
}
export function entertainmentSeconds(day: Day) {
  return day.usage
    .filter((u) => u.category !== "excluded")
    .reduce((s, u) => s + u.seconds, 0);
}
export function videoPenalty(
  seconds: number,
  mode: Rules["mode"] = "gradient",
) {
  if (seconds <= 3600) return 0;
  const hours = Math.ceil((seconds - 3600) / 3600);
  return mode === "linear" ? hours : Math.min(32, 2 ** (hours - 1));
}
export function sleepScore(time: string, mode: Rules["mode"] = "gradient") {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  const mins = h * 60 + m;
  const night = mins >= 12 * 60 ? mins - 24 * 60 : mins;
  if (night <= 30) return 1;
  if (mode === "linear") return -1;
  if (night < 60) return 0;
  return -Math.min(16, 2 ** (Math.floor(night / 60) - 1));
}
export function duration(seconds: number) {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60);
  return h
    ? `${h}h ${m}m`
    : m
      ? `${m}m${s % 60 ? ` ${s % 60}s` : ""}`
      : `${s}s`;
}
export function newDay(date: string, rules: Rules = DEFAULT_RULES): Day {
  return {
    date,
    blocks: [],
    hobbies: [
      { id: "guitar", title: "吉他", minutes: 0, target: 30 },
      { id: "french", title: "法语", minutes: 0, target: 30 },
      { id: "reading", title: "阅读", minutes: 0, target: 30 },
      { id: "gym", title: "健身", minutes: 0, target: 30 },
    ],
    usage: [],
    usageConfirmed: false,
    source: "手动录入",
    bedtime: "",
    note: "",
    settled: false,
    rules: { ...rules },
    planSource: "尚未添加学习计划",
    useShield: false,
  };
}
export function milestone(n: number) {
  const d = n % 30;
  return d === 3 ? 1 : d === 7 ? 2 : d === 14 ? 3 : d === 0 && n > 0 ? 5 : 0;
}
export function replay(days: Day[]): Result[] {
  let total = 0,
    streak = 0,
    strictStreak = 0,
    shields = 0,
    previous = "";
  const results: Result[] = [];
  for (const day of [...days]
    .filter((d) => d.settled)
    .sort((a, b) => a.date.localeCompare(b.date))) {
    if (previous && shiftDay(previous, 1) !== day.date) {
      streak = 0;
      strictStreak = 0;
    }
    const before = total;
    const events: StarEvent[] = [];
    const add = (label: string, delta: number, type: StarEvent["type"]) => {
      const count = Math.abs(delta);
      for (let i = 0; i < count; i++) {
        const prev = total;
        total = Math.max(0, total + Math.sign(delta));
        const oldRank = rankAt(prev),
          newRank = rankAt(total);
        events.push({
          label: count > 1 ? `${label} · ${i + 1}/${count}` : label,
          delta: Math.sign(delta),
          before: prev,
          after: total,
          type,
          promotion: newRank.label !== oldRank.label && total > prev,
          demotion: newRank.label !== oldRank.label && total < prev,
        });
      }
    };
    const completed = day.blocks.filter((b) => b.done);
    const divisor = rankAt(before).index >= 5 ? 2 : 1;
    for (let i = 0; i + divisor <= completed.length; i += divisor)
      add(
        divisor === 1
          ? completed[i].title
          : `${completed[i].title} + ${completed[i + 1].title}`,
        1,
        "study",
      );
    for (const h of day.hobbies)
      if (h.minutes >= h.target)
        add(`${h.title} · ${h.minutes} min`, 1, "hobby");
    const perfect =
      day.blocks.length > 0 &&
      completed.length === day.blocks.length &&
      day.usageConfirmed &&
      entertainmentSeconds(day) <= 3600;
    let shieldUsed = false,
      bonus = 0;
    if (perfect) {
      streak++;
      strictStreak++;
      if (day.rules.streak) {
        bonus = milestone(streak);
        if (bonus) add(`${streak} 天连胜 · 里程碑`, bonus, "streak");
      }
      if (day.rules.shield && streak % 7 === 0)
        shields = Math.min(1, shields + 1);
    } else {
      strictStreak = 0;
      if (day.rules.shield && day.useShield && shields > 0 && streak > 0) {
        shields--;
        shieldUsed = true;
      } else streak = 0;
    }
    const sleep = sleepScore(day.bedtime, day.rules.mode);
    if (sleep > 0) add("早睡 · 关闭全部设备", sleep, "sleep");
    add(
      `娱乐 ${duration(entertainmentSeconds(day))}`,
      -videoPenalty(entertainmentSeconds(day), day.rules.mode),
      "video",
    );
    if (sleep < 0) add(`晚睡 · ${day.bedtime}`, sleep, "sleep");
    const gained = events.filter((e) => e.delta > 0).length,
      lost = events.filter((e) => e.delta < 0).length;
    results.push({
      date: day.date,
      before,
      after: total,
      gained,
      lost,
      net: gained - lost,
      applied: total - before,
      events,
      perfect,
      streak,
      strictStreak,
      shieldUsed,
      shields,
      bonus,
      studyRemainder: completed.length % divisor,
    });
    previous = day.date;
  }
  return results;
}
export function previewDay(day: Day, days: Day[]) {
  return replay([
    ...days.filter((d) => d.date !== day.date),
    { ...day, settled: true },
  ]).find((r) => r.date === day.date)!;
}
export function parseUsage(text: string): Usage[] {
  const rows: Usage[] = [];
  for (const line of text.split(/\n/)) {
    const match = line.match(
      /(?:^|[,\t])\s*([^,\t]+?)\s*[,\t]\s*(\d+(?:\.\d+)?)\s*(?=$|[,\t])/,
    );
    if (match) {
      const name = match[1].trim();
      if (/^name|app|website|date/i.test(name)) continue;
      const seconds = Math.round(Number(match[2]) * 60);
      if (seconds >= 0 && seconds <= 86400)
        rows.push({
          id: `import-${rows.length}`,
          name,
          seconds,
          category:
            /youtube|youtu.be|bilibili|哔哩|netflix|twitch|抖音|tiktok|视频/i.test(
              name,
            )
              ? "video"
              : "excluded",
        });
      continue;
    }
    const name = line.match(
      /^\s*([\w.\u4e00-\u9fa5 -]+?)\s+(?=\d+\s*[hms小时分钟秒])/i,
    )?.[1];
    if (name) {
      let seconds = 0;
      for (const m of line.matchAll(/(\d+)\s*(h|小时|m|分钟|s|秒)/g))
        seconds +=
          Number(m[1]) *
          (m[2] === "h" || m[2] === "小时"
            ? 3600
            : m[2] === "m" || m[2] === "分钟"
              ? 60
              : 1);
      rows.push({
        id: `import-${rows.length}`,
        name: name.trim(),
        seconds,
        category: /youtube|bilibili|哔哩|netflix|twitch|tiktok|抖音/i.test(name)
          ? "video"
          : "excluded",
      });
    }
  }
  return rows;
}
