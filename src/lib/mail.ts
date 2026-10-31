import { nanoid } from "nanoid";
import { serverSingleton } from "@/lib/server-singleton";

/**
 * Outbound mail.
 *
 * Every message this product sends is composed here and handed to a
 * repository that records it. There is no mail provider wired into this
 * project — no SMTP credentials, no Resend or Postmark key, nothing in the
 * environment to send with — so the "send" is a write, and the written
 * messages are shown in the admin console and the partner's dashboard.
 *
 * That is a deliberate choice over two worse ones. Silently doing nothing
 * would make the approve button look like it worked while the applicant
 * waited forever for a mail that was never addressed. Pretending to send and
 * logging "sent" would hide the same hole behind a reassuring word. Recording
 * the real subject and body, and putting them where a reviewer can read them,
 * is honest about the missing hop and still demonstrates the whole flow.
 *
 * `MailTransport` is the seam. A real provider replaces `deliver` and nothing
 * else in the codebase changes: the templates, the triggers and the call
 * sites are all already what they would be.
 *
 * Bodies are composed in English rather than through the locale dictionaries.
 * Mail is a separate channel from the UI — it is read in an inbox hours
 * later, not inside a page that has a current locale — and giving seven
 * templates eight translations each would add a great deal of text that only
 * the outbox viewer ever renders. The recipient's locale is recorded on the
 * message so localised templates are a drop-in later.
 */

export const MAIL_FROM = "partners@rotamove.com";
export const SUPPORT_EMAIL = "partners@rotamove.com";

export type MailKind =
  /** Application intake acknowledgement, carrying the reference code. */
  | "application_received"
  /** Vetting passed; the account is live. */
  | "application_approved"
  /** Vetting failed, with the reviewer's reason. */
  | "application_declined"
  /** Reviewer needs more paperwork before deciding. */
  | "documents_requested"
  /** Plan change accepted, taking effect at the end of the current cycle. */
  | "plan_queued"
  /** Plan change in force now — an upgrade, which does not wait. */
  | "plan_activated"
  /** Account contact details changed, sent to the address on file. */
  | "contact_changed"
  /** Someone wrote in from the public contact page. */
  | "contact_enquiry";

export interface MailMessage {
  id: string;
  kind: MailKind;
  to: string;
  subject: string;
  /** Plain text, paragraphs separated by blank lines. */
  body: string;
  sentAt: string;
  /** Application reference or partner id this message concerns. */
  ref?: string;
  /** The recipient's interface language, for when templates are localised. */
  locale?: string;
}

export type MailInput = Omit<MailMessage, "id" | "sentAt">;

/* ----------------------------------------------------------- templates -- */

const SIGN_OFF = `— The Rotamove partner team\n${SUPPORT_EMAIL}`;

/** Everything a template needs, so no template reaches for ambient state. */
export interface MailContext {
  to: string;
  /** Person's name, for the greeting. */
  name: string;
  companyName: string;
  ref?: string;
  locale?: string;
}

export function applicationReceivedMail(ctx: MailContext & { reference: string }): MailInput {
  return {
    kind: "application_received",
    to: ctx.to,
    ref: ctx.reference,
    locale: ctx.locale,
    subject: `We received your partner application — ${ctx.reference}`,
    body: [
      `Hello ${ctx.name},`,
      `We received your partner application for ${ctx.companyName}. Your reference code is ${ctx.reference}.`,
      `Quote this code if you contact us about the application. Our team reviews credentials, insurance cover and operating licences by hand, which usually takes two working days. We will email you at ${ctx.to} as soon as there is a decision, and we will write sooner if we need another document from you.`,
      `You do not need to do anything in the meantime.`,
      SIGN_OFF,
    ].join("\n\n"),
  };
}

export function applicationApprovedMail(
  ctx: MailContext & { reference: string; partnerId: string; loginUrl: string },
): MailInput {
  return {
    kind: "application_approved",
    to: ctx.to,
    ref: ctx.reference,
    locale: ctx.locale,
    subject: `${ctx.companyName} is approved — your Rotamove account is live`,
    body: [
      `Hello ${ctx.name},`,
      `Good news: ${ctx.companyName} passed vetting and your Rotamove partner account is live.`,
      `Your account number is ${ctx.partnerId}. Sign in at ${ctx.loginUrl} to set your lanes and start receiving leads on the plan you chose.`,
      `Your €100 signing credit is already on the account and is spent before anything is charged.`,
      SIGN_OFF,
    ].join("\n\n"),
  };
}

export function applicationDeclinedMail(
  ctx: MailContext & { reference: string; reason: string },
): MailInput {
  return {
    kind: "application_declined",
    to: ctx.to,
    ref: ctx.reference,
    locale: ctx.locale,
    subject: `Your Rotamove partner application — ${ctx.reference}`,
    body: [
      `Hello ${ctx.name},`,
      `We have finished reviewing the application for ${ctx.companyName}, and we are not able to approve it at this time.`,
      `Reason given by the reviewer: ${ctx.reason}`,
      `This is not permanent. If the reason above is something you can resolve — a licence that has since been renewed, cover that has been increased — reply to this message with the updated paperwork quoting ${ctx.reference} and we will reopen the review.`,
      SIGN_OFF,
    ].join("\n\n"),
  };
}

export function documentsRequestedMail(
  ctx: MailContext & { reference: string; documents: string[]; note?: string },
): MailInput {
  const list = ctx.documents.map((d) => `  • ${d}`).join("\n");
  return {
    kind: "documents_requested",
    to: ctx.to,
    ref: ctx.reference,
    locale: ctx.locale,
    subject: `Action needed: documents for ${ctx.reference}`,
    body: [
      `Hello ${ctx.name},`,
      `We have started reviewing the application for ${ctx.companyName} and we need a few more documents before we can decide:`,
      list,
      ...(ctx.note ? [`Note from the reviewer: ${ctx.note}`] : []),
      `Reply to this message with the files attached, quoting ${ctx.reference}. The request is also waiting in your partner dashboard. Your application stays open until you send them.`,
      SIGN_OFF,
    ].join("\n\n"),
  };
}

