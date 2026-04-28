"use strict";

import { DomainEvent } from "./DomainEvent";
import { Notification } from "../entities/Notification";

export class NotificationSentEvent implements DomainEvent {
  readonly type = 'NOTIFICATION_SENT';
  readonly timestamp = new Date();
  readonly payload: Record<string, any>;

  constructor(public readonly notification: Notification) {
    this.payload = {
      notificationId: notification.id,
      userId: notification.userId,
      title: notification.title
    };
  }
}