import type {
  CompanyStatus,
  DeliveryStatus,
  InvoiceStatus,
  LeadStatus,
  PaymentMethod,
} from "@/lib/admin/types";
import type { ApplicationStatus } from "@/lib/partner-application";
import type { DateFlexibility, PlanId, PropertySize, ServiceLevel } from "@/lib/types";

/* Display metadata for every admin enum: one label + one set of badge
   classes per state, built from the existing theme tokens only. */

export interface StatusMeta {
  label: string;
  /** Tailwind classes for the badge. */
  className: string;
  /** Dot colour for compact indicators. */
  dotClassName: string;
}

export const LEAD_STATUS_META: Record<LeadStatus, StatusMeta> = {
  new: {
    label: "New",
    className: "bg-brand/25 text-ink dark:bg-brand/15 dark:text-brand",
    dotClassName: "bg-brand-deep",
  },
  contacted: {
    label: "Contacted",
    className: "bg-secondary text-secondary-foreground",
    dotClassName: "bg-muted-foreground",
  },
  qualified: {
    label: "Qualified",
    className: "bg-lastcall text-lastcall-foreground",
    dotClassName: "bg-lastcall-accent",
  },
  converted: {
    label: "Converted",
    className: "bg-verify/12 text-verify dark:bg-verify/15",
    dotClassName: "bg-verify",
  },
  lost: {
    label: "Lost",
    className: "bg-muted text-muted-foreground",
    dotClassName: "bg-muted-foreground/60",
  },
};

export const COMPANY_STATUS_META: Record<CompanyStatus, StatusMeta> = {
  active: {
    label: "Active",
    className: "bg-verify/12 text-verify dark:bg-verify/15",
    dotClassName: "bg-verify",
  },
  pending: {
    label: "Pending review",
    className: "bg-lastcall text-lastcall-foreground",
    dotClassName: "bg-lastcall-accent",
  },
  suspended: {
    label: "Suspended",
    className: "bg-destructive/10 text-destructive dark:bg-destructive/20",
    dotClassName: "bg-destructive",
  },
  deactivated: {
    label: "Deactivated",
    className: "bg-muted text-muted-foreground",
    dotClassName: "bg-muted-foreground/60",
  },
};

/**
 * Vetting states for a partner application.
 *
 * `awaiting_documents` takes the same amber as a pending company rather than
 * a warning colour: nothing is wrong, the reviewer is simply waiting on
 * somebody. Declined takes the destructive red because it is terminal.
 */
export const APPLICATION_STATUS_META: Record<ApplicationStatus, StatusMeta> = {
  pending: {
    label: "Awaiting review",
    className: "bg-brand/25 text-ink dark:bg-brand/15 dark:text-brand",
    dotClassName: "bg-brand-deep",
  },
  awaiting_documents: {
    label: "Awaiting documents",
    className: "bg-lastcall text-lastcall-foreground",
    dotClassName: "bg-lastcall-accent",
  },
  approved: {
    label: "Approved",
    className: "bg-verify/12 text-verify dark:bg-verify/15",
    dotClassName: "bg-verify",
  },
  declined: {
    label: "Declined",
    className: "bg-destructive/10 text-destructive dark:bg-destructive/20",
    dotClassName: "bg-destructive",
  },
};

export const INVOICE_STATUS_META: Record<InvoiceStatus, StatusMeta> = {
  paid: {
    label: "Paid",
    className: "bg-verify/12 text-verify dark:bg-verify/15",
    dotClassName: "bg-verify",
  },
  open: {
    label: "Open",
    className: "bg-secondary text-secondary-foreground",
    dotClassName: "bg-muted-foreground",
  },
  overdue: {
    label: "Overdue",
    className: "bg-destructive/10 text-destructive dark:bg-destructive/20",
    dotClassName: "bg-destructive",
  },
  refunded: {
    label: "Refunded",
    className: "bg-lastcall text-lastcall-foreground",
    dotClassName: "bg-lastcall-accent",
  },
};

export const DELIVERY_META: Record<DeliveryStatus, StatusMeta> = {
  pending: {
    label: "Pending",
    className: "bg-secondary text-secondary-foreground",
    dotClassName: "bg-muted-foreground",
  },
  sent: {
    label: "Sent",
    className: "bg-brand/25 text-ink dark:bg-brand/15 dark:text-brand",
    dotClassName: "bg-brand-deep",
  },
  opened: {
    label: "Opened",
    className: "bg-verify/12 text-verify dark:bg-verify/15",
    dotClassName: "bg-verify",
  },
  bounced: {
    label: "Bounced",
    className: "bg-destructive/10 text-destructive dark:bg-destructive/20",
    dotClassName: "bg-destructive",
  },
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  card: "Card",
  bank_transfer: "Bank transfer",
  credit_balance: "Credit balance",
};

export const SERVICE_LEVEL_LABELS: Record<ServiceLevel, string> = {
  full_service: "Full service",
  door_to_door: "Door to door",
  transport_only: "Transport only",
};

export const PROPERTY_SIZE_LABELS: Record<PropertySize, string> = {
  few_items: "A few items",
  studio: "Studio",
  one_bed: "1-bed flat",
  two_bed: "2-bed flat",
  three_bed: "3-bed home",
  four_bed: "4-bed home",
  villa: "Villa",
  office: "Office",
  project: "Project cargo",
};

export const FLEXIBILITY_LABELS: Record<DateFlexibility, string> = {
  exact: "Exact date",
  plus_minus_3: "± 3 days",
  within_2_weeks: "Within 2 weeks",
  flexible: "Flexible",
};

export const PLAN_LABELS: Record<PlanId, string> = {
  pro_unlimited: "Pro Unlimited",
  pay_per_lead: "Pay per lead",
  pay_per_seen: "Pay per seen",
};
