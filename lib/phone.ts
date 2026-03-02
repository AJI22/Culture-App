/**
 * Phone number normalization to E.164.
 * Used when adding/importing guests and when processing inbound messages so we can
 * match senders to guests by (event_id, phone_e164). Default region NG (Nigeria).
 */
import { parsePhoneNumberWithError, type CountryCode } from "libphonenumber-js";

const DEFAULT_REGION: CountryCode = "NG";

/**
 * Normalize phone to E.164. Returns null if invalid.
 * Handles spaces, leading 00, and optional country code.
 */
export function normalizePhone(
  input: string,
  defaultRegion: CountryCode = DEFAULT_REGION
): string | null {
  const cleaned = input.replace(/\s+/g, "").replace(/^00/, "+");
  try {
    const parsed = parsePhoneNumberWithError(
      cleaned.startsWith("+") ? cleaned : `${defaultRegion}${cleaned}`,
      defaultRegion
    );
    return parsed.format("E.164");
  } catch {
    return null;
  }
}

/**
 * Normalize and throw if invalid (for API use when phone is required).
 */
export function normalizePhoneOrThrow(
  input: string,
  defaultRegion: CountryCode = DEFAULT_REGION
): string {
  const e164 = normalizePhone(input, defaultRegion);
  if (!e164) throw new Error(`Invalid phone number: ${input}`);
  return e164;
}
