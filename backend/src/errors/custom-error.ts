// Base class for all known/expected API errors, mirrors the legacy pattern of
// controllers catching exceptions and returning BadRequest(e.Message).
export abstract class CustomError extends Error {
  abstract statusCode: number;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, CustomError.prototype);
  }

  abstract serializeErrors(): { message: string; field?: string }[];
}
