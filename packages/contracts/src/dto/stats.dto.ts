/** Counts for the dashboard cards (GET /stats). */
export interface StatsDto {
  eventsReceived: number;
  eventsProcessed: number;
  /** The headline correctness number. */
  duplicatesRejected: number;
  sendsDelivered: number;
  sendsInDlq: number;
  openGaps: number;
}
