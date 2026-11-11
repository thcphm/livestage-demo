/**
 * Platform messaging rules (R7). Money flows through Olive, so contact details in messages stay hidden
 * until the booking is confirmed – the same rule as phone/email on profiles.
 */

export const CONTACT_MASK = "•••";

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
// Seven or more digits, allowing spaces, dots, dashes and a leading +, e.g. "0909 318 112", "+1 (416) 555-0199".
const PHONE = /\+?\(?\d[\d\s().-]{5,}\d/g;
const URL = /\b(?:https?:\/\/|www\.)\S+/gi;
// "zalo 0909…", "facebook.com/…", "@handle" on social apps.
const SOCIAL = /\b(?:zalo|whatsapp|telegram|viber|wechat|facebook\.com|fb\.com|instagram\.com|t\.me)\b\S*/gi;
const HANDLE = /(^|\s)@[\w.]{3,}/g;
const AMOUNT = /^\d{1,3}(?:[.,]\d{3})+$/;

export interface MaskResult {
  text: string;
  masked: boolean;
}

/** Replace emails, phone numbers, links and social handles with a mask. */
export function maskContacts(text: string): MaskResult {
  let masked = false;
  const hit = (s: string, re: RegExp, keepPrefix = false) => s.replace(re, (m, p1) => {
    masked = true;
    return keepPrefix && typeof p1 === "string" ? p1 + CONTACT_MASK : CONTACT_MASK;
  });
  let out = hit(text, EMAIL);
  out = hit(out, URL);
  out = hit(out, SOCIAL);
  out = hit(out, HANDLE, true);
  out = out.replace(PHONE, (m) => {
    // Amounts grouped in thousands ("3.500.000", "1,200") are prices, not phone numbers.
    if (m.replace(/\D/g, "").length < 7 || AMOUNT.test(m)) return m;
    masked = true;
    return CONTACT_MASK;
  });
  return { text: out, masked };
}

/** Contact details are shared once the booking is confirmed or done (project guide §5). */
export const contactsRevealed = (status: string): boolean => status === "confirmed" || status === "completed";

/** The text a participant sees; admins always see the original. */
export function visibleMessage(text: string, status: string, viewerIsAdmin: boolean): MaskResult {
  if (viewerIsAdmin || contactsRevealed(status)) return { text, masked: false };
  return maskContacts(text);
}
