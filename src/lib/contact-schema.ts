import { z } from "zod";
import { LOCALES } from "@/i18n/config";

/**
 * The contact form.
 *
 * One schema, used by the form to decide whether Submit is live and by the
 * route to decide whether to accept — the same arrangement the quote wizard
 * has with `leadDraftSchema`. A client that drifts from the server is the
 * failure mode this prevents.
 */

export const CONTACT_TOPICS = [
  "quote",
  "existing_move",
  "partner",
  "billing",
  "complaint",
  "press",
  "other",
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const MESSAGE_MAX = 2000;

export const contactMessageSchema = z.object({
  fullName: z.string().trim().min(2, "Tell us who you are").max(120),
  email: z.email("That email does not look right").max(200),
  /*
   * Optional, and that is a decision rather than an oversight: the form
   * already has an email address to reply to, and making a phone number
   * mandatory costs more submissions than it gains callbacks. When it is
   * given it must carry a dialling code, because a bare national number is
   * not dialable from the hub that would be calling.
   */
  phone: z
    .string()
    .trim()
    .max(32)
    .refine((v) => v === "" || /^\+\d[\d\s().-]{6,}$/.test(v), {
      message: "Include the country code",
    }),
  topic: z.enum(CONTACT_TOPICS),
  message: z.string().trim().min(10, "A little more detail, please").max(MESSAGE_MAX),
  locale: z.enum(LOCALES),
  /** Cloudflare Turnstile result. Verified server-side; never trusted here. */
  turnstileToken: z.string().min(1, "Complete the verification"),
});

export type ContactMessage = z.infer<typeof contactMessageSchema>;

/** The client half: everything except the token, which the widget supplies. */
export const contactFieldsSchema = contactMessageSchema.omit({ turnstileToken: true });
