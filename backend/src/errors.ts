/**
 * Domain errors. Deliberately HTTP-agnostic — they carry no status code.
 * Mapping domain error -> HTTP status lives in middlewares/errorHandler.ts,
 * so services/AI/extractor can be reused outside Express (CLI, queue, tests).
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** Client sent something invalid (missing file, wrong type). */
export class ValidationError extends DomainError {}

/** The uploaded document could not be read / produced no text. */
export class DocumentUnreadableError extends DomainError {}

/** The AI responded, but the payload was not the expected structured JSON. */
export class InvalidAIResponseError extends DomainError {}

/** The AI provider could not be reached (no key, network, outage). */
export class AIUnavailableError extends DomainError {}

/** No contract exists for the requested id. */
export class ContractNotFoundError extends DomainError {}

/** The uploaded file is larger than the allowed limit. */
export class PayloadTooLargeError extends DomainError {}
