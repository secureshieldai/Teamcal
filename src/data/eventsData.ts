// Static catalog for the Events tab — no backend exists for scheduled events
// yet. Register/Remind toggles are still real (personalService).

export interface CommunityEvent {
  id: string;
  thumbnail: string;
  title: string;
  hostName: string;
  dateLabel: string;
  goingCount: number;
  description: string;
}

// Events are intentionally empty until an events API is available.
export const EVENTS: CommunityEvent[] = [];
