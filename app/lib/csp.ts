import "server-only";
import { headers } from "next/headers";

export async function getCspNonce() {
  if (process.env.NODE_ENV !== "production") {
    return undefined;
  }
  return (await headers()).get("x-nonce") || undefined;
}
