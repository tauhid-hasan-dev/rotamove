import { NextRequest } from "next/server";
import { encodeMoveSpec } from "@/lib/lead-codec";
import { leadDraftSchema } from "@/lib/lead-schema";
import { leadRepository } from "@/lib/lead-store";
import { matchLead } from "@/lib/matching";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lead intake.
 *
 * Validates with the same schema the wizard uses, persists through the
 * repository, and returns the id plus a PII-free token the results page can
 * use to rehydrate the search from a shared or refreshed URL.
 */
export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = leadDraftSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Validation failed",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 422 },
    );
  }

  const lead = await leadRepository.create(parsed.data);
  const match = matchLead(lead);

  // Deliberately minimal: the consumer response carries no pricing of any
  // kind, not even the partner-side lead fee. Mirrors the per-tier caps the
  // search stream applies so the client can size its skeletons.
  return Response.json(
    {
      id: lead.id,
      token: encodeMoveSpec(lead),
      expectedMatches:
        Math.min(12, match?.instantCount ?? 0) + Math.min(4, match?.bidCount ?? 0),
      instantMatches: Math.min(12, match?.instantCount ?? 0),
    },
    { status: 201 },
  );
}

export async function GET() {
  const count = await leadRepository.count();
  return Response.json({ count });
}
