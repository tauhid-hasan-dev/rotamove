import { COUNTRY_BY_ISO, cityRegion, getCity } from "@/lib/geo";
import type { Lead } from "@/lib/types";
import type {
  AcquisitionChannel,
  AdminCompany,
  AdminDataset,
  AdminLead,
  Invoice,
  LeadStatus,
  TrafficDay,
} from "@/lib/admin/types";
import { CHANNELS } from "@/lib/admin/types";

/* ======================================================================== *
 *  Pure selectors over the prototype dataset.
 *
 *  Every figure the admin shows comes through here, computed from the same
 *  filtered slice — so a KPI, its chart and its table can never disagree.
 * ======================================================================== */

const DAY = 86_400_000;

/** Inclusive ISO day range, e.g. { start: "2026-09-28", end: "2026-10-27" }. */
export interface DayRange {
  start: string;
  end: string;
}

export function inRange(isoDate: string, range: DayRange): boolean {
  const day = isoDate.slice(0, 10);
  return day >= range.start && day <= range.end;
}

export function rangeDays(range: DayRange): number {
  return Math.round((Date.parse(range.end) - Date.parse(range.start)) / DAY) + 1;
}

/** The equally-long window immediately before `range`, for trend deltas. */
export function previousRange(range: DayRange): DayRange {
  const days = rangeDays(range);
  const start = Date.parse(`${range.start}T00:00:00Z`);
  return {
    start: new Date(start - days * DAY).toISOString().slice(0, 10),
    end: new Date(start - DAY).toISOString().slice(0, 10),
  };
}

/* ------------------------------------------------------------------ *
 * Time buckets
 * ------------------------------------------------------------------ */

export type Bucket = "day" | "week" | "month";

export function bucketFor(range: DayRange): Bucket {
  const days = rangeDays(range);
  if (days <= 31) return "day";
  if (days <= 182) return "week";
  return "month";
}

export interface SeriesPoint {
  /** Bucket key, sortable (yyyy-mm-dd of the bucket start). */
  key: string;
  /** Short display label. */
  label: string;
}

