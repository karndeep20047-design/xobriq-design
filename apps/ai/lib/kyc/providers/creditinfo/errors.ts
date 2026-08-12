// Thrown by mapper.ts when a Creditinfo EndQuery body doesn't match the
// envelope every mapper assumes (Data.response present and object-shaped).
// Distinct from CreditinfoTransientError (client.ts) — this is "we got a
// response but can't safely read it", not "Creditinfo was unreachable".
// Not retryable: the same malformed shape would come back again immediately.
export class CreditinfoResponseFormatError extends Error {
  readonly code = "CREDITINFO_RESPONSE_FORMAT_ERROR" as const;

  constructor(message: string) {
    super(message);
    this.name = "CreditinfoResponseFormatError";
  }
}
