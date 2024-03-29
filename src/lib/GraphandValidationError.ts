import GraphandError from "./GraphandError";

enum GraphandValidationErrorCodes {
  UNKNOWN = "unknown",
  REQUIRED = "required",
  UNIQUE = "unique",
  RESTRICTED = "restricted",
  NOT_FOUND = "not_found",
  INVALID = "invalid",
  WEBHOOK = "webhook",
}

class GraphandValidationError extends GraphandError {
  static Codes: any = GraphandValidationErrorCodes;

  type: string;
  message: string;
  code: string;
  field: string;
  argument: any;

  constructor(message = "Unknown validation error", field: string, code: string = GraphandValidationErrorCodes.UNKNOWN) {
    super(message, code, 400);

    Object.assign(this, { field });
  }

  toJSON(): any {
    return {
      type: this.name,
      message: this.message,
      code: this.code,
      field: this.field,
      argument: this.argument,
    };
  }
}

export default GraphandValidationError;
