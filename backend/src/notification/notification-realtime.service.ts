import { Injectable } from "@nestjs/common";
import { filter, map, Observable, Subject } from "rxjs";

type NotificationRealtimeEvent = {
  id: string;
  type: "notifications_changed";
  data: { userId: string };
};

@Injectable()
export class NotificationRealtimeService {
  private readonly events = new Subject<NotificationRealtimeEvent>();

  emit(userId: string) {
    this.events.next({
      id: `${Date.now()}:${userId}:notifications_changed`,
      type: "notifications_changed",
      data: { userId },
    });
  }

  stream(userId: string): Observable<NotificationRealtimeEvent> {
    return this.events.asObservable().pipe(
      filter((event) => event.data.userId === userId),
      map((event) => event),
    );
  }
}
