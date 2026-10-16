import { NextRequest } from "next/server";
import { MOVERS } from "@/lib/movers";
import type { RegionId } from "@/lib/geo";

export const runtime = "nodejs";

/**
 * Public partner directory.
 *
 * Read-only and cacheable. Partners' own integrations use this to confirm how
 * they appear on the network; the marketing site uses it for the directory.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get("region") as RegionId | null;
  const plan = searchParams.get("plan");
  const limit = Math.min(100, Number(searchParams.get("limit") ?? 50) || 50);

  const results = MOVERS.filter((m) => {
    if (region && !m.regions.includes(region)) return false;
    if (plan && m.plan !== plan) return false;
    return true;
  })
    .slice(0, limit)
    .map((m) => ({
      id: m.id,
      slug: m.slug,
      name: m.name,
      hqCity: m.hqCity,
      plan: m.plan,
      regions: m.regions,
      corridors: m.corridors,
      modes: m.modes,
      rating: m.rating,
      reviewCount: m.reviewCount,
      onTimeRate: m.onTimeRate,
      responseMins: m.responseMins,
      certifications: m.certifications,
      services: m.services,
    }));

  return Response.json(
    { count: results.length, movers: results },
    { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } },
  );
}
