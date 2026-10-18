import { NextRequest } from "next/server";
import { cityCountry, getCity, isCoreCorridor } from "@/lib/geo";
import { leadFromToken } from "@/lib/lead-codec";
import { leadRepository } from "@/lib/lead-store";
import { matchLead } from "@/lib/matching";
import { getMover, NETWORK_PARTNER_CLAIM } from "@/lib/movers";
import { createRng } from "@/lib/rand";
import { toPublicQuote } from "@/lib/types";
import type { PublicQuote, SearchEvent, StageParams } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Progressive quote search.
 *
 * Streams newline-delimited JSON so the results board can paint the first
 * partner within a second and keep filling while the rest of the network is
 * polled. A single blocking JSON response would be simpler, but the perceived
 * wait is what kills conversion on comparison products — showing the search
 * working is the product.
 *
 * Event protocol: see `SearchEvent` in lib/types.ts.
 */

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const MAX_INSTANT = 12;
const MAX_BIDS = 4;

export async function POST(request: NextRequest) {
  let body: { leadId?: string; token?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const leadId = typeof body.leadId === "string" ? body.leadId : null;
  const token = typeof body.token === "string" ? body.token : null;
  if (!leadId) {
    return Response.json({ error: "leadId is required" }, { status: 400 });
  }

  // Prefer the stored lead (full fidelity); fall back to the URL token so a
  // shared link still works against a cold instance.
  const stored = await leadRepository.get(leadId);
  const lead = stored ?? (token ? leadFromToken(leadId, token) : null);
  if (!lead) {
    return Response.json({ error: "Lead not found or expired" }, { status: 404 });
  }

  const result = matchLead(lead);
  if (!result) {
    return Response.json({ error: "No corridor available for this route" }, { status: 422 });
  }

  const from = getCity(lead.origin.cityCode);
  const to = getCity(lead.destination.cityCode);
  const corridor = result.basis.corridor;

  // Instant-match partners first — that is the Pro Unlimited promise — then
  // the partners who still have to pick the lead up.
  // Both tiers always get representation: capping the list globally would let
  // a dense corridor crowd out the pay-per-lead partners entirely, and the
  // customer would never see that option exists.
  const instant = result.quotes.filter((q) => q.kind === "instant").slice(0, MAX_INSTANT);
  const bids = result.quotes.filter((q) => q.kind === "bid").slice(0, MAX_BIDS);

  // Strip every money field here, once, at the boundary. Nothing downstream —
  // not the stream, not the client, not the network tab — sees a price.
  const ordered: PublicQuote[] = [...instant, ...bids].map((quote) =>
    toPublicQuote(quote, getMover(quote.moverId)?.responseMins ?? 60),
  );

  const rng = createRng("stream", lead.id);
  const started = Date.now();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: SearchEvent) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };
      const aborted = () => request.signal.aborted;

      try {
        send({
          type: "open",
          leadId: lead.id,
          corridor: corridor.label,
          partnersScanned: NETWORK_PARTNER_CLAIM,
          startedAt: started,
        });

        const core = isCoreCorridor(corridor);

        const stages: Array<{
          id: string;
          label: string;
          detail: string;
          progress: number;
          wait: number;
          params?: StageParams;
        }> = [
          {
            id: "secure",
            label: "Securing your enquiry",
            detail: "Encrypted and verified",
            progress: 8,
            wait: 420,
          },
          {
            id: "corridor",
            label: `Opening corridor ${from?.code ?? "???"} → ${to?.code ?? "???"}`,
            detail: core
              ? `${corridor.label} · ${corridor.transitDays[0]}–${corridor.transitDays[1]} days typical`
              : `Extended network routing via ${corridor.label}`,
            progress: 20,
            wait: 520,
            params: {
              fromCode: from?.code,
              toCode: to?.code,
              corridorId: corridor.id,
              corridorLabel: corridor.label,
              coreCorridor: core,
              transitDays: corridor.transitDays,
            },
          },
          {
            id: "partners",
            label: `Polling ${NETWORK_PARTNER_CLAIM} partner carriers`,
            detail: `${cityCountry(from!).name} and ${cityCountry(to!).name} licensed operators`,
            progress: 34,
            wait: 480,
            // ISO codes, not names: the client turns these into country names
            // through ICU, so we are not shipping English place names either.
            params: {
              count: NETWORK_PARTNER_CLAIM,
              fromCountry: cityCountry(from!).iso,
              toCountry: cityCountry(to!).iso,
            },
          },
        ];

        for (const stage of stages) {
          if (aborted()) return;
          await sleep(stage.wait);
          send({ type: "stage", ...stage });
        }

        const midStage = Math.floor(ordered.length * 0.4);
        const lateStage = Math.floor(ordered.length * 0.75);

        for (let i = 0; i < ordered.length; i++) {
          if (aborted()) return;
          // Front-load the first few results, then settle into a steady drip.
          const gap = i === 0 ? 300 : i < 4 ? rng.int(190, 330) : rng.int(230, 430);
          await sleep(gap);

          send({ type: "quote", quote: ordered[i], index: i, total: ordered.length });

          if (i === midStage) {
            send({
              type: "stage",
              id: "capacity",
              label: "Confirming vehicle capacity",
              detail: `Checking crews free around ${lead.moveDate}`,
              progress: 58,
              params: { date: lead.moveDate },
            });
          }
          if (i === lateStage) {
            send({
              type: "stage",
              id: "route",
              label: "Checking route capacity",
              detail: "Ferry slots, border crossings and crews",
              progress: 82,
            });
          }
        }

        if (aborted()) return;
        await sleep(260);

        send({
          type: "stage",
          id: "ranking",
          label: "Ranking your matches",
          detail: "Coverage, speed, reliability and reviews",
          progress: 100,
        });
        await sleep(180);
        send({
          type: "done",
          total: ordered.length,
          instant: ordered.filter((q) => q.kind === "instant").length,
          fastestDays: Math.min(...ordered.map((q) => q.transitDays[1])),
          elapsedMs: Date.now() - started,
        });
      } catch {
        // Client disconnected mid-stream; nothing to recover.
      } finally {
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      // Stops nginx/proxies buffering the stream into one chunk.
      "X-Accel-Buffering": "no",
    },
  });
}
