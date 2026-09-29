import { env } from "cloudflare:workers";
export function store() {
  if (!env.DB) throw new Error("Database unavailable");
  return env.DB;
}
