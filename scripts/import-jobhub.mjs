import fs from "node:fs";
import path from "node:path";
const root = process.argv[2] || process.env.JOB_HUB_ROOT;
if (!root)
  throw new Error(
    "Pass the Job Hub path as the first argument, or set JOB_HUB_ROOT.",
  );
const plansPath = path.join(root, "study-plan/plans");
const files = fs
  .readdirSync(plansPath)
  .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
  .sort()
  .slice(-30);
const plans = files.map((f) => {
  const p = JSON.parse(fs.readFileSync(path.join(plansPath, f), "utf8"));
  return {
    date: p.date,
    blocks: p.blocks.map((b) => ({
      id: b.id,
      title: b.title,
      minutes: b.minutes,
      done: !!b.done,
      firstAction: b.first_action || "",
    })),
  };
});
fs.mkdirSync("private-data", { recursive: true });
fs.writeFileSync(
  "private-data/jobhub-plans.json",
  JSON.stringify({ syncedAt: new Date().toISOString(), plans }, null, 2),
);
console.log(
  `Imported ${plans.length} plans, latest ${plans.at(-1)?.date}. Job Hub unchanged.`,
);
