"use client";

import { useMemo, useState } from "react";
import { Receipt, ShieldAlert } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { SwitchRow } from "@/components/quote/fields";
import { type RegionId } from "@/lib/geo";
import {
  LEAD_FEE_CAP_USD,
  LEAD_FEE_FLOOR_USD,
  PRO_MONTHLY_USD,
  leadFeeUsd,
  leadQualityScore,
} from "@/lib/plans";
import { addDays, todayIso } from "@/lib/format";
import { useI18n } from "@/i18n/provider";
import { regionName } from "@/i18n/geo-labels";
import type { Lead } from "@/lib/types";
import { cn } from "@/lib/utils";

const DESTINATIONS: Array<{ region: RegionId; city: string }> = [
  { region: "EU_WEST", city: "BER" },
  { region: "EU_SOUTH", city: "MIL" },
  { region: "BALKANS", city: "BEG" },
  { region: "NORDICS", city: "STO" },
  { region: "CIS", city: "MOW" },
  { region: "CENTRAL_ASIA", city: "TAS" },
  { region: "MIDDLE_EAST", city: "DXB" },
  { region: "TR", city: "ESB" },
];

/**
 * Lead-fee explainer.
 *
 * Partners distrust lead marketplaces because the price is usually opaque.
 * Showing the formula — and the ceiling — is cheaper than arguing about it
 * later.
 */
export function LeadPriceExplainer() {
  const { dict, t } = useI18n();
  const [destIndex, setDestIndex] = useState(0);
  const [volume, setVolume] = useState(38);
  const [daysOut, setDaysOut] = useState(45);
  const [fullService, setFullService] = useState(true);
  const [storage, setStorage] = useState(false);

  const dest = DESTINATIONS[destIndex];

  const lead = useMemo<Lead>(
    () => ({
      id: "fee_preview",
      createdAt: new Date(0).toISOString(),
      moveType: dest.region === "TR" ? "domestic" : "international",
      origin: { cityCode: "IST", access: "lift", easyParking: true },
      destination: { cityCode: dest.city, access: "lift", easyParking: true },
      moveDate: addDays(todayIso(), daysOut),
      flexibility: "plus_minus_3",
      propertySize: "two_bed",
      volumeM3: volume,
      serviceLevel: fullService ? "full_service" : "door_to_door",
      specialItems: {
        piano: false,
        vehicle: false,
        artwork: false,
        safe: false,
        gym: false,
        plants: false,
      },
      extras: {
        packing: fullService,
        unpacking: fullService,
        dismantling: true,
        storageWeeks: storage ? 4 : 0,
        insurance: true,
        customsClearance: dest.region !== "TR",
        cleaning: false,
      },
      contact: {
        fullName: "Preview Customer",
        email: "preview@example.com",
        phone: "+90 532 000 00 00",
        channel: "phone",
        locale: "en",
        emailVerified: true,
        phoneVerified: true,
      },
      consent: true,
    }),
    [dest, volume, daysOut, fullService, storage],
  );

  const fee = leadFeeUsd(lead);
  const quality = leadQualityScore(lead);
  const atCap = fee >= LEAD_FEE_CAP_USD;

  return (
    <div className="grid gap-8 rounded-3xl border bg-card p-6 sm:p-8 lg:grid-cols-[1fr_380px] lg:gap-12">
      <div>
        <div className="flex items-center gap-2.5">
          <Receipt className="size-4 text-brand" />
          <h3 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {dict.leadFee.eyebrow}
          </h3>
        </div>
        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          {t.fill(dict.leadFee.body, { cap: t.usd(LEAD_FEE_CAP_USD) })}
        </p>

        <div className="mt-7 space-y-6">
          <div>
            <p className="eyebrow">{dict.leadFee.destination}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {DESTINATIONS.map((option, i) => (
                <button
                  key={option.city}
                  type="button"
                  onClick={() => setDestIndex(i)}
                  aria-pressed={i === destIndex}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[12.5px] transition-colors",
                    i === destIndex
                      ? "border-brand bg-brand text-white"
                      : "bg-background hover:border-foreground/25",
                  )}
                >
                  {regionName(dict, option.region)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-[13.5px] font-medium">{dict.leadFee.volume}</span>
              <span className="text-[15px] font-medium tnum">{t.volume(volume)}</span>
            </div>
            <Slider
              className="mt-3"
              value={[volume]}
              min={6}
              max={120}
              step={1}
              onValueChange={([v]) => setVolume(v)}
              aria-label={dict.leadFee.volume}
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-[13.5px] font-medium">{dict.leadFee.daysOut}</span>
              <span className="text-[15px] font-medium tnum">
                {t.count(dict.units.days, daysOut)}
              </span>
            </div>
            <Slider
              className="mt-3"
              value={[daysOut]}
              min={5}
              max={200}
              step={1}
              onValueChange={([v]) => setDaysOut(v)}
              aria-label={dict.leadFee.daysOut}
            />
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <SwitchRow
              checked={fullService}
              onChange={setFullService}
              title={dict.leadFee.fullService}
              hint={dict.leadFee.fullServiceHint}
            />
            <SwitchRow
              checked={storage}
              onChange={setStorage}
              title={dict.leadFee.storage}
              hint={dict.leadFee.storageHint}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <div
          className={cn(
            "rounded-2xl border p-6",
            atCap ? "border-brand bg-brand-soft" : "border-brand bg-brand-soft dark:bg-accent/50",
          )}
        >
          <p className="eyebrow">{dict.leadFee.youPay}</p>
          <p className="mt-2 flex items-baseline gap-2">
            <span className="text-[52px] font-extrabold leading-none tracking-[-0.05em] tnum">
              {t.usd(fee)}
            </span>
            <span className="text-[12px] text-muted-foreground">{dict.leadFee.once}</span>
          </p>

          <div className="mt-5">
            <div className="relative h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-300",
                  atCap ? "bg-brand" : "bg-brand",
                )}
                style={{ width: `${(fee / LEAD_FEE_CAP_USD) * 100}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground tnum">
              <span>{t.fill(dict.leadFee.floor, { amount: t.usd(LEAD_FEE_FLOOR_USD) })}</span>
              <span>{t.fill(dict.leadFee.cap, { amount: t.usd(LEAD_FEE_CAP_USD) })}</span>
            </div>
          </div>

          {atCap && (
            <p className="mt-4 flex items-start gap-2 text-[12.5px] leading-relaxed text-muted-foreground">
              <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-foreground" />
              {t.fill(dict.leadFee.atCap, { cap: t.usd(LEAD_FEE_CAP_USD) })}
            </p>
          )}
        </div>

        <dl className="mt-6 space-y-3 border-t pt-6">
          <Row
            label={dict.leadFee.quality}
            value={t.fill(dict.leadFee.qualityValue, { score: t.number(quality) })}
          />
          <Row
            label={dict.leadFee.moveType}
            value={dict.enums.moveType[lead.moveType]}
          />
          <Row label={dict.leadFee.refundWindow} value={dict.leadFee.refundValue} />
          <Row
            label={dict.leadFee.costOnPro}
            value={t.fill(dict.leadFee.costOnProValue, { amount: t.usd(0) })}
            accent
          />
        </dl>

        <p className="mt-6 text-[12.5px] leading-relaxed text-muted-foreground">
          {t.fill(dict.leadFee.footnote, { pro: t.usd(PRO_MONTHLY_USD) })}
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-[13.5px] font-medium tnum",
          accent && "text-verify",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
