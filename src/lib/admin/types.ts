import type { Lead, Mover, PlanId } from "@/lib/types";

/* ======================================================================== *
 *  Admin domain model — DEMO DATA ONLY.
 *
 *  Everything in `src/lib/admin` is a deterministic, seeded prototype
 *  dataset layered on top of the real domain types (`Lead`, `Mover`). None
 *  of it talks to a backend: the shapes are what a NestJS + PostgreSQL
 *  service would serve, so swapping the seed for fetch calls later changes
 *  the provider, not the pages.
 * ======================================================================== */

/* ------------------------------------------------------------------ *
 * Leads
 * ------------------------------------------------------------------ */

export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";

export const LEAD_STATUSES: readonly LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
];

/** What happened to the lead after it was sold to a company. */
export type DeliveryStatus = "pending" | "sent" | "opened" | "bounced";

export interface LeadAssignment {
  companyId: string;
  assignedAt: string;
  /** What Rotamove charged for this unlock. 0 for Pro Unlimited partners. */
  feeUsd: number;
  delivery: DeliveryStatus;
}

export type AcquisitionChannel =
  | "organic"
  | "paid_search"
  | "referral"
  | "direct"
  | "social";

export const CHANNELS: readonly AcquisitionChannel[] = [
  "organic",
  "paid_search",
  "referral",
  "direct",
  "social",
];

export const CHANNEL_LABELS: Record<AcquisitionChannel, string> = {
  organic: "Organic search",
  paid_search: "Paid search",
  referral: "Referral",
  direct: "Direct",
  social: "Social",
};

export interface LeadSource {
  channel: AcquisitionChannel;
  /** Only paid_search / social carry a campaign. */
  campaignId?: string;
  landingPage: string;
  /** ISO country of the visitor, taken from the origin city. */
  country: string;
}

export interface StatusEvent {
  status: LeadStatus;
  at: string;
  by: string;
}

export interface AdminLead {
  /** The real domain object, unchanged. */
  lead: Lead;
  status: LeadStatus;
  source: LeadSource;
  qualityScore: number;
  feeUsd: number;
  assignments: LeadAssignment[];
  /** Set when this enquiry repeats an earlier one (same contact, same route). */
  duplicateOf?: string;
  statusHistory: StatusEvent[];
}

/* ------------------------------------------------------------------ *
 * Companies
 * ------------------------------------------------------------------ */

export type CompanyStatus = "active" | "pending" | "suspended" | "deactivated";

export const COMPANY_STATUSES: readonly CompanyStatus[] = [
  "active",
  "pending",
  "suspended",
  "deactivated",
];

export interface AdminCompany {
  /** The real partner record, unchanged. */
  mover: Mover;
  status: CompanyStatus;
  joinedAt: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  /** Prepaid lead credit, USD. Spent before the card is charged. */
  creditBalanceUsd: number;
  notes?: string;
}

/* ------------------------------------------------------------------ *
 * Billing
 * ------------------------------------------------------------------ */

export type InvoiceStatus = "paid" | "open" | "overdue" | "refunded";

export const INVOICE_STATUSES: readonly InvoiceStatus[] = [
  "paid",
  "open",
  "overdue",
  "refunded",
];

export interface InvoiceLine {
  id: string;
  description: string;
  kind: "subscription" | "lead_fee" | "credit";
  quantity: number;
  amountUsd: number;
}

export interface InvoiceRefund {
  amountUsd: number;
  at: string;
  reason: string;
  by: string;
}

export interface Invoice {
  id: string;
  /** Human number, e.g. RM-2026-0141. */
  number: string;
  companyId: string;
  plan: PlanId;
  periodStart: string;
  periodEnd: string;
  issuedAt: string;
  dueAt: string;
  status: InvoiceStatus;
  lines: InvoiceLine[];
  totalUsd: number;
  paidAt?: string;
  refund?: InvoiceRefund;
}

export type PaymentMethod = "card" | "bank_transfer" | "credit_balance";

export interface Payment {
  id: string;
  invoiceId: string;
  companyId: string;
  at: string;
  amountUsd: number;
  method: PaymentMethod;
}

