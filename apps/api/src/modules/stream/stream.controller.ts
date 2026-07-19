import { Controller, Sse } from '@nestjs/common';
import { interval, map, merge, type Observable } from 'rxjs';
import { STREAM_HEARTBEAT_MS, type StreamEvent } from '@conduit/contracts';
import { StreamService } from './stream.service';

interface SseMessage {
  data: string;
}

@Controller('stream')
export class StreamController {
  constructor(private readonly stream: StreamService) {}

  @Sse()
  subscribe(): Observable<SseMessage> {
    const heartbeat$ = interval(STREAM_HEARTBEAT_MS).pipe(
      map((): StreamEvent => ({ kind: 'heartbeat', at: new Date().toISOString() })),
    );
    return merge(this.stream.asObservable(), heartbeat$).pipe(
      map((event) => ({ data: JSON.stringify(event) })),
    );
  }
}
