import { Injectable } from "@nestjs/common";
import { filter, map, Observable, Subject } from "rxjs";

import type { WorkspaceRealtimeEvent } from "./workspaceEvents.js";

type ServerSentWorkspaceEvent = {
  id: string;
  type: string;
  data: WorkspaceRealtimeEvent;
};

@Injectable()
export class WorkspaceRealtimeService {
  private readonly events = new Subject<ServerSentWorkspaceEvent>();

  emit(event: WorkspaceRealtimeEvent) {
    this.events.next({
      id: `${Date.now()}:${event.workspaceId}:${event.type}`,
      type: event.type,
      data: event,
    });
  }

  stream(workspaceId: string): Observable<ServerSentWorkspaceEvent> {
    return this.events.asObservable().pipe(
      filter((event) => event.data.workspaceId === workspaceId),
      map((event) => event),
    );
  }
}
