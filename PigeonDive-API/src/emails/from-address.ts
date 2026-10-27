const LOCAL_PART = /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/;

/** Lowercases and validates the part before the @. The domain is never client-supplied. */
export function normalizeLocalPart(input: string): string | null {
  const value = input.trim().toLowerCase();
  if (!LOCAL_PART.test(value) || value.includes("..")) return null;
  return value;
}

export function buildFromAddress(localPart: string, domain: string): string {
  return `${localPart}@${domain}`;
}
