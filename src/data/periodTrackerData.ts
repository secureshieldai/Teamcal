import type { IconName } from '../screens/periodTracker/shared';
import { colors } from '../theme';

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

export const PHASE_INFO: Record<CyclePhase, { label: string; vibe: string; color: string; bgFrom: string }> = {
  menstrual: { label: 'Menstrual phase', vibe: 'Low energy. Rest and recover.', color: '#E85D75', bgFrom: '#FFE4EA' },
  follicular: { label: 'Follicular phase', vibe: 'Rising energy. Great for new starts.', color: '#FF9F5A', bgFrom: '#FFF3E0' },
  ovulatory: { label: 'Ovulatory phase', vibe: 'Peak vitality. Social & high-intensity.', color: colors.primary, bgFrom: '#FFE9D6' },
  luteal: { label: 'Luteal phase', vibe: 'Winding down. Prioritize comfort & sleep.', color: '#8B7FD1', bgFrom: '#EDE9FE' },
};

export const FLOW_OPTIONS = ['Spotting', 'Light', 'Medium', 'Heavy'];
export const MUCUS_OPTIONS = ['Dry', 'Sticky', 'Creamy', 'Watery', 'Egg-white'];
export const SYMPTOM_OPTIONS = ['Cramps', 'Bloating', 'Headache', 'Fatigue', 'Acne', 'Tender breasts', 'Nausea', 'Backache', 'Insomnia', 'Cravings'];
export const MOOD_OPTIONS: { label: string; emoji: string }[] = [
  { label: 'Happy', emoji: '😊' },
  { label: 'Calm', emoji: '😌' },
  { label: 'Meh', emoji: '😐' },
  { label: 'Low', emoji: '😔' },
  { label: 'Angry', emoji: '😤' },
  { label: 'Anxious', emoji: '😰' },
  { label: 'Sensitive', emoji: '🥺' },
  { label: 'Confident', emoji: '🔥' },
];
export const INTIMACY_OPTIONS = ['Protected', 'Unprotected', 'None'];

export const TODAY_TIPS: Record<CyclePhase, string[]> = {
  menstrual: ['Drink extra water and prioritize iron-rich foods', 'Gentle movement — walking or stretching', 'Track flow & symptoms in the Log tab'],
  follicular: ['Energy is rising — good day to plan ahead', 'Great window for strength training', 'Track BBT & mood in the Log tab'],
  ovulatory: ['Drink 500ml warm water on waking', 'Great day for a hard workout', 'Track BBT & mood in the Log tab'],
  luteal: ['Cravings may rise — plan balanced snacks', 'Favor lower-intensity training', 'Track symptoms & mood in the Log tab'],
};

export const FASTING_TIPS: Record<CyclePhase, string> = {
  menstrual: 'Keep fasts short (12-14h) or skip entirely — this is a recovery week. Prioritize iron-rich, warming meals when you do eat.',
  follicular: '14-16h fasts feel comfortable as energy rises. A good window to experiment with slightly longer fasts.',
  ovulatory: '16-18h fasts feel effortless. Peak energy handles HIIT while fasted — eat within an hour of hard training to protect hormones.',
  luteal: '12-14h fasts are gentler as metabolism rises. Don’t push long fasts — honor increased hunger and prioritize protein.',
};

export const COACH_TIPS: Record<CyclePhase, { icon: IconName; title: string; description: string }[]> = {
  menstrual: [
    { icon: 'sparkles', title: 'Menstrual phase nutrition', description: 'Prioritize iron (spinach, lentils) and warming foods.' },
    { icon: 'sparkles', title: 'Gentle training', description: 'Favor walking, yoga, or light mobility work.' },
    { icon: 'sparkles', title: 'Extra rest', description: 'Aim for 30-60 minutes more sleep than usual this week.' },
    { icon: 'sparkles', title: 'Cycle sync your calendar', description: 'Keep this week lighter on your schedule where you can.' },
  ],
  follicular: [
    { icon: 'sparkles', title: 'Follicular phase nutrition', description: 'Lean protein and fresh produce support rising energy.' },
    { icon: 'sparkles', title: 'Optimal training', description: 'Great window to push strength training and new PRs.' },
    { icon: 'sparkles', title: 'Sleep stays steady', description: 'Keep a consistent bedtime as energy builds.' },
    { icon: 'sparkles', title: 'Cycle sync your calendar', description: 'Good week for planning, kickoffs, and new projects.' },
  ],
  ovulatory: [
    { icon: 'sparkles', title: 'Ovulatory phase nutrition', description: 'Fiber-rich veggies support hormone clearance this week.' },
    { icon: 'sparkles', title: 'Optimal training', description: 'Choose high-intensity work — energy peaks here.' },
    { icon: 'sparkles', title: 'Sleep prep', description: 'Body temp rises slightly — keep the room cool.' },
    { icon: 'sparkles', title: 'Cycle sync your calendar', description: 'Batch social meetings and high-stakes conversations now.' },
  ],
  luteal: [
    { icon: 'sparkles', title: 'Luteal phase nutrition', description: 'Complex carbs and magnesium help ease cravings.' },
    { icon: 'sparkles', title: 'Optimal training', description: 'Choose Zone 2 cardio and mobility work.' },
    { icon: 'sparkles', title: 'Sleep prep', description: 'Cool the room to 18°C — luteal phase raises core temp by 0.3°C.' },
    { icon: 'sparkles', title: 'Cycle sync your calendar', description: 'Batch social meetings in ovulatory, deep work in luteal.' },
  ],
};