export interface CreditEntry {
  id: string;
  companyId: string;
  at: string;
  /** Positive = granted, negative = spent on an invoice. */
  deltaUsd: number;
  reason: string;
  by: string;
  /**
   * What the grant said before an operator corrected it. Set only on
   * amended entries, so the ledger can show the figure it stands at today
   * while still admitting it was not the figure first written down.
   */
  correctedFrom?: number;
}

/* ------------------------------------------------------------------ *
 * Traffic analytics
 * ------------------------------------------------------------------ */

export interface ChannelDayStats {
  sessions: number;
  visitors: number;
  /** Leads created that day attributed to the channel — ties analytics to the lead table. */
  leads: number;
}

export interface TrafficDay {
  /** yyyy-mm-dd */
  date: string;
  channels: Record<AcquisitionChannel, ChannelDayStats>;
  /** landing page path → stats */
  pages: Record<string, { sessions: number; leads: number }>;
  /** ISO country → stats */
  countries: Record<string, { sessions: number; leads: number }>;
  /** campaign id → stats */
  campaigns: Record<string, { sessions: number; leads: number }>;
}

export interface Campaign {
  id: string;
  name: string;
  channel: AcquisitionChannel;
  startedAt: string;
}

/* ------------------------------------------------------------------ *
 * Admin settings, team, audit
 * ------------------------------------------------------------------ */

/**
 * A console role.
 *
 * Roles are operator data, not a fixed union: the admin creates them, names
 * them and grants permissions role by role. Only the Admin role is locked —
 * full access, not editable, not deletable — so the console can never be
 * configured into a state where nobody can manage it.
 */
export interface RoleDef {
  id: string;
  /** What the admin typed (or our seeded defaults). Never translated. */
  name: string;
  /** True only for the Admin role. */
  locked: boolean;
  permissions: Record<PermissionKey, boolean>;
}

export const ADMIN_ROLE_ID = "admin";

export type PermissionKey =
  | "leads.view"
  | "leads.manage"
  | "companies.view"
  | "companies.manage"
  | "billing.view"
  | "billing.manage"
  | "reports.view"
  | "analytics.view"
  | "settings.manage";

export const PERMISSION_KEYS: readonly PermissionKey[] = [
  "leads.view",
  "leads.manage",
  "companies.view",
  "companies.manage",
  "billing.view",
  "billing.manage",
  "reports.view",
  "analytics.view",
  "settings.manage",
];

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  "leads.view": "View leads",
  "leads.manage": "Manage leads",
  "companies.view": "View companies",
  "companies.manage": "Manage companies",
  "billing.view": "View billing",
  "billing.manage": "Manage billing",
  "reports.view": "View reports",
  "analytics.view": "View analytics",
  "settings.manage": "Manage settings",
};

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  roleId: string;
  lastActiveAt: string;
  invitedAt: string;
  /** The founding admin account — cannot be removed or demoted. */
  locked?: boolean;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  /** "lead" | "company" | "invoice" | "settings" | "team" — free-form for display. */
  entity: string;
  entityId?: string;
  detail: string;
}

export interface PlatformSettings {
  leadFeeFloorUsd: number;
  leadFeeCapUsd: number;
  proMonthlyUsd: number;
  /** Default number of companies a lead is offered to. */
  defaultMatchCount: number;
  /** Two enquiries from the same contact within this window count as one. */
  duplicateWindowDays: number;
  autoAssignLeads: boolean;
  notifyNewLead: boolean;
  notifyOverdueInvoice: boolean;
  requireTwoFactor: boolean;
}

/* ------------------------------------------------------------------ *
 * The whole prototype dataset
 * ------------------------------------------------------------------ */

export interface AdminDataset {
  /** Midnight (local) of "today" — every relative date hangs off this. */
  anchorMs: number;
  leads: AdminLead[];
  companies: AdminCompany[];
  invoices: Invoice[];
  payments: Payment[];
  credits: CreditEntry[];
  traffic: TrafficDay[];
  campaigns: Campaign[];
  team: TeamMember[];
  roles: RoleDef[];
  audit: AuditEntry[];
  settings: PlatformSettings;
}
