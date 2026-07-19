/** Every non-2xx response has exactly this shape (emitted by the API's global filter). */
export interface ApiError {
  statusCode: number;
  /** Machine-readable, e.g. 'INVALID_SIGNATURE'. */
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  path: string;
}
