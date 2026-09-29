import { z } from "zod";
import { today, canSettle } from "./game";
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(v + "T12:00:00Z");
    return (
      !Number.isNaN(+d) &&
      d.toISOString().slice(0, 10) === v &&
      v <= today() &&
      v >= "2020-01-01"
    );
  }, "请选择今天或之前的有效日期");
const label = z.string().trim().min(1).max(180),
  id = z.string().min(1).max(100);
const rules = z.object({
  mode: z.enum(["gradient", "linear"]),
  streak: z.boolean(),
  shield: z.boolean(),
});
const unique = (a: { id: string }[]) =>
  new Set(a.map((x) => x.id)).size === a.length;
const day = z
  .object({
    date,
    blocks: z
      .array(
        z.object({
          id,
          title: label,
          minutes: z.number().int().min(1).max(480).nullable(),
          minutesRange: z.object({
            min: z.number().int().min(1).max(1440),
            max: z.number().int().min(1).max(1440),
          }).refine(v => v.min <= v.max, "时长区间无效").optional(),
          done: z.boolean(),
          firstAction: z.string().max(1200),
        }),
      )
      .max(20)
      .refine(unique, "任务 ID 重复"),
    hobbies: z
      .array(
        z.object({
          id,
          title: label,
          minutes: z.number().int().min(0).max(1440),
          target: z.number().int().min(1).max(240),
        }),
      )
      .max(12)
      .refine(unique),
    usage: z
      .array(
        z.object({
          id,
          name: label,
          seconds: z.number().int().min(0).max(86400),
          category: z.enum(["video", "game", "excluded"]),
        }),
      )
      .max(100)
      .refine(unique)
      .refine(
        (v) => v.reduce((s, x) => s + x.seconds, 0) <= 86400,
        "合计不能超过 24 小时，请检查跨设备重复",
      ),
    usageConfirmed: z.boolean(),
    source: z.string().max(500),
    bedtime: z.string().regex(/^(?:|(?:[01]\d|2[0-3]):[0-5]\d)$/),
    note: z.string().max(2000),
    settled: z.boolean(),
    rules,
    planSource: z.string().max(300),
    useShield: z.boolean(),
    rewardOnlyReason: z.string().trim().min(1).max(300).optional(),
    studySession: z.object({ id, studyDate: date, planDate: date }).optional(),
  })
  .refine(
    (d) => !d.settled || canSettle(d),
    "结算前请确认全天娱乐时长并填写关闭设备时间",
  );
export const stateSchema = z.object({
  days: z
    .array(day)
    .max(4000)
    .refine(
      (v) => new Set(v.map((d) => d.date)).size === v.length,
      "同一天不能重复记录",
    ),
  rules,
  focus: z
    .object({
      id,
      day: date,
      kind: z.enum(["study", "hobby"]),
      targetId: id,
      title: label,
      duration: z.number().int().min(60).max(28800),
      remaining: z.number().min(0).max(28800),
      endsAt: z.number().nullable(),
      status: z.enum(["running", "paused", "finished"]),
    })
    .refine(f => f.remaining <= f.duration && (f.status !== "running" || f.endsAt !== null), "计时状态无效")
    .nullable(),
});
export const envelopeSchema = z.object({
  version: z.number().int().min(0),
  state: stateSchema,
});
