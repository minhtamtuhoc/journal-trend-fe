import { queryKeys } from "@/services/query-keys";
import { useQueryClient } from "@tanstack/react-query";

export class NotificationsStreamService {
  private subscribers: Set<(event: unknown) => void> = new Set();
  private sseConnection: EventSource | null = null;

  /**
   * Subscribe to real-time notification stream events.
   * This is an architecture placeholder for future SSE/WebSocket implementation.
   */
  subscribe(callback: (event: unknown) => void): () => void {
    this.subscribers.add(callback);
    console.log("Subscribed to notifications stream. Active subscribers:", this.subscribers.size);

    // Return an unsubscribe function
    return () => {
      this.unsubscribe(callback);
    };
  }

  /**
   * Unsubscribe a listener from the stream.
   */
  unsubscribe(callback: (event: unknown) => void): void {
    this.subscribers.delete(callback);
    console.log("Unsubscribed from notifications stream. Active subscribers:", this.subscribers.size);
  }

  /**
   * Triggers query cache invalidation to pull fresh data.
   * Can be called when a new real-time push message arrives.
   */
  invalidateNotifications(queryClient: ReturnType<typeof useQueryClient>): void {
    console.log("Real-time stream triggered notifications query invalidation.");
    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
  }
}

export const notificationsStreamService = new NotificationsStreamService();
