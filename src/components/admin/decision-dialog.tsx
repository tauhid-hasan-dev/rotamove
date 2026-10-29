"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  REQUESTABLE_DOCUMENTS,
  type PartnerApplication,
  type RequestableDocument,
} from "@/lib/partner-application";
import { useI18n } from "@/i18n/provider";

/**
 * A reviewer's verdict, as one dialog with three branches.
 *
 * Shared by the queue and the detail page rather than written twice: the two
 * screens offer the same three decisions, and a second copy is how the
 * confirmation on one of them quietly stops matching what the other sends.
 *
 * Every branch names the address the message is going to, because that is
 * the fact the reviewer needs and cannot otherwise see — an approval is
 * irreversible from here and the email goes out with it.
 */

export type Decision = "approve" | "decline" | "request_documents";

export function DecisionDialog({
  application,
  decision,
  onClose,
  onDone,
}: {
  application: PartnerApplication;
  decision: Decision;
  onClose: () => void;
  onDone: (next: PartnerApplication) => void;
}) {
  const { dict, t } = useI18n();
  const ax = dict.admin.pending;

  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [documents, setDocuments] = useState<RequestableDocument[]>(
    // Pre-ticked with whatever is already outstanding, so a reviewer chasing
    // a second time does not have to remember what they asked for.
    () => [...(application.requestedDocuments ?? [])] as RequestableDocument[],
  );
  const [working, setWorking] = useState(false);

  const ready =
    decision === "approve" ||
    (decision === "decline" && reason.trim().length >= 4) ||
    (decision === "request_documents" && documents.length > 0);

  const submit = async () => {
    if (!ready) return;
    setWorking(true);
    try {
      const response = await fetch("/api/admin/applications/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: application.reference,
          decision,
          ...(decision === "decline" ? { reason: reason.trim() } : {}),
          ...(decision === "request_documents"
            ? { documents, note: note.trim() || undefined }
            : {}),
        }),
      });
      if (!response.ok) throw new Error();
      const { application: next } = (await response.json()) as {
        application: PartnerApplication;
      };

      toast.success(
        decision === "approve"
          ? ax.toastApproved
          : decision === "decline"
            ? ax.toastDeclined
            : ax.toastRequested,
        { description: t.fill(ax.toastEmailed, { email: application.email }) },
      );
      onDone(next);
    } catch {
      toast.error(ax.toastFailed);
    } finally {
      setWorking(false);
    }
  };

  const title =
    decision === "approve"
      ? ax.approveTitle
      : decision === "decline"
        ? ax.declineTitle
        : ax.docsTitle;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {t.fill(ax.forCompany, {
              company: application.tradingName || application.legalName,
              reference: application.reference,
            })}
          </DialogDescription>
        </DialogHeader>

        {decision === "approve" && (
          <p className="rounded-xl border bg-surface p-4 text-[13px] leading-relaxed text-muted-foreground">
            {ax.approveBody}
          </p>
        )}

        {decision === "decline" && (
          <div>
            <Label htmlFor="decline-reason" className="mb-2 block text-[13.5px]">
              {ax.reasonLabel}
            </Label>
            <Textarea
              id="decline-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={ax.reasonPlaceholder}
              className="rounded-xl"
            />
            {/* Stated plainly: the reviewer's words are quoted verbatim to
                the applicant, so this is not an internal note. */}
            <p className="mt-2 text-[12px] text-muted-foreground">{ax.reasonHint}</p>
          </div>
        )}

        {decision === "request_documents" && (
          <div>
            <p className="text-[13.5px] font-medium">{ax.docsLabel}</p>
            <div className="mt-3 space-y-1">
              {REQUESTABLE_DOCUMENTS.map((doc) => (
                <label
                  key={doc}
                  className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted"
                >
                  <Checkbox
                    checked={documents.includes(doc)}
                    onCheckedChange={(next) =>
                      setDocuments((list) =>
                        next ? [...list, doc] : list.filter((d) => d !== doc),
                      )
                    }
                    className="mt-0.5"
                  />
                  <span className="text-[13.5px] leading-snug">{ax.documents[doc]}</span>
                </label>
              ))}
            </div>

            <Label htmlFor="docs-note" className="mb-2 mt-5 block text-[13.5px]">
              {ax.noteLabel}
            </Label>
            <Textarea
              id="docs-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={ax.notePlaceholder}
              className="rounded-xl"
            />
          </div>
        )}

        <p className="flex items-start gap-2 text-[12.5px] leading-snug text-muted-foreground">
          <Mail className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>{t.fill(ax.willEmail, { email: application.email })}</span>
        </p>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={working}>
            {dict.admin.common.cancel}
          </Button>
          <Button
            onClick={submit}
            disabled={working || !ready}
            variant={decision === "decline" ? "destructive" : "default"}
          >
            {working && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {decision === "approve"
              ? ax.approve
              : decision === "decline"
                ? ax.decline
                : ax.sendRequest}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
