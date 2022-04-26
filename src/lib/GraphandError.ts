enum GraphandErrorCodes {
  UNKNOWN = "unknown",
  UNAUTHORIZED = "unauthorized",
  INVALID_TOKEN = "invalid_token",
  EXPIRED_TOKEN = "expired_token",
  NOT_FOUND = "not_found",
  INVALID_PLUGIN = "invalid_plugin",
}

class GraphandError extends Error {
  static Codes = GraphandErrorCodes;

  name: string;
  status: number;
  code: string;
  message: string;
  target: string;

  constructor(message = "Unknown error", code: string = GraphandErrorCodes.UNKNOWN, status = 500, target?: string) {
    super();
    const { constructor } = Object.getPrototypeOf(this);
    this.name = constructor.name;

    // @ts-ignore
    if (Error.captureStackTrace) {
      // @ts-ignore
      Error.captureStackTrace(this, constructor);
    }

    if (message) {
      Object.assign(this, { message });
    }

    if (code) {
      Object.assign(this, { code });
    }

    if (status) {
      Object.assign(this, { status });
    }

    if (target) {
      Object.assign(this, { target });
    }
  }

  static fromJSON(input, status?: number) {
    switch (input.type) {
      case "GraphandValidationError":
        const GraphandValidationError = require("./GraphandValidationError").default;
        return new GraphandValidationError(input.message, input.field, input.code);
      case "GraphandError":
      default:
        return new GraphandError(input.message, input.code, status ?? input.status, input.target);
    }
  }

  static parse(input) {
    const errors = Array.isArray(input)
      ? input
      : typeof input === "object"
      ? [input]
      : typeof input === "string"
      ? [
          {
            type: "GraphandError",
            message: input,
          },
        ]
      : [];
    return errors.map((e) => GraphandError.fromJSON(e));
  }

  toJSON() {
    return {
      type: this.name,
      message: this.message,
      code: this.code,
      target: this.target,
      status: this.status,
    };
  }
}

export default GraphandError;
