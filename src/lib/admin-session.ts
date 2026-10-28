/**
 * Admin sign-in, for the demo.
 *
 * Same shape as `partner-session.ts`: a cookie and one hardcoded credential
 * pair, checked server-side in the admin layout before any console chrome
 * renders. There is no admin user table — swapping in a real identity
 * provider touches this file and the layout gate, nothing else.
 */

export const ADMIN_EMAIL = "admin@rotamove.demo";
export const ADMIN_PASSWORD = "rotamove";

export const ADMIN_COOKIE = "rotamove.admin";
/** Eight hours — one working day, same as the partner session. */
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 8;

export const adminCredentialsMatch = (email: string, password: string) =>
  email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD;
