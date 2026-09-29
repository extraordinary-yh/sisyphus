import { getChatGPTUser } from "@/app/chatgpt-auth";
import { store } from "@/db/store";
import { emptyState, replay } from "@/lib/game";
import { envelopeSchema } from "@/lib/validation";
const noCache = { "Cache-Control": "no-store" };
export async function GET() {
  try {
    const user = await getChatGPTUser();
    if (!user)
      return Response.json(
        { error: "请先登录以保存你的排位记录。" },
        { status: 401, headers: noCache },
      );
    const row = await store()
      .prepare("SELECT state, version FROM players WHERE id = ?")
      .bind(user.userId)
      .first<{ state: string; version: number }>();
    const state = row ? JSON.parse(row.state) : emptyState();
    return Response.json(
      { state, version: row?.version ?? 0, results: replay(state.days) },
      { headers: noCache },
    );
  } catch (e) {
    console.error("Load player failed", e);
    return Response.json(
      { error: "记录暂时无法读取，请重试。" },
      { status: 503, headers: noCache },
    );
  }
}
export async function PUT(request: Request) {
  try {
    const user = await getChatGPTUser();
    if (!user) return Response.json({ error: "请先登录。" }, { status: 401 });
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin)
      return Response.json({ error: "来源不匹配" }, { status: 403 });
    const body = await request.text();
    if (body.length > 2_000_000)
      return Response.json(
        { error: "记录过大，请分批导入。" },
        { status: 413 },
      );
    let raw;
    try {
      raw = JSON.parse(body);
    } catch {
      return Response.json(
        { error: "不是有效的 JSON 文件。" },
        { status: 400 },
      );
    }
    const parsed = envelopeSchema.safeParse(raw);
    if (!parsed.success)
      return Response.json(
        { error: parsed.error.issues.map((i) => i.message).join("；") },
        { status: 400 },
      );
    const { state, version } = parsed.data;
    const next = version + 1;
    const result = await store()
      .prepare(
        "INSERT INTO players (id,state,version,updated_at) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state,version=excluded.version,updated_at=excluded.updated_at WHERE players.version = ?",
      )
      .bind(
        user.userId,
        JSON.stringify(state),
        next,
        new Date().toISOString(),
        version,
      )
      .run();
    if (!result.meta.changes)
      return Response.json(
        {
          error:
            "记录已在另一个窗口更新。你的草稿仍保留，请先导出备份，再重新载入合并。",
        },
        { status: 409 },
      );
    return Response.json(
      { state, version: next, results: replay(state.days) },
      { headers: noCache },
    );
  } catch (e) {
    console.error("Save player failed", e);
    return Response.json(
      { error: "保存失败，草稿已保留。请重试。" },
      { status: 503 },
    );
  }
}
