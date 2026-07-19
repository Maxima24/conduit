import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import type { Observable } from 'rxjs';
import type { StreamEvent } from '@conduit/contracts';

/**
 * In-memory broadcast bus. Feature services (delivery, reconciler, webhooks) call
 * `publish()` on any state change; the SSE controller relays it to connected clients.
 * Deliberately dumb — the client just refetches on receipt.
 */
@Injectable()
export class StreamService {
  private readonly events$ = new Subject<StreamEvent>();

  publish(event: StreamEvent): void {
    this.events$.next(event);
  }

  asObservable(): Observable<StreamEvent> {
    return this.events$.asObservable();
  }
}
