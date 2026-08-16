// Static catalog for the Live tab — no real streaming infrastructure exists
// (would need RTMP/WebRTC media servers), so this represents "who's live" as
// placeholder catalog content. Bookmarking a stream is still real (personalService).

export interface LiveStream {
  id: string;
  thumbnail: string;
  title: string;
  creatorName: string;
  category: string;
  viewerCount: number;
}

// Live streams are intentionally empty until a streaming API is available.
export const LIVE_STREAMS: LiveStream[] = [];
