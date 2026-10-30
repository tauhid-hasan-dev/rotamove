"use client";

import { useMemo, useState } from "react";
import {
  Lock,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageHeader } from "@/components/admin/bits";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  PERMISSION_KEYS,
  type PlatformSettings,
  type RoleDef,
  type TeamMember,
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
  const sx = dict.admin.settings;

  const [tab, setTab] = useState(
    initialTab === "audit" || initialTab === "platform" || initialTab === "roles"
      ? initialTab
      : "team",
  );

  const roleById = useMemo(
    () => new Map(data.roles.map((r) => [r.id, r])),
    [data.roles],
  );

  /* ---- user dialogs ---- */
  const [userDialog, setUserDialog] = useState<{ mode: "create" } | { mode: "edit"; member: TeamMember } | null>(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRoleId, setUserRoleId] = useState<string>(data.roles[0]?.id ?? "");
  const [userError, setUserError] = useState<string | null>(null);
  const [deactivateUser, setDeactivateUser] = useState<TeamMember | null>(null);
  // Restoring access is as much a decision as withdrawing it, so it asks too.
  const [reactivateUser, setReactivateUser] = useState<TeamMember | null>(null);

  const openCreateUser = () => {
    setUserName("");
    setUserEmail("");
    setUserRoleId(data.roles.find((r) => !r.locked)?.id ?? data.roles[0]?.id ?? "");
    setUserError(null);
    setUserDialog({ mode: "create" });
  };

  const openEditUser = (member: TeamMember) => {
    setUserName(member.name);
    setUserEmail(member.email);
    setUserRoleId(member.roleId);
    setUserError(null);
    setUserDialog({ mode: "edit", member });
  };

  const submitUser = () => {
    const name = userName.trim();
    const email = userEmail.trim();
    if (name.length < 2) {
      setUserError(sx.userNameError);
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setUserError(sx.userEmailError);
      return;
    }
    if (!userDialog) return;
    if (userDialog.mode === "create") {
      dispatch({ type: "team/create", name, email, roleId: userRoleId });
      toast.success(t.fill(sx.userCreatedToast, { name }));
    } else {
      dispatch({ type: "team/update", memberId: userDialog.member.id, patch: { name, email } });
      if (userRoleId !== userDialog.member.roleId) {
        dispatch({ type: "team/role", memberId: userDialog.member.id, roleId: userRoleId });
      }
      toast.success(t.fill(sx.userUpdatedToast, { name }));
    }
    setUserDialog(null);
  };

  /* ---- role dialogs ---- */
  const [roleDialog, setRoleDialog] = useState<{ mode: "create" } | { mode: "edit"; role: RoleDef } | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleError, setRoleError] = useState<string | null>(null);
  const [removeRole, setRemoveRole] = useState<RoleDef | null>(null);

  const submitRole = () => {
    const name = roleName.trim();
    if (name.length < 2) {
      setRoleError(sx.roleNameError);
      return;
    }
    if (!roleDialog) return;
    if (roleDialog.mode === "create") {
      dispatch({ type: "roles/create", name });
      toast.success(t.fill(sx.roleCreatedToast, { name }));
    } else {
      dispatch({ type: "roles/rename", roleId: roleDialog.role.id, name });
      toast.success(t.fill(sx.roleRenamedToast, { name }));
    }
    setRoleDialog(null);
  };

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
          <TabsTrigger value="team">{sx.tabUsers}</TabsTrigger>
          <TabsTrigger value="roles">{sx.tabRoles}</TabsTrigger>
          <TabsTrigger value="audit">{sx.tabAudit}</TabsTrigger>
          <TabsTrigger value="platform">{sx.tabPlatform}</TabsTrigger>
        </TabsList>

        {/* ---------------- Users ---------------- */}
        <TabsContent value="team" className="space-y-4">
          <Card className="gap-0 overflow-hidden py-0 shadow-soft">
            <CardHeader className="flex flex-row items-start justify-between gap-3 pt-6 pb-4">
              <div className="space-y-1.5">
                <CardTitle>{sx.usersTitle}</CardTitle>
                <CardDescription>{sx.usersDescription}</CardDescription>
              </div>
              <Button className="gap-2" onClick={openCreateUser}>
                <UserPlus aria-hidden />
                {sx.addUser}
              </Button>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{sx.colMember}</TableHead>
                    <TableHead>{sx.colRole}</TableHead>
                    <TableHead>{sx.colInvited}</TableHead>
                    <TableHead>{sx.colLastActive}</TableHead>
                    <TableHead className="text-end">{sx.colActions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.team.map((member) => {
                    const role = roleById.get(member.roleId);
                    const inactive = Boolean(member.deactivatedAt);
                    return (
                      <TableRow key={member.id} className={inactive ? "opacity-60" : undefined}>
                        <TableCell>
                          <span className="flex items-center gap-3">
                            <span
                              aria-hidden
                              className={`flex size-8 items-center justify-center rounded-full text-xs font-semibold ${
                                inactive
                                  ? "bg-muted text-muted-foreground"
                                  : "bg-brand/25 text-ink dark:bg-brand/15 dark:text-brand"
                              }`}
                            >
                              {member.name
                                .split(" ")
                                .map((part) => part[0])
                                .slice(0, 2)
                                .join("")}
                            </span>
                            <span>
                              <span className="flex items-center gap-2">
                                <span className="text-[13.5px] font-medium">{member.name}</span>
                                {inactive ? (
                                  <Badge variant="outline" className="text-[10.5px]">
                                    {sx.deactivated}
                                  </Badge>
                                ) : null}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {member.email}
                              </span>
                            </span>
                          </span>
                        </TableCell>
                        <TableCell>
                          {member.locked ? (
                            <Badge variant="secondary" className="gap-1">
                              <Lock aria-hidden />
                              {role?.name ?? member.roleId}
                            </Badge>
                          ) : (
                            <Select
                              value={member.roleId}
                              disabled={inactive}
                              onValueChange={(roleId) => {
                                dispatch({ type: "team/role", memberId: member.id, roleId });
                                toast.success(
                                  t.fill(sx.roleToast, {
                                    name: member.name,
                                    role: roleById.get(roleId)?.name ?? roleId,
                                  }),
                                );
                              }}
                            >
                              <SelectTrigger
                                size="sm"
                                className="w-52"
                                aria-label={t.fill(sx.roleForAria, { name: member.name })}
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {data.roles.map((r) => (
                                  <SelectItem key={r.id} value={r.id}>
                                    {r.name}
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
                          {inactive
                            ? t.fill(sx.deactivatedOn, {
                                date: t.dateShort(member.deactivatedAt as string),
                              })
                            : t.dateShort(member.lastActiveAt)}
                        </TableCell>
                        <TableCell className="text-end">
                          <span className="inline-flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={t.fill(sx.editUserAria, { name: member.name })}
                              disabled={inactive}
                              onClick={() => openEditUser(member)}
                            >
                              <Pencil aria-hidden />
                            </Button>
                            {/* Access is withdrawn, never erased — the audit
                                trail names this person against work they
                                did, and that has to keep resolving. */}
                            {inactive ? (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={t.fill(sx.reactivateUserAria, { name: member.name })}
                                onClick={() => setReactivateUser(member)}
                              >
                                <UserCheck aria-hidden />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={t.fill(sx.deactivateUserAria, { name: member.name })}
                                disabled={member.locked}
                                onClick={() => setDeactivateUser(member)}
                              >
                                <UserX aria-hidden />
                              </Button>
                            )}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* ---------------- Roles & permissions ---------------- */}
        <TabsContent value="roles" className="space-y-4">
          <Card className="gap-0 overflow-hidden py-0 shadow-soft">
            <CardHeader className="flex flex-row items-start justify-between gap-3 pt-6 pb-4">
              <div className="space-y-1.5">
                <CardTitle>{sx.rolesTitle}</CardTitle>
                <CardDescription>{sx.rolesDescription}</CardDescription>
              </div>
              <Button
                className="gap-2"
                onClick={() => {
                  setRoleName("");
                  setRoleError(null);
                  setRoleDialog({ mode: "create" });
                }}
              >
                <Plus aria-hidden />
                {sx.addRole}
              </Button>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{sx.colRole}</TableHead>
                    <TableHead>{sx.colGranted}</TableHead>
                    <TableHead>{sx.colUsers}</TableHead>
                    <TableHead className="text-end">{sx.colActions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.roles.map((role) => {
                    const granted = PERMISSION_KEYS.filter((k) => role.permissions[k]).length;
                    const holders = data.team.filter((m) => m.roleId === role.id).length;
                    return (
                      <TableRow key={role.id}>
                        <TableCell className="text-[13.5px] font-medium">
                          <span className="flex items-center gap-2">
                            {role.name}
                            {role.locked ? (
                              <Badge variant="secondary" className="gap-1">
                                <Lock aria-hidden />
                                {sx.lockedRole}
                              </Badge>
                            ) : null}
                          </span>
                        </TableCell>
                        <TableCell className="tnum text-[13px] text-muted-foreground">
                          {t.fill(sx.grantedOf, {
                            n: granted,
                            total: PERMISSION_KEYS.length,
                          })}
                        </TableCell>
                        <TableCell className="tnum text-[13px] text-muted-foreground">
                          {holders}
                        </TableCell>
                        <TableCell className="text-end">
                          <span className="inline-flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={t.fill(sx.renameRoleAria, { name: role.name })}
                              disabled={role.locked}
                              onClick={() => {
                                setRoleName(role.name);
                                setRoleError(null);
                                setRoleDialog({ mode: "edit", role });
                              }}
                            >
                              <Pencil aria-hidden />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={t.fill(sx.deleteRoleAria, { name: role.name })}
                              disabled={role.locked}
                              onClick={() => setRemoveRole(role)}
                            >
                              <Trash2 aria-hidden />
                            </Button>
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card className="gap-0 overflow-hidden py-0 shadow-soft">
            <CardHeader className="pt-6 pb-4">
              <CardTitle>{sx.permissionsTitle}</CardTitle>
              <CardDescription>{sx.permissionsDescription}</CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-44">{sx.colPermission}</TableHead>
                    {data.roles.map((role) => (
                      <TableHead key={role.id} className="min-w-28 text-center">
                        {role.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PERMISSION_KEYS.map((permission) => (
                    <TableRow key={permission}>
                      <TableCell className="text-[13px] font-medium">
                        {sx.permissions[permission]}
                        <span className="block text-[10.5px] text-muted-foreground">
                          {permission}
                        </span>
                      </TableCell>
                      {data.roles.map((role) => (
                        <TableCell key={role.id} className="text-center">
                          <Checkbox
                            checked={role.permissions[permission]}
                            disabled={role.locked}
                            aria-label={`${role.name}: ${sx.permissions[permission]}`}
                            onCheckedChange={() => {
                              dispatch({ type: "roles/toggle", roleId: role.id, permission });
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
                      value={draft.leadFeeFloorEur}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, leadFeeFloorEur: num(e.target.value, d.leadFeeFloorEur) }))
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
                      value={draft.leadFeeCapEur}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, leadFeeCapEur: num(e.target.value, d.leadFeeCapEur) }))
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
                      value={draft.proMonthlyEur}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, proMonthlyEur: num(e.target.value, d.proMonthlyEur) }))
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

      {/* ---------------- User create / edit ---------------- */}
      <Dialog open={userDialog !== null} onOpenChange={(open) => !open && setUserDialog(null)}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>
              {userDialog?.mode === "edit" ? sx.editUserTitle : sx.addUserTitle}
            </DialogTitle>
            <DialogDescription>
              {userDialog?.mode === "edit" ? sx.editUserDescription : sx.addUserDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="user-name">{sx.userName}</Label>
              <Input
                id="user-name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder={sx.userNamePlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-email">{sx.userEmail}</Label>
              <Input
                id="user-email"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder={sx.userEmailPlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-role">{sx.colRole}</Label>
              <Select
                value={userRoleId}
                onValueChange={setUserRoleId}
                disabled={userDialog?.mode === "edit" && userDialog.member.locked}
              >
                <SelectTrigger id="user-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {data.roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {userError ? (
              <p role="alert" className="text-[13px] text-destructive">
                {userError}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUserDialog(null)}>
              {dict.admin.common.cancel}
            </Button>
            <Button onClick={submitUser}>
              {userDialog?.mode === "edit" ? dict.admin.common.saveChanges : sx.addUser}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- Role create / rename ---------------- */}
      <Dialog open={roleDialog !== null} onOpenChange={(open) => !open && setRoleDialog(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {roleDialog?.mode === "edit" ? sx.renameRoleTitle : sx.addRoleTitle}
            </DialogTitle>
            <DialogDescription>
              {roleDialog?.mode === "edit" ? sx.renameRoleDescription : sx.addRoleDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="role-name">{sx.roleName}</Label>
              <Input
                id="role-name"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder={sx.roleNamePlaceholder}
              />
            </div>
            {roleError ? (
              <p role="alert" className="text-[13px] text-destructive">
                {roleError}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRoleDialog(null)}>
              {dict.admin.common.cancel}
            </Button>
            <Button onClick={submitRole}>
              {roleDialog?.mode === "edit" ? dict.admin.common.saveChanges : sx.addRole}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deactivateUser !== null}
        onOpenChange={(open) => !open && setDeactivateUser(null)}
        title={t.fill(sx.deactivateUserTitle, { name: deactivateUser?.name ?? "" })}
        description={sx.deactivateUserDescription}
        confirmLabel={sx.deactivateUserConfirm}
        destructive
        onConfirm={() => {
          if (!deactivateUser) return;
          dispatch({ type: "team/active", memberId: deactivateUser.id, active: false });
          toast.success(t.fill(sx.userDeactivatedToast, { name: deactivateUser.name }));
          setDeactivateUser(null);
        }}
      />

      {/* Not `destructive`: this one gives access back. */}
      <ConfirmDialog
        open={reactivateUser !== null}
        onOpenChange={(open) => !open && setReactivateUser(null)}
        title={t.fill(sx.reactivateUserTitle, { name: reactivateUser?.name ?? "" })}
        description={t.fill(sx.reactivateUserDescription, {
          role: reactivateUser ? (roleById.get(reactivateUser.roleId)?.name ?? "") : "",
        })}
        confirmLabel={sx.reactivateUserConfirm}
        onConfirm={() => {
          if (!reactivateUser) return;
          dispatch({ type: "team/active", memberId: reactivateUser.id, active: true });
          toast.success(t.fill(sx.userReactivatedToast, { name: reactivateUser.name }));
          setReactivateUser(null);
        }}
      />

      <ConfirmDialog
        open={removeRole !== null}
        onOpenChange={(open) => !open && setRemoveRole(null)}
        title={t.fill(sx.deleteRoleTitle, { name: removeRole?.name ?? "" })}
        description={sx.deleteRoleDescription}
        confirmLabel={sx.deleteRoleConfirm}
        destructive
        onConfirm={() => {
          if (!removeRole) return;
          dispatch({ type: "roles/delete", roleId: removeRole.id });
          toast.success(t.fill(sx.roleDeletedToast, { name: removeRole.name }));
          setRemoveRole(null);
        }}
      />
    </div>
  );
}
