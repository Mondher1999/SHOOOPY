import { randomUUID } from "crypto";

/**
 * Adds a correlation ID to every request for log traceability.
 * Uses the client-provided X-Request-Id header if present, otherwise generates a UUID.
 * Attaches to req.correlationId and echoes back in the response header.
 */
export function correlationId(req, _res, next) {
  const id = req.headers["x-request-id"] || randomUUID();
  req.correlationId = id;
  _res.setHeader("X-Request-Id", id);
  next();
}
