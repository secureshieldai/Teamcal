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

// ─── Daily Cycle Prediction page (18.D) ────────────────────────────────────────

export type DailyTip = { icon: IconName; title: string; subtitle: string };

export const DAILY_TIPS: Record<CyclePhase, DailyTip[]> = {
  menstrual: [
    { icon: 'restaurant-outline', title: 'Prioritize iron-rich foods', subtitle: 'Spinach, lentils, red meat or beans.' },
    { icon: 'cafe-outline', title: 'Ease off caffeine and salt', subtitle: 'This may help with cramping and bloating.' },
    { icon: 'water-outline', title: 'Hydrate a little extra', subtitle: 'Extra water may ease bloating and headaches.' },
    { icon: 'walk-outline', title: 'Keep movement gentle', subtitle: 'Try walking or light stretching today.' },
    { icon: 'time-outline', title: 'Shorten or skip fasting', subtitle: 'A 12–14 hour fast, or none at all, may feel better.' },
  ],
  follicular: [
    { icon: 'restaurant-outline', title: 'Add lean protein & produce', subtitle: 'Supports your rising energy this week.' },
    { icon: 'checkmark-circle-outline', title: 'Little to limit today', subtitle: 'Usually a comfortable, low-symptom window.' },
    { icon: 'water-outline', title: 'Stay normally hydrated', subtitle: 'Keep water nearby during workouts.' },
    { icon: 'barbell-outline', title: 'Try strength training', subtitle: 'A great window to push harder or try something new.' },
    { icon: 'time-outline', title: 'Stretch your fasting window', subtitle: '14–16 hour fasts often feel comfortable now.' },
  ],
  ovulatory: [
    { icon: 'leaf-outline', title: 'Add fibre-rich vegetables', subtitle: 'May support hormone clearance around ovulation.' },
    { icon: 'information-circle-outline', title: 'Mild bloating is common', subtitle: 'Twinges near ovulation are usually nothing to worry about.' },
    { icon: 'water-outline', title: 'Try 500ml of water on waking', subtitle: 'Many feel their best hydrated early today.' },
    { icon: 'flash-outline', title: 'Go for a harder workout', subtitle: 'Energy often peaks now, if you feel up to it.' },
    { icon: 'time-outline', title: 'Fasting can feel effortless', subtitle: '16–18 hour fasts suit some people well today.' },
  ],
  luteal: [
    { icon: 'restaurant-outline', title: 'Choose magnesium-rich foods', subtitle: 'Spinach, avocado, nuts or beans.' },
    { icon: 'cafe-outline', title: 'Go easy on salt and caffeine', subtitle: 'This may help with bloating and sleep.' },
    { icon: 'water-outline', title: 'Hydrate steadily', subtitle: 'Keep water nearby throughout the day.' },
    { icon: 'body-outline', title: 'Choose gentle movement', subtitle: 'Try a walk, stretching or light yoga.' },
    { icon: 'time-outline', title: 'Keep fasting flexible', subtitle: 'Choose a shorter 12–14 hour fast, or skip it if your energy feels low.' },
  ],
};

export const PHASE_FEELING: Record<CyclePhase, { mood: string; energy: string; body: string }> = {
  menstrual: {
    mood: 'You may feel more introspective or low-energy than usual. Extra patience and rest may feel supportive.',
    energy: 'Energy is often at its lowest during this phase. Plan lighter tasks and prioritize recovery where possible.',
    body: 'Cramps, fatigue or lower back pain may occur. Symptoms vary from person to person.',
  },
  follicular: {
    mood: 'You may feel more optimistic and motivated as this phase progresses.',
    energy: 'Energy tends to rise steadily through this phase — a good time to plan ahead.',
    body: 'Skin may feel clearer and focus sharper. Symptoms vary from person to person.',
  },
  ovulatory: {
    mood: 'You may feel more confident, social and outgoing around ovulation.',
    energy: 'Energy often peaks now — many feel their most capable today.',
    body: 'Mild twinges, slight bloating or increased libido may occur. Symptoms vary from person to person.',
  },
  luteal: {
    mood: 'You may feel more reflective or emotionally sensitive than usual. A quieter pace and extra patience may feel supportive.',
    energy: 'Energy may be moderate and gradually soften as your next period approaches. Plan lighter tasks where possible.',
    body: 'Cravings, mild bloating or breast tenderness may occur. Symptoms vary from person to person.',
  },
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
