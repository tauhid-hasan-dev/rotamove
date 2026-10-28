"use client";

import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import { nanoid } from "nanoid";
import { generateAdminDataset } from "@/lib/admin/seed";
import type {
  AdminDataset,
  CompanyStatus,
  DeliveryStatus,
  LeadStatus,
  PaymentMethod,
  PermissionKey,
  PlatformSettings,
  RoleDef,
} from "@/lib/admin/types";
import { ADMIN_ROLE_ID, PERMISSION_KEYS } from "@/lib/admin/types";

/* ======================================================================== *
 *  Session store for the admin prototype.
 *
 *  The seeded dataset is the initial state; every admin action mutates it
 *  through this reducer and lands in the audit log, so the UI behaves like
 *  the real thing for the length of the session. Nothing persists — this is
 *  the layer a NestJS API replaces, action-for-endpoint.
 * ======================================================================== */

const ACTOR = "Demo Admin";

export type AdminAction =
  | { type: "lead/status"; id: string; status: LeadStatus }
  | { type: "lead/assign"; id: string; companyIds: string[] }
  | { type: "lead/delivery"; id: string; companyId: string; delivery: DeliveryStatus }
  | { type: "lead/duplicate"; id: string; duplicateOf: string | undefined }
  | {
      type: "company/update";
      id: string;
      patch: Partial<{ contactName: string; contactEmail: string; contactPhone: string; notes: string }>;
    }
  | { type: "company/status"; id: string; status: CompanyStatus; reason?: string }
  | { type: "invoice/pay"; id: string; method: PaymentMethod }
  | { type: "invoice/refund"; id: string; reason: string }
  | { type: "credit/add"; companyId: string; amountUsd: number; reason: string }
  | { type: "settings/update"; patch: Partial<PlatformSettings> }
  | { type: "roles/toggle"; roleId: string; permission: PermissionKey }
  | { type: "roles/create"; name: string; permissions?: PermissionKey[] }
  | { type: "roles/rename"; roleId: string; name: string }
  | { type: "roles/delete"; roleId: string }
  | { type: "team/role"; memberId: string; roleId: string }
  | { type: "team/create"; name: string; email: string; roleId: string }
  | { type: "team/update"; memberId: string; patch: { name?: string; email?: string } }
  | { type: "team/remove"; memberId: string };

function withAudit(
  state: AdminDataset,
  entry: { action: string; entity: string; entityId?: string; detail: string },
): AdminDataset {
  return {
    ...state,
    audit: [
      {
        id: `au_live_${nanoid(8)}`,
        at: new Date().toISOString(),
        actor: ACTOR,
        ...entry,
      },
      ...state.audit,
    ],
  };
}

