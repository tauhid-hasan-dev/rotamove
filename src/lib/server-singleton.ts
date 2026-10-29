/**
 * One instance of an in-memory store per server process.
 *
 * Every repository in this demo keeps its state in a `Map` rather than a
 * database, which makes the identity of the instance load-bearing: a writer
 * and a reader holding different objects hold different data, and the product
 * appears to forget everything the moment you navigate.
 *
 * That is exactly what used to happen in a production build. Each store
 * stashed itself on `globalThis` only when `NODE_ENV !== "production"` — the
 * familiar Prisma idiom, whose purpose is to survive a dev-server hot reload.
 * But Next compiles page renders and route handlers into separate module
 * graphs, so in production `plan-store.ts` was evaluated twice and there were
 * two Maps: `POST /api/partners/plan` wrote the new plan into one, the
 * dashboard read the old plan out of the other, and a plan change survived
 * the toast and then vanished on reload. The same split silently affected
 * lanes, unlocks, leads and partner profiles, all of which are written by a
 * route and read by a page.
 *
 * So the registry is unconditional. The dev-reload reason for keeping it is
 * still true; the production reason is stronger, because there the graphs are
 * split by design rather than by accident.
 *
 * This is a single-process store either way. It does not survive a restart,
 * and on serverless it does not survive moving between instances — which is
 * the honest limit of an in-memory demo, and the thing a real database fixes.
 * `serverSingleton` is the seam: swap the factories and nothing else changes.
 */
export function serverSingleton<T>(key: string, create: () => T): T {
  const registry = globalThis as unknown as Record<string, T | undefined>;
  const existing = registry[key];
  if (existing) return existing;
  const made = create();
  registry[key] = made;
  return made;
}