export function planQueuedMail(
  ctx: MailContext & { fromPlan: string; toPlan: string; effectiveOn: string; daysLeft: number },
): MailInput {
  return {
    kind: "plan_queued",
    to: ctx.to,
    ref: ctx.ref,
    locale: ctx.locale,
    subject: `Your plan changes to ${ctx.toPlan} on ${ctx.effectiveOn}`,
    body: [
      `Hello ${ctx.name},`,
      `We have your request to move ${ctx.companyName} from ${ctx.fromPlan} to ${ctx.toPlan}.`,
      `The change takes effect on ${ctx.effectiveOn}, in ${ctx.daysLeft} ${ctx.daysLeft === 1 ? "day" : "days"}. Until then you stay on ${ctx.fromPlan}, which is what the current billing period was opened on — we do not split a period across two pricing models, because no invoice could describe it honestly.`,
      `You can withdraw the request from your dashboard any time before it takes effect.`,
      SIGN_OFF,
    ].join("\n\n"),
  };
}

export function planActivatedMail(
  ctx: MailContext & { toPlan: string; cycleEnds: string },
): MailInput {
  return {
    kind: "plan_activated",
    to: ctx.to,
    ref: ctx.ref,
    locale: ctx.locale,
    subject: `${ctx.toPlan} is active on your account`,
    body: [
      `Hello ${ctx.name},`,
      `${ctx.companyName} is now on ${ctx.toPlan}, effective immediately.`,
      `An upgrade does not wait for the end of a billing period — you asked for more, so you have it now rather than in a fortnight. Your new period runs to ${ctx.cycleEnds}.`,
      SIGN_OFF,
    ].join("\n\n"),
  };
}

export function contactChangedMail(
  ctx: MailContext & { changed: string[]; previousEmail: string },
): MailInput {
  return {
    kind: "contact_changed",
    to: ctx.to,
    ref: ctx.ref,
    locale: ctx.locale,
    subject: `Your Rotamove account details were changed`,
    body: [
      `Hello ${ctx.name},`,
      `The following details on ${ctx.companyName}'s account were just changed: ${ctx.changed.join(", ")}.`,
      // Sent to the old address as well as the new one. An account takeover
      // that only notifies the address the attacker just set is not a
      // notification, it is a courtesy to the attacker.
      `This message went to ${ctx.previousEmail} as well as the new address, so a change you did not make is visible from the mailbox you still control.`,
      `If this was not you, reply immediately and we will freeze the account.`,
      SIGN_OFF,
    ].join("\n\n"),
  };
}

/**
 * An enquiry from the public contact form.
 *
 * Addressed to us, not to the sender — this is the only template in the file
 * that runs inbound, so `to` is the support desk and the sender's address is
 * in the body as the reply-to. That keeps it in the same outbox the admin
 * console already reads, which is where a reviewer would look for it.
 */
export function contactEnquiryMail(ctx: {
  fullName: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
  locale: string;
  /** Country the edge saw, when it saw one. Context for the desk, not data. */
  country?: string | null;
}): MailInput {
  return {
    kind: "contact_enquiry",
    to: SUPPORT_EMAIL,
    locale: ctx.locale,
    subject: `Contact form — ${ctx.topic} — ${ctx.fullName}`,
    body: [
      `${ctx.fullName} wrote in through the contact page.`,
      [
        `Topic:   ${ctx.topic}`,
        `Email:   ${ctx.email}`,
        `Phone:   ${ctx.phone || "(not given)"}`,
        `Locale:  ${ctx.locale}`,
        `Country: ${ctx.country ?? "(unknown)"}`,
      ].join("\n"),
      ctx.message,
      `Reply to ${ctx.email}.`,
    ].join("\n\n"),
  };
}

/* ---------------------------------------------------------- repository -- */

export interface MailRepository {
  send(input: MailInput): Promise<MailMessage>;
  /** Newest first. The admin outbox view. */
  listAll(limit?: number): Promise<MailMessage[]>;
  /** Everything concerning one application reference or partner id. */
  listForRef(ref: string): Promise<MailMessage[]>;
  listForRecipient(email: string): Promise<MailMessage[]>;
}

class InMemoryMailRepository implements MailRepository {
  private readonly messages: MailMessage[] = [];
  private readonly capacity = 500;

  async send(input: MailInput): Promise<MailMessage> {
    const message: MailMessage = {
      ...input,
      id: `ml_${nanoid(10)}`,
      sentAt: new Date().toISOString(),
    };
    // Newest first, so every reader gets the order it wants without sorting.
    this.messages.unshift(message);
    if (this.messages.length > this.capacity) this.messages.length = this.capacity;
    return message;
  }

  async listAll(limit = 100): Promise<MailMessage[]> {
    return this.messages.slice(0, limit);
  }

  async listForRef(ref: string): Promise<MailMessage[]> {
    return this.messages.filter((m) => m.ref === ref);
  }

  async listForRecipient(email: string): Promise<MailMessage[]> {
    const wanted = email.trim().toLowerCase();
    return this.messages.filter((m) => m.to.trim().toLowerCase() === wanted);
  }
}

/**
 * Module-level singleton, stashed on globalThis so a hot reload in dev does
 * not empty the outbox mid-demonstration.
 */
export const mailRepository: MailRepository = serverSingleton(
  "__rotamoveMail",
  () => new InMemoryMailRepository(),
);