function reducer(state: AdminDataset, action: AdminAction): AdminDataset {
  switch (action.type) {
    case "lead/status": {
      const next = {
        ...state,
        leads: state.leads.map((l) =>
          l.lead.id === action.id
            ? {
                ...l,
                status: action.status,
                statusHistory: [
                  ...l.statusHistory,
                  { status: action.status, at: new Date().toISOString(), by: ACTOR },
                ],
              }
            : l,
        ),
      };
      const lead = state.leads.find((l) => l.lead.id === action.id);
      return withAudit(next, {
        action: `lead.${action.status}`,
        entity: "lead",
        entityId: action.id,
        detail: `${lead?.lead.contact.fullName ?? action.id} marked ${action.status}`,
      });
    }

    case "lead/assign": {
      const now = new Date().toISOString();
      const companiesById = new Map(state.companies.map((c) => [c.mover.id, c]));
      const next = {
        ...state,
        leads: state.leads.map((l) => {
          if (l.lead.id !== action.id) return l;
          const existing = new Set(l.assignments.map((a) => a.companyId));
          const added = action.companyIds
            .filter((id) => !existing.has(id))
            .map((companyId) => ({
              companyId,
              assignedAt: now,
              feeUsd:
                companiesById.get(companyId)?.mover.plan === "pay_per_lead" ? l.feeUsd : 0,
              delivery: "sent" as DeliveryStatus,
            }));
          return { ...l, assignments: [...l.assignments, ...added] };
        }),
      };
      return withAudit(next, {
        action: "lead.assigned",
        entity: "lead",
        entityId: action.id,
        detail: `Assigned to ${action.companyIds.length} ${action.companyIds.length === 1 ? "company" : "companies"}`,
      });
    }

    case "lead/delivery": {
      const next = {
        ...state,
        leads: state.leads.map((l) =>
          l.lead.id === action.id
            ? {
                ...l,
                assignments: l.assignments.map((a) =>
                  a.companyId === action.companyId ? { ...a, delivery: action.delivery } : a,
                ),
              }
            : l,
        ),
      };
      return withAudit(next, {
        action: "lead.delivery",
        entity: "lead",
        entityId: action.id,
        detail: `Delivery to ${action.companyId} marked ${action.delivery}`,
      });
    }

    case "lead/duplicate": {
      const next = {
        ...state,
        leads: state.leads.map((l) =>
          l.lead.id === action.id ? { ...l, duplicateOf: action.duplicateOf } : l,
        ),
      };
      return withAudit(next, {
        action: action.duplicateOf ? "lead.marked_duplicate" : "lead.cleared_duplicate",
        entity: "lead",
        entityId: action.id,
        detail: action.duplicateOf
          ? `Marked as duplicate of ${action.duplicateOf}`
          : "Duplicate flag cleared",
      });
    }

    case "company/update": {
      const next = {
        ...state,
        companies: state.companies.map((c) =>
          c.mover.id === action.id ? { ...c, ...action.patch } : c,
        ),
      };
      const company = state.companies.find((c) => c.mover.id === action.id);
      return withAudit(next, {
        action: "company.updated",
        entity: "company",
        entityId: action.id,
        detail: `${company?.mover.name ?? action.id} profile updated`,
      });
    }

    case "company/status": {
      const next = {
        ...state,
        companies: state.companies.map((c) =>
          c.mover.id === action.id
            ? { ...c, status: action.status, notes: action.reason ?? c.notes }
            : c,
        ),
      };
      const company = state.companies.find((c) => c.mover.id === action.id);
      return withAudit(next, {
        action: `company.${action.status}`,
        entity: "company",
        entityId: action.id,
        detail: `${company?.mover.name ?? action.id} set to ${action.status}${action.reason ? `: ${action.reason}` : ""}`,
      });
    }

    case "invoice/pay": {
      const invoice = state.invoices.find((i) => i.id === action.id);
      if (!invoice || invoice.status === "paid" || invoice.status === "refunded") return state;
      const now = new Date().toISOString();

      let companies = state.companies;
      let credits = state.credits;
      if (action.method === "credit_balance") {
        companies = state.companies.map((c) =>
          c.mover.id === invoice.companyId
            ? {
                ...c,
                creditBalanceUsd:
                  Math.round(Math.max(0, c.creditBalanceUsd - invoice.totalUsd) * 100) / 100,
              }
            : c,
        );
        credits = [
          {
            id: `cr_live_${nanoid(6)}`,
            companyId: invoice.companyId,
            at: now,
            deltaUsd: -invoice.totalUsd,
            reason: `Applied to ${invoice.number}`,
            by: ACTOR,
          },
          ...state.credits,
        ];
      }

      const next: AdminDataset = {
        ...state,
        companies,
        credits,
        invoices: state.invoices.map((i) =>
          i.id === action.id ? { ...i, status: "paid" as const, paidAt: now } : i,
        ),
        payments: [
          ...state.payments,
          {
            id: `pay_live_${nanoid(6)}`,
            invoiceId: invoice.id,
            companyId: invoice.companyId,
            at: now,
            amountUsd: invoice.totalUsd,
            method: action.method,
          },
        ],
      };
      return withAudit(next, {
        action: "invoice.paid",
        entity: "invoice",
        entityId: invoice.id,
        detail: `${invoice.number} recorded as paid (${action.method.replace("_", " ")})`,
      });
    }

    case "invoice/refund": {
      const invoice = state.invoices.find((i) => i.id === action.id);
      if (!invoice || invoice.status !== "paid") return state;
      const now = new Date().toISOString();
      const next: AdminDataset = {
        ...state,
        invoices: state.invoices.map((i) =>
          i.id === action.id
            ? {
                ...i,
                status: "refunded" as const,
                refund: { amountUsd: i.totalUsd, at: now, reason: action.reason, by: ACTOR },
              }
            : i,
        ),
      };
      return withAudit(next, {
        action: "invoice.refunded",
        entity: "invoice",
        entityId: invoice.id,
        detail: `${invoice.number} refunded: ${action.reason}`,
      });
    }

    case "credit/add": {
      const now = new Date().toISOString();
      const next: AdminDataset = {
        ...state,
        companies: state.companies.map((c) =>
          c.mover.id === action.companyId
            ? {
                ...c,
                creditBalanceUsd:
                  Math.round((c.creditBalanceUsd + action.amountUsd) * 100) / 100,
              }
            : c,
        ),
        credits: [
          {
            id: `cr_live_${nanoid(6)}`,
            companyId: action.companyId,
            at: now,
            deltaUsd: action.amountUsd,
            reason: action.reason,
            by: ACTOR,
          },
          ...state.credits,
        ],
      };
      const company = state.companies.find((c) => c.mover.id === action.companyId);
      return withAudit(next, {
        action: "credit.granted",
        entity: "company",
        entityId: action.companyId,
        detail: `$${action.amountUsd} credit for ${company?.mover.name ?? action.companyId}: ${action.reason}`,
      });
    }

    case "settings/update": {
      const next = { ...state, settings: { ...state.settings, ...action.patch } };
      const keys = Object.keys(action.patch).join(", ");
      return withAudit(next, {
        action: "settings.updated",
        entity: "settings",
        detail: `Changed ${keys}`,
      });
    }

    case "roles/toggle": {
      const role = state.roles.find((r) => r.id === action.roleId);
      // The Admin role is the floor of the permission system: if it could be
      // edited, the console could be locked out of itself.
      if (!role || role.locked) return state;
      const granted = !role.permissions[action.permission];
      const next: AdminDataset = {
        ...state,
        roles: state.roles.map((r) =>
          r.id === action.roleId
            ? { ...r, permissions: { ...r.permissions, [action.permission]: granted } }
            : r,
        ),
      };
      return withAudit(next, {
        action: "roles.updated",
        entity: "settings",
        entityId: action.roleId,
        detail: `${role.name}: ${action.permission} ${granted ? "granted" : "revoked"}`,
      });
    }

    case "roles/create": {
      const name = action.name.trim();
      if (!name) return state;
      const permissions = {} as Record<PermissionKey, boolean>;
      for (const key of PERMISSION_KEYS) {
        permissions[key] = action.permissions?.includes(key) ?? false;
      }
      const role: RoleDef = { id: `role_${nanoid(8)}`, name, locked: false, permissions };
      return withAudit(
        { ...state, roles: [...state.roles, role] },
        {
          action: "roles.created",
          entity: "settings",
          entityId: role.id,
          detail: `Role ${name} created`,
        },
      );
    }

    case "roles/rename": {
      const role = state.roles.find((r) => r.id === action.roleId);
      const name = action.name.trim();
      if (!role || role.locked || !name) return state;
      return withAudit(
        {
          ...state,
          roles: state.roles.map((r) => (r.id === action.roleId ? { ...r, name } : r)),
        },
        {
          action: "roles.renamed",
          entity: "settings",
          entityId: action.roleId,
          detail: `Role ${role.name} renamed to ${name}`,
        },
      );
    }

    case "roles/delete": {
      const role = state.roles.find((r) => r.id === action.roleId);
      if (!role || role.locked) return state;
      // Anyone holding the deleted role falls back to Admin rather than to a
      // dangling id — an account with no resolvable role has no permissions
      // at all, which is a worse failure than one with too many.
      return withAudit(
        {
          ...state,
          roles: state.roles.filter((r) => r.id !== action.roleId),
          team: state.team.map((m) =>
            m.roleId === action.roleId ? { ...m, roleId: ADMIN_ROLE_ID } : m,
          ),
        },
        {
          action: "roles.deleted",
          entity: "settings",
          entityId: action.roleId,
          detail: `Role ${role.name} deleted`,
        },
      );
    }

    case "team/role": {
      const member = state.team.find((m) => m.id === action.memberId);
      if (!member || member.locked) return state;
      const role = state.roles.find((r) => r.id === action.roleId);
      if (!role) return state;
      return withAudit(
        {
          ...state,
          team: state.team.map((m) =>
            m.id === action.memberId ? { ...m, roleId: action.roleId } : m,
          ),
        },
        {
          action: "team.role_changed",
          entity: "team",
          entityId: action.memberId,
          detail: `${member.name} is now ${role.name}`,
        },
      );
    }

    case "team/create": {
      const name = action.name.trim();
      const email = action.email.trim().toLowerCase();
      if (!name || !email) return state;
      const now = new Date().toISOString();
      const member = {
        id: `tm_${nanoid(8)}`,
        name,
        email,
        roleId: action.roleId,
        invitedAt: now.slice(0, 10),
        lastActiveAt: now,
      };
      const role = state.roles.find((r) => r.id === action.roleId);
      return withAudit(
        { ...state, team: [...state.team, member] },
        {
          action: "team.created",
          entity: "team",
          entityId: member.id,
          detail: `${name} invited as ${role?.name ?? action.roleId}`,
        },
      );
    }

    case "team/update": {
      const member = state.team.find((m) => m.id === action.memberId);
      if (!member) return state;
      const patch = {
        ...(action.patch.name?.trim() ? { name: action.patch.name.trim() } : {}),
        ...(action.patch.email?.trim() ? { email: action.patch.email.trim().toLowerCase() } : {}),
      };
      return withAudit(
        {
          ...state,
          team: state.team.map((m) => (m.id === action.memberId ? { ...m, ...patch } : m)),
        },
        {
          action: "team.updated",
          entity: "team",
          entityId: action.memberId,
          detail: `${member.name} profile updated`,
        },
      );
    }

    case "team/remove": {
      const member = state.team.find((m) => m.id === action.memberId);
      if (!member || member.locked) return state;
      return withAudit(
        { ...state, team: state.team.filter((m) => m.id !== action.memberId) },
        {
          action: "team.removed",
          entity: "team",
          entityId: action.memberId,
          detail: `${member.name} removed from the console`,
        },
      );
    }
  }
}

const StateContext = createContext<AdminDataset | null>(null);
const DispatchContext = createContext<React.Dispatch<AdminAction> | null>(null);

export function AdminStoreProvider({
  anchorDate,
  children,
}: {
  /** "yyyy-mm-dd" of today, supplied by the server so SSR and client agree. */
  anchorDate: string;
  children: ReactNode;
}) {
  // Deterministic for the anchor date: the server and the client generate the
  // identical dataset, so nothing needs serialising and nothing drifts.
  const initial = useMemo(() => generateAdminDataset(anchorDate), [anchorDate]);
  const [state, dispatch] = useReducer(reducer, initial);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export function useAdminData(): AdminDataset {
  const state = useContext(StateContext);
  if (!state) throw new Error("useAdminData must be used inside AdminStoreProvider");
  return state;
}

export function useAdminDispatch(): React.Dispatch<AdminAction> {
  const dispatch = useContext(DispatchContext);
  if (!dispatch) throw new Error("useAdminDispatch must be used inside AdminStoreProvider");
  return dispatch;
}
