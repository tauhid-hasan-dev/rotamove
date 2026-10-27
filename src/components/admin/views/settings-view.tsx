"use client";

import { useMemo, useState } from "react";
import { Lock, Search } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageHeader } from "@/components/admin/bits";
import { PaginationBar, usePagination } from "@/components/admin/table-bits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateShort } from "@/lib/format";
import { useAdminData, useAdminDispatch } from "@/lib/admin/store";
import {
  ADMIN_ROLES,
  PERMISSION_KEYS,
  PERMISSION_LABELS,
  ROLE_LABELS,
  type AdminRole,
  type PlatformSettings,
} from "@/lib/admin/types";

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return `${formatDateShort(iso)}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function SettingsView({ initialTab }: { initialTab?: string }) {
  const data = useAdminData();
  const dispatch = useAdminDispatch();

  const [tab, setTab] = useState(
    initialTab === "audit" || initialTab === "platform" ? initialTab : "team",
  );

  /* ---- audit log state ---- */
  const [auditQuery, setAuditQuery] = useState("");
  const [auditEntity, setAuditEntity] = useState("all");

  const entities = useMemo(
    () => [...new Set(data.audit.map((e) => e.entity))].sort(),
    [data.audit],
  );

  const auditRows = useMemo(() => {
    const q = auditQuery.trim().toLowerCase();
    return data.audit.filter((entry) => {
      if (auditEntity !== "all" && entry.entity !== auditEntity) return false;
      if (!q) return true;
      return (
        entry.detail.toLowerCase().includes(q) ||
        entry.action.toLowerCase().includes(q) ||
        entry.actor.toLowerCase().includes(q) ||
        (entry.entityId?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [data.audit, auditQuery, auditEntity]);

  const auditPagination = usePagination(auditRows, 15);

  /* ---- platform settings draft ---- */
  const [draft, setDraft] = useState<PlatformSettings>(data.settings);
  const dirty = JSON.stringify(draft) !== JSON.stringify(data.settings);

  const saveSettings = () => {
    dispatch({ type: "settings/update", patch: draft });
    toast.success("Platform settings saved");
  };

  const num = (value: string, fallback: number) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  return (
    <div className="animate-rise">
      <PageHeader
        title="Settings"
        description="Team access, the audit trail, and platform-wide configuration."
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="team">Team &amp; roles</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
          <TabsTrigger value="platform">Platform</TabsTrigger>
        </TabsList>

        {/* ---------------- Team & roles ---------------- */}
        <TabsContent value="team" className="space-y-4">
          <Card className="gap-0 overflow-hidden py-0 shadow-soft">
            <CardHeader className="pt-6 pb-4">
              <CardTitle>Team members</CardTitle>
              <CardDescription>Who can sign in to this console.</CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Invited</TableHead>
                    <TableHead>Last active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.team.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <span className="flex items-center gap-3">
                          <span
                            aria-hidden
                            className="flex size-8 items-center justify-center rounded-full bg-brand/25 text-xs font-semibold text-ink dark:bg-brand/15 dark:text-brand"
                          >
                            {member.name
                              .split(" ")
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join("")}
                          </span>
                          <span>
                            <span className="block text-[13.5px] font-medium">{member.name}</span>
                            <span className="block text-xs text-muted-foreground">
                              {member.email}
                            </span>
                          </span>
                        </span>
                      </TableCell>
                      <TableCell>
                        {member.role === "owner" ? (
                          <Badge variant="secondary" className="gap-1">
                            <Lock aria-hidden />
                            Owner
                          </Badge>
                        ) : (
                          <Select
                            value={member.role}
                            onValueChange={(role) => {
                              dispatch({
                                type: "team/role",
                                memberId: member.id,
                                role: role as AdminRole,
                              });
                              toast.success(`${member.name} is now ${ROLE_LABELS[role as AdminRole]}`);
                            }}
                          >
                            <SelectTrigger size="sm" className="w-36" aria-label={`Role for ${member.name}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ADMIN_ROLES.filter((r) => r !== "owner").map((role) => (
                                <SelectItem key={role} value={role}>
                                  {ROLE_LABELS[role]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell className="tnum whitespace-nowrap text-[13px] text-muted-foreground">
                        {member.invitedAt}
                      </TableCell>
                      <TableCell className="tnum whitespace-nowrap text-[13px] text-muted-foreground">
                        {formatDateShort(member.lastActiveAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card className="gap-0 overflow-hidden py-0 shadow-soft">
            <CardHeader className="pt-6 pb-4">
              <CardTitle>Role permissions</CardTitle>
              <CardDescription>
                What each role can see and do. The owner role is fixed; every change lands in the
                audit log.
              </CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-44">Permission</TableHead>
                    {ADMIN_ROLES.map((role) => (
                      <TableHead key={role} className="text-center">
                        {ROLE_LABELS[role]}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PERMISSION_KEYS.map((permission) => (
                    <TableRow key={permission}>
                      <TableCell className="text-[13px] font-medium">
                        {PERMISSION_LABELS[permission]}
                        <span className="block text-[10.5px] text-muted-foreground">
                          {permission}
                        </span>
                      </TableCell>
                      {ADMIN_ROLES.map((role) => (
                        <TableCell key={role} className="text-center">
                          <Checkbox
                            checked={data.roles[role][permission]}
                            disabled={role === "owner"}
                            aria-label={`${ROLE_LABELS[role]}: ${PERMISSION_LABELS[permission]}`}
                            onCheckedChange={() => {
                              dispatch({ type: "roles/toggle", role, permission });
                            }}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ---------------- Audit log ---------------- */}
        <TabsContent value="audit">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={auditQuery}
                onChange={(e) => setAuditQuery(e.target.value)}
                placeholder="Search actions, actors, IDs…"
                aria-label="Search audit log"
                className="w-64 ps-8"
              />
            </div>
            <Select value={auditEntity} onValueChange={setAuditEntity}>
              <SelectTrigger className="w-36" aria-label="Filter by entity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entities</SelectItem>
                {entities.map((entity) => (
                  <SelectItem key={entity} value={entity}>
                    {entity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-xl border bg-card shadow-soft">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditPagination.pageRows.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="tnum whitespace-nowrap text-[13px] text-muted-foreground">
                        {fmtDateTime(entry.at)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-[13px]">{entry.actor}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="tnum">
                          {entry.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-96 truncate text-[13px]">{entry.detail}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {auditRows.length === 0 ? (
              <EmptyState
                title="No audit entries match"
                description="Loosen the search or clear the entity filter."
                className="m-4"
              />
            ) : (
              <PaginationBar
                page={auditPagination.page}
                pageCount={auditPagination.pageCount}
                from={auditPagination.from}
                to={auditPagination.to}
                total={auditPagination.total}
                onPage={auditPagination.setPage}
              />
            )}
          </div>
        </TabsContent>

        {/* ---------------- Platform ---------------- */}
        <TabsContent value="platform">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Marketplace economics</CardTitle>
                <CardDescription>
                  The numbers the pricing and matching engines run on.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="fee-floor">Lead fee floor (USD)</Label>
                    <Input
                      id="fee-floor"
                      type="number"
                      min="0"
                      step="0.5"
                      value={draft.leadFeeFloorUsd}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, leadFeeFloorUsd: num(e.target.value, d.leadFeeFloorUsd) }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fee-cap">Lead fee cap (USD)</Label>
                    <Input
                      id="fee-cap"
                      type="number"
                      min="0"
                      step="0.5"
                      value={draft.leadFeeCapUsd}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, leadFeeCapUsd: num(e.target.value, d.leadFeeCapUsd) }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pro-monthly">Pro subscription (USD/mo)</Label>
                    <Input
                      id="pro-monthly"
                      type="number"
                      min="0"
                      step="5"
                      value={draft.proMonthlyUsd}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, proMonthlyUsd: num(e.target.value, d.proMonthlyUsd) }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="match-count">Default match count</Label>
                    <Input
                      id="match-count"
                      type="number"
                      min="1"
                      max="10"
                      step="1"
                      value={draft.defaultMatchCount}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          defaultMatchCount: Math.round(num(e.target.value, d.defaultMatchCount)),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dup-window">Duplicate window (days)</Label>
                    <Input
                      id="dup-window"
                      type="number"
                      min="1"
                      max="60"
                      step="1"
                      value={draft.duplicateWindowDays}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          duplicateWindowDays: Math.round(num(e.target.value, d.duplicateWindowDays)),
                        }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Operations</CardTitle>
                <CardDescription>Automation and notification switches.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(
                  [
                    {
                      key: "autoAssignLeads",
                      label: "Auto-assign leads",
                      hint: "Offer new leads to matching companies without manual review.",
                    },
                    {
                      key: "notifyNewLead",
                      label: "Notify on new lead",
                      hint: "Email the ops team when an enquiry lands.",
                    },
                    {
                      key: "notifyOverdueInvoice",
                      label: "Notify on overdue invoice",
                      hint: "Daily digest of invoices past their due date.",
                    },
                    {
                      key: "requireTwoFactor",
                      label: "Require two-factor sign-in",
                      hint: "Applies to every console account on next sign-in.",
                    },
                  ] as const
                ).map(({ key, label, hint }) => (
                  <div key={key} className="flex items-start justify-between gap-4">
                    <div>
                      <Label htmlFor={`switch-${key}`} className="text-[13.5px]">
                        {label}
                      </Label>
                      <p className="text-xs text-muted-foreground">{hint}</p>
                    </div>
                    <Switch
                      id={`switch-${key}`}
                      checked={draft[key]}
                      onCheckedChange={(checked) => setDraft((d) => ({ ...d, [key]: checked }))}
                    />
                  </div>
                ))}
              </CardContent>
              <CardFooter className="justify-end gap-2">
                <Button variant="ghost" disabled={!dirty} onClick={() => setDraft(data.settings)}>
                  Discard
                </Button>
                <Button disabled={!dirty} onClick={saveSettings}>
                  Save changes
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