function bucketKey(isoDay: string, bucket: Bucket): string {
  if (bucket === "day") return isoDay;
  if (bucket === "month") return `${isoDay.slice(0, 7)}-01`;
  // ISO week: snap to Monday.
  const ms = Date.parse(`${isoDay}T00:00:00Z`);
  const weekday = (new Date(ms).getUTCDay() + 6) % 7;
  return new Date(ms - weekday * DAY).toISOString().slice(0, 10);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function bucketLabel(key: string, bucket: Bucket): string {
  const d = new Date(Date.parse(`${key}T00:00:00Z`));
  if (bucket === "month") return `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** All bucket keys spanning the range, so charts show zero days as zero. */
export function bucketKeys(range: DayRange, bucket: Bucket): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  let cursor = Date.parse(`${bucketKey(range.start, bucket)}T00:00:00Z`);
  const end = Date.parse(`${range.end}T00:00:00Z`);
  while (cursor <= end) {
    const key = new Date(cursor).toISOString().slice(0, 10);
    out.push({ key, label: bucketLabel(key, bucket) });
    if (bucket === "month") {
      const d = new Date(cursor);
      cursor = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
    } else {
      cursor += bucket === "week" ? 7 * DAY : DAY;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Leads
 * ------------------------------------------------------------------ */

export function leadsInRange(leads: AdminLead[], range: DayRange): AdminLead[] {
  return leads.filter((l) => inRange(l.lead.createdAt, range));
}

export function statusCounts(leads: AdminLead[]): Record<LeadStatus, number> {
  const out: Record<LeadStatus, number> = {
    new: 0, contacted: 0, qualified: 0, converted: 0, lost: 0,
  };
  for (const l of leads) out[l.status] += 1;
  return out;
}

export interface LeadTrendPoint extends SeriesPoint {
  leads: number;
  converted: number;
}

export function leadTrend(leads: AdminLead[], range: DayRange): LeadTrendPoint[] {
  const bucket = bucketFor(range);
  const points = new Map<string, LeadTrendPoint>(
    bucketKeys(range, bucket).map((p) => [p.key, { ...p, leads: 0, converted: 0 }]),
  );
  for (const l of leadsInRange(leads, range)) {
    const point = points.get(bucketKey(l.lead.createdAt.slice(0, 10), bucket));
    if (!point) continue;
    point.leads += 1;
    if (l.status === "converted") point.converted += 1;
  }
  return [...points.values()];
}

/** Groups of 2+ enquiries sharing a contact email — the duplicate review queue. */
export function duplicateGroups(leads: AdminLead[]): AdminLead[][] {
  const byEmail = new Map<string, AdminLead[]>();
  for (const l of leads) {
    const key = l.lead.contact.email.toLowerCase();
    const list = byEmail.get(key) ?? [];
    list.push(l);
    byEmail.set(key, list);
  }
  return [...byEmail.values()]
    .filter((group) => group.length > 1)
    .sort((a, b) => b.length - a.length);
}

/* ------------------------------------------------------------------ *
 * Revenue
 * ------------------------------------------------------------------ */

/** Cash actually collected in the range (payments net of refunds dated inside it). */
export function revenueInRange(data: Pick<AdminDataset, "payments" | "invoices">, range: DayRange): number {
  const paid = data.payments
    .filter((p) => inRange(p.at, range))
    .reduce((s, p) => s + p.amountUsd, 0);
  const refunded = data.invoices
    .filter((i) => i.refund && inRange(i.refund.at, range))
    .reduce((s, i) => s + (i.refund?.amountUsd ?? 0), 0);
  return Math.round((paid - refunded) * 100) / 100;
}

export interface RevenuePoint extends SeriesPoint {
  revenue: number;
  subscriptions: number;
  leadFees: number;
}

export function revenueTrend(data: Pick<AdminDataset, "payments" | "invoices">, range: DayRange): RevenuePoint[] {
  const bucket = bucketFor(range);
  const invoiceById = new Map(data.invoices.map((i) => [i.id, i]));
  const points = new Map<string, RevenuePoint>(
    bucketKeys(range, bucket).map((p) => [
      p.key,
      { ...p, revenue: 0, subscriptions: 0, leadFees: 0 },
    ]),
  );
  for (const payment of data.payments) {
    if (!inRange(payment.at, range)) continue;
    const point = points.get(bucketKey(payment.at.slice(0, 10), bucket));
    if (!point) continue;
    point.revenue += payment.amountUsd;
    const invoice = invoiceById.get(payment.invoiceId);
    if (invoice?.plan === "pro_unlimited") point.subscriptions += payment.amountUsd;
    else point.leadFees += payment.amountUsd;
  }
  for (const invoice of data.invoices) {
    if (!invoice.refund || !inRange(invoice.refund.at, range)) continue;
    const point = points.get(bucketKey(invoice.refund.at.slice(0, 10), bucket));
    if (point) point.revenue -= invoice.refund.amountUsd;
  }
  for (const point of points.values()) {
    point.revenue = Math.round(point.revenue * 100) / 100;
    point.subscriptions = Math.round(point.subscriptions * 100) / 100;
    point.leadFees = Math.round(point.leadFees * 100) / 100;
  }
  return [...points.values()];
}

/* ------------------------------------------------------------------ *
 * Dashboard KPIs
 * ------------------------------------------------------------------ */

export interface Kpis {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  conversionRate: number;
  activeCompanies: number;
  revenueUsd: number;
  outstandingUsd: number;
}

export function computeKpis(data: AdminDataset, range: DayRange): Kpis {
  const leads = leadsInRange(data.leads, range);
  const counts = statusCounts(leads);
  const outstanding = data.invoices
    .filter((i) => (i.status === "open" || i.status === "overdue") && inRange(i.issuedAt, { start: "0000-01-01", end: range.end }))
    .reduce((s, i) => s + i.totalUsd, 0);

  return {
    totalLeads: leads.length,
    newLeads: counts.new,
    qualifiedLeads: counts.qualified,
    convertedLeads: counts.converted,
    conversionRate: leads.length === 0 ? 0 : counts.converted / leads.length,
    activeCompanies: data.companies.filter((c) => c.status === "active").length,
    revenueUsd: revenueInRange(data, range),
    outstandingUsd: Math.round(outstanding * 100) / 100,
  };
}

/* ------------------------------------------------------------------ *
 * Companies
 * ------------------------------------------------------------------ */

export interface CompanyPerformance {
  company: AdminCompany;
  leadsReceived: number;
  delivered: number;
  bounced: number;
  feesUsd: number;
  lastAssignedAt?: string;
}

export function companyPerformance(
  data: Pick<AdminDataset, "leads" | "companies">,
  range: DayRange,
): CompanyPerformance[] {
  const rows = new Map<string, CompanyPerformance>(
    data.companies.map((c) => [
      c.mover.id,
      { company: c, leadsReceived: 0, delivered: 0, bounced: 0, feesUsd: 0 },
    ]),
  );
  for (const lead of data.leads) {
    for (const a of lead.assignments) {
      if (!inRange(a.assignedAt, range)) continue;
      const row = rows.get(a.companyId);
      if (!row) continue;
      row.leadsReceived += 1;
      if (a.delivery === "opened" || a.delivery === "sent") row.delivered += 1;
      if (a.delivery === "bounced") row.bounced += 1;
      row.feesUsd += a.feeUsd;
      if (!row.lastAssignedAt || a.assignedAt > row.lastAssignedAt) {
        row.lastAssignedAt = a.assignedAt;
      }
    }
  }
  for (const row of rows.values()) row.feesUsd = Math.round(row.feesUsd * 100) / 100;
  return [...rows.values()];
}

/**
 * Companies a lead can be offered to: active, covering both ends of the
 * route (or at least one end when nobody covers both) — the same shape the
 * matching engine applies on the public site.
 */
export function eligibleCompanies(lead: Lead, companies: AdminCompany[]): AdminCompany[] {
  const from = getCity(lead.origin.cityCode);
  const to = getCity(lead.destination.cityCode);
  if (!from || !to) return [];
  const fromRegion = cityRegion(from);
  const toRegion = cityRegion(to);

  const active = companies.filter((c) => c.status === "active");
  const both = active.filter(
    (c) => c.mover.regions.includes(fromRegion) && c.mover.regions.includes(toRegion),
  );
  if (both.length > 0) return both;
  return active.filter(
    (c) => c.mover.regions.includes(fromRegion) || c.mover.regions.includes(toRegion),
  );
}

/** Lead rows involving one company, newest first. */
export function leadsForCompany(leads: AdminLead[], companyId: string): AdminLead[] {
  return leads
    .filter((l) => l.assignments.some((a) => a.companyId === companyId))
    .sort((a, b) => b.lead.createdAt.localeCompare(a.lead.createdAt));
}

/* ------------------------------------------------------------------ *
 * Reports
 * ------------------------------------------------------------------ */

export interface ReportRow extends SeriesPoint {
  leads: number;
  assigned: number;
  converted: number;
  revenueUsd: number;
}

export function reportRows(data: AdminDataset, range: DayRange): ReportRow[] {
  const trend = leadTrend(data.leads, range);
  const revenue = revenueTrend(data, range);
  const revenueByKey = new Map(revenue.map((r) => [r.key, r.revenue]));
  const bucket = bucketFor(range);

  const assignedByKey = new Map<string, number>();
  for (const lead of leadsInRange(data.leads, range)) {
    if (lead.assignments.length === 0) continue;
    const key = bucketKey(lead.lead.createdAt.slice(0, 10), bucket);
    assignedByKey.set(key, (assignedByKey.get(key) ?? 0) + 1);
  }

  return trend.map((point) => ({
    key: point.key,
    label: point.label,
    leads: point.leads,
    assigned: assignedByKey.get(point.key) ?? 0,
    converted: point.converted,
    revenueUsd: revenueByKey.get(point.key) ?? 0,
  }));
}

export interface CompanyReportRow {
  company: AdminCompany;
  leadsReceived: number;
  leadFeesUsd: number;
  subscriptionUsd: number;
  totalUsd: number;
}

export function companyReport(data: AdminDataset, range: DayRange): CompanyReportRow[] {
  const performance = new Map(
    companyPerformance(data, range).map((p) => [p.company.mover.id, p]),
  );
  const invoiceById = new Map(data.invoices.map((i) => [i.id, i]));

  const rows = new Map<string, CompanyReportRow>();
  for (const company of data.companies) {
    const perf = performance.get(company.mover.id);
    rows.set(company.mover.id, {
      company,
      leadsReceived: perf?.leadsReceived ?? 0,
      leadFeesUsd: 0,
      subscriptionUsd: 0,
      totalUsd: 0,
    });
  }

  for (const payment of data.payments) {
    if (!inRange(payment.at, range)) continue;
    const row = rows.get(payment.companyId);
    const invoice = invoiceById.get(payment.invoiceId);
    if (!row || !invoice) continue;
    if (invoice.plan === "pro_unlimited") row.subscriptionUsd += payment.amountUsd;
    else row.leadFeesUsd += payment.amountUsd;
  }

  for (const row of rows.values()) {
    row.leadFeesUsd = Math.round(row.leadFeesUsd * 100) / 100;
    row.subscriptionUsd = Math.round(row.subscriptionUsd * 100) / 100;
    row.totalUsd = Math.round((row.leadFeesUsd + row.subscriptionUsd) * 100) / 100;
  }

  return [...rows.values()]
    .filter((r) => r.leadsReceived > 0 || r.totalUsd > 0)
    .sort((a, b) => b.totalUsd - a.totalUsd);
}

/* ------------------------------------------------------------------ *
 * Traffic analytics
 * ------------------------------------------------------------------ */

export function trafficInRange(traffic: TrafficDay[], range: DayRange): TrafficDay[] {
  return traffic.filter((t) => inRange(t.date, range));
}

export interface TrafficTotals {
  sessions: number;
  visitors: number;
  leads: number;
  conversionRate: number;
}

export function trafficTotals(traffic: TrafficDay[], range: DayRange): TrafficTotals {
  let sessions = 0;
  let visitors = 0;
  let leads = 0;
  for (const day of trafficInRange(traffic, range)) {
    for (const channel of CHANNELS) {
      sessions += day.channels[channel].sessions;
      visitors += day.channels[channel].visitors;
      leads += day.channels[channel].leads;
    }
  }
  return { sessions, visitors, leads, conversionRate: sessions === 0 ? 0 : leads / sessions };
}

export interface ChannelTotalsRow {
  channel: AcquisitionChannel;
  sessions: number;
  visitors: number;
  leads: number;
  conversionRate: number;
}

export function channelTotals(traffic: TrafficDay[], range: DayRange): ChannelTotalsRow[] {
  const rows = new Map<AcquisitionChannel, ChannelTotalsRow>(
    CHANNELS.map((c) => [c, { channel: c, sessions: 0, visitors: 0, leads: 0, conversionRate: 0 }]),
  );
  for (const day of trafficInRange(traffic, range)) {
    for (const channel of CHANNELS) {
      const row = rows.get(channel)!;
      row.sessions += day.channels[channel].sessions;
      row.visitors += day.channels[channel].visitors;
      row.leads += day.channels[channel].leads;
    }
  }
  for (const row of rows.values()) {
    row.conversionRate = row.sessions === 0 ? 0 : row.leads / row.sessions;
  }
  return [...rows.values()].sort((a, b) => b.sessions - a.sessions);
}

export interface SessionsPoint extends SeriesPoint {
  organic: number;
  paid_search: number;
  referral: number;
  direct: number;
  social: number;
}

export function sessionsTrend(traffic: TrafficDay[], range: DayRange): SessionsPoint[] {
  const bucket = bucketFor(range);
  const points = new Map<string, SessionsPoint>(
    bucketKeys(range, bucket).map((p) => [
      p.key,
      { ...p, organic: 0, paid_search: 0, referral: 0, direct: 0, social: 0 },
    ]),
  );
  for (const day of trafficInRange(traffic, range)) {
    const point = points.get(bucketKey(day.date, bucket));
    if (!point) continue;
    for (const channel of CHANNELS) point[channel] += day.channels[channel].sessions;
  }
  return [...points.values()];
}

export interface NamedStatsRow {
  id: string;
  label: string;
  sessions: number;
  leads: number;
  conversionRate: number;
}

function aggregateNamed(
  traffic: TrafficDay[],
  range: DayRange,
  select: (day: TrafficDay) => Record<string, { sessions: number; leads: number }>,
  labelFor: (id: string) => string,
): NamedStatsRow[] {
  const rows = new Map<string, NamedStatsRow>();
  for (const day of trafficInRange(traffic, range)) {
    for (const [id, stats] of Object.entries(select(day))) {
      const row = rows.get(id) ?? {
        id, label: labelFor(id), sessions: 0, leads: 0, conversionRate: 0,
      };
      row.sessions += stats.sessions;
      row.leads += stats.leads;
      rows.set(id, row);
    }
  }
  for (const row of rows.values()) {
    row.conversionRate = row.sessions === 0 ? 0 : row.leads / row.sessions;
  }
  return [...rows.values()].sort((a, b) => b.sessions - a.sessions);
}

export function landingPageRows(traffic: TrafficDay[], range: DayRange): NamedStatsRow[] {
  return aggregateNamed(traffic, range, (d) => d.pages, (id) => id);
}

export function countryRows(traffic: TrafficDay[], range: DayRange): NamedStatsRow[] {
  return aggregateNamed(
    traffic,
    range,
    (d) => d.countries,
    (iso) => COUNTRY_BY_ISO.get(iso)?.name ?? iso,
  );
}

export function campaignRows(
  data: Pick<AdminDataset, "traffic" | "campaigns">,
  range: DayRange,
): NamedStatsRow[] {
  const nameById = new Map(data.campaigns.map((c) => [c.id, c.name]));
  return aggregateNamed(
    data.traffic,
    range,
    (d) => d.campaigns,
    (id) => nameById.get(id) ?? id,
  );
}

/* ------------------------------------------------------------------ *
 * Billing
 * ------------------------------------------------------------------ */

export interface BillingTotals {
  collectedUsd: number;
  outstandingUsd: number;
  overdueUsd: number;
  refundedUsd: number;
  openCount: number;
  overdueCount: number;
}

export function billingTotals(data: AdminDataset, range: DayRange): BillingTotals {
  let outstanding = 0;
  let overdue = 0;
  let refunded = 0;
  let openCount = 0;
  let overdueCount = 0;
  for (const invoice of data.invoices) {
    if (invoice.status === "open") {
      outstanding += invoice.totalUsd;
      openCount += 1;
    } else if (invoice.status === "overdue") {
      outstanding += invoice.totalUsd;
      overdue += invoice.totalUsd;
      overdueCount += 1;
    }
    if (invoice.refund && inRange(invoice.refund.at, range)) {
      refunded += invoice.refund.amountUsd;
    }
  }
  return {
    collectedUsd: revenueInRange(data, range),
    outstandingUsd: Math.round(outstanding * 100) / 100,
    overdueUsd: Math.round(overdue * 100) / 100,
    refundedUsd: Math.round(refunded * 100) / 100,
    openCount,
    overdueCount,
  };
}

export function invoicesForCompany(invoices: Invoice[], companyId: string): Invoice[] {
  return invoices
    .filter((i) => i.companyId === companyId)
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

/* ------------------------------------------------------------------ *
 * Lead routes & service mix — the marketing-targeting selectors.
 * ------------------------------------------------------------------ */

export interface LeadRouteCount {
  fromCode: string;
  toCode: string;
  count: number;
}

/**
 * Top origin → destination city pairs by lead count.
 *
 * This is the "where is demand actually coming from" number: the corridors
 * worth pointing marketing spend at, straight from the enquiries.
 */
export function topLeadRoutes(leads: AdminLead[], limit = 6): LeadRouteCount[] {
  const counts = new Map<string, LeadRouteCount>();
  for (const { lead } of leads) {
    const key = `${lead.origin.cityCode}:${lead.destination.cityCode}`;
    const row = counts.get(key);
    if (row) row.count += 1;
    else {
      counts.set(key, {
        fromCode: lead.origin.cityCode,
        toCode: lead.destination.cityCode,
        count: 1,
      });
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

export interface ServiceMixSlice {
  service: Lead["serviceLevel"];
  count: number;
}

/** Lead counts per requested service level, zero-count services dropped. */
export function serviceMix(leads: AdminLead[]): ServiceMixSlice[] {
  const counts = new Map<Lead["serviceLevel"], number>();
  for (const { lead } of leads) {
    counts.set(lead.serviceLevel, (counts.get(lead.serviceLevel) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count);
}
