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
import { useAdminData, useAdminDispatch } from "@/lib/admin/store";
import {
  ADMIN_ROLES,
  PERMISSION_KEYS,
  type AdminRole,
  type PlatformSettings,
} from "@/lib/admin/types";
import { useI18n } from "@/i18n/provider";

const OPS_SWITCH_KEYS = [
  "autoAssignLeads",
  "notifyNewLead",
  "notifyOverdueInvoice",
  "requireTwoFactor",
] as const;

export function SettingsView({ initialTab }: { initialTab?: string }) {
  const data = useAdminData();
  const dispatch = useAdminDispatch();
  const { dict, t } = useI18n();

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
    toast.success(dict.admin.settings.savedToast);
  };

  const num = (value: string, fallback: number) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  return (
    <div className="animate-rise">
      <PageHeader title={dict.admin.settings.title} description={dict.admin.settings.description} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="team">{dict.admin.settings.tabTeam}</TabsTrigger>
          <TabsTrigger value="audit">{dict.admin.settings.tabAudit}</TabsTrigger>
          <TabsTrigger value="platform">{dict.admin.settings.tabPlatform}</TabsTrigger>
        </TabsList>

        {/* ---------------- Team & roles ---------------- */}
        <TabsContent value="team" className="space-y-4">
          <Card className="gap-0 overflow-hidden py-0 shadow-soft">
            <CardHeader className="pt-6 pb-4">
              <CardTitle>{dict.admin.settings.teamTitle}</CardTitle>
              <CardDescription>{dict.admin.settings.teamDescription}</CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{dict.admin.settings.colMember}</TableHead>
                    <TableHead>{dict.admin.settings.colRole}</TableHead>
                    <TableHead>{dict.admin.settings.colInvited}</TableHead>
                    <TableHead>{dict.admin.settings.colLastActive}</TableHead>
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
                            {dict.admin.settings.roles.owner}
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
                              toast.success(
                                t.fill(dict.admin.settings.roleToast, {
                                  name: member.name,
                                  role: dict.admin.settings.roles[role as AdminRole],
                                }),
                              );
                            }}
                          >
                            <SelectTrigger
                              size="sm"
                              className="w-36"
                              aria-label={t.fill(dict.admin.settings.roleForAria, {
                                name: member.name,
                              })}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ADMIN_ROLES.filter((r) => r !== "owner").map((role) => (
                                <SelectItem key={role} value={role}>
                                  {dict.admin.settings.roles[role]}
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
                        {t.dateShort(member.lastActiveAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card className="gap-0 overflow-hidden py-0 shadow-soft">
            <CardHeader className="pt-6 pb-4">
              <CardTitle>{dict.admin.settings.permissionsTitle}</CardTitle>
              <CardDescription>{dict.admin.settings.permissionsDescription}</CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-44">{dict.admin.settings.colPermission}</TableHead>
                    {ADMIN_ROLES.map((role) => (
                      <TableHead key={role} className="text-center">
                        {dict.admin.settings.roles[role]}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PERMISSION_KEYS.map((permission) => (
                    <TableRow key={permission}>
                      <TableCell className="text-[13px] font-medium">
                        {dict.admin.settings.permissions[permission]}
                        <span className="block text-[10.5px] text-muted-foreground">
                          {permission}
                        </span>
                      </TableCell>
                      {ADMIN_ROLES.map((role) => (
                        <TableCell key={role} className="text-center">
                          <Checkbox
                            checked={data.roles[role][permission]}
                            disabled={role === "owner"}
                            aria-label={`${dict.admin.settings.roles[role]}: ${dict.admin.settings.permissions[permission]}`}
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
                placeholder={dict.admin.settings.auditSearchPlaceholder}
                aria-label={dict.admin.settings.auditSearchAria}
                className="w-64 ps-8"
              />
            </div>
            <Select value={auditEntity} onValueChange={setAuditEntity}>
              <SelectTrigger className="w-36" aria-label={dict.admin.settings.entityFilterAria}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{dict.admin.settings.allEntities}</SelectItem>
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
                    <TableHead>{dict.admin.settings.colWhen}</TableHead>
                    <TableHead>{dict.admin.settings.colActor}</TableHead>
                    <TableHead>{dict.admin.settings.colAction}</TableHead>
                    <TableHead>{dict.admin.settings.colDetail}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditPagination.pageRows.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="tnum whitespace-nowrap text-[13px] text-muted-foreground">
                        {t.dateTime(entry.at)}
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
                title={dict.admin.settings.auditEmptyTitle}
                description={dict.admin.settings.auditEmptyDescription}
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
                <CardTitle>{dict.admin.settings.economicsTitle}</CardTitle>
                <CardDescription>{dict.admin.settings.economicsDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="fee-floor">{dict.admin.settings.feeFloor}</Label>
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
                    <Label htmlFor="fee-cap">{dict.admin.settings.feeCap}</Label>
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
                    <Label htmlFor="pro-monthly">{dict.admin.settings.proMonthly}</Label>
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
                    <Label htmlFor="match-count">{dict.admin.settings.matchCount}</Label>
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
                    <Label htmlFor="dup-window">{dict.admin.settings.dupWindow}</Label>
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
                <CardTitle>{dict.admin.settings.operationsTitle}</CardTitle>
                <CardDescription>{dict.admin.settings.operationsDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {OPS_SWITCH_KEYS.map((key) => (
                  <div key={key} className="flex items-start justify-between gap-4">
                    <div>
                      <Label htmlFor={`switch-${key}`} className="text-[13.5px]">
                        {dict.admin.settings.switches[key].label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {dict.admin.settings.switches[key].hint}
                      </p>
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
                  {dict.admin.settings.discard}
                </Button>
                <Button disabled={!dirty} onClick={saveSettings}>
                  {dict.admin.common.saveChanges}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
