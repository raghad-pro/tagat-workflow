import { cookies } from "next/headers";
import { ENV } from "@/config/env";

/**
 * Whether the visitor arrives with a session cookie. Presence, not validity:
 * an expired token still reads as signed in here, and the dashboard's own
 * guard is what catches that. Good enough to pick the right call to action.
 */
export async function hasSessionCookie(): Promise<boolean> {
  const store = await cookies();
  return Boolean(store.get(ENV.ACCESS_TOKEN_KEY)?.value);
}
