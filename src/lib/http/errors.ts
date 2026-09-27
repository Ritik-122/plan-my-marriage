export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTH_REQUIRED"
  | "INVALID_CREDENTIALS"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INVALID_STATE"
  | "EMAIL_DELIVERY_FAILED"
  | "GUEST_LINK_INVALID"
  | "UPLOAD_LINK_INVALID"
  | "UPLOAD_NOT_FOUND"
  | "UPLOAD_INVALID"
  | "PROVIDER_UNAVAILABLE"
  | "INTERNAL_ERROR";

// Only pass deliberately public messages/fields, never raw provider errors.
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
