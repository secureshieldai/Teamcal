// Deterministic local caption generator for the composer's AI Assistant button.
// There is no real LLM call here — the deployed backend's Gemini coach endpoint
// isn't reliably configured in production (see WaterAITab/StepsAITab, which hit
// the same issue and were fixed the same way), so caption generation is a local
// template picker instead: the same topic + tone always produces the same caption.

export const CAPTION_TONES = ['Motivating', 'Funny', 'Informative', 'Casual'] as const;
export type CaptionTone = (typeof CAPTION_TONES)[number];

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const TEMPLATES: Record<CaptionTone, (topic: string) => string[]> = {
  Motivating: (topic) => [
    `Showed up for ${topic} today — one more step toward the goal. 💪`,
    `${topic} done. Small wins add up to big change.`,
    `Some days you don't feel like it. You do it anyway. ${topic} ✅`,
  ],
  Funny: (topic) => [
    `${topic} today. My body: "why." My brain: "because." 😂`,
    `Plot twist: I actually enjoyed ${topic}. Who am I becoming?`,
    `${topic} complete. Send snacks.`,
  ],
  Informative: (topic) => [
    `Quick update on ${topic} — sharing what's working for me lately.`,
    `Here's what I learned from ${topic} this week.`,
    `${topic}: a few notes for anyone else trying to stay consistent.`,
  ],
  Casual: (topic) => [
    `${topic} today, feeling good about it.`,
    `Just finished ${topic}. Onwards.`,
    `${topic} ✔️ back to the rest of the day.`,
  ],
};

export function generateCaption(topicInput: string, tone: CaptionTone): string {
  const topic = topicInput.trim() || 'today\'s progress';
  const options = TEMPLATES[tone](topic);
  const index = hashString(`${topic}|${tone}`) % options.length;
  return options[index];
}
