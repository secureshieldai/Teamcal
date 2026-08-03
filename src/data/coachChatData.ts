export const coachProfile = {
  name: 'TeamCal Coach',
  online: true,
  role: 'TeamCal AI Coach',
  tagline: 'Helping you hit your goals!',
};

export type ChatMessage =
  | { id: string; kind: 'text'; fromMe: boolean; text: string; time: string; seen?: boolean }
  | { id: string; kind: 'voice'; duration: string; time: string }
  | { id: string; kind: 'progress'; time: string };

export const messages: ChatMessage[] = [
  { id: 'm1', kind: 'text', fromMe: false, text: "Hey Sarah! \u{1F44B} How's your day going? Let me know if you need anything.", time: '9:30 AM' },
  { id: 'm2', kind: 'text', fromMe: true, text: 'Hi Coach! Good morning \u{1F60A} I wanted to check if my calories look good for today.', time: '9:31 AM', seen: true },
  { id: 'm3', kind: 'text', fromMe: false, text: 'Sure, send me a screenshot of your progress.', time: '9:31 AM' },
  { id: 'm4', kind: 'voice', duration: '0:18', time: '9:32 AM' },
  { id: 'm5', kind: 'progress', time: '9:32 AM' },
  { id: 'm6', kind: 'text', fromMe: false, text: "Looks great! \u{1F389} Let's add a little more protein to dinner. You're doing amazing!", time: '9:34 AM' },
];
