import type { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

// Educational content describing the commonly-cited physiological effects of
// fasting at each stage — not a real-time biometric reading from the user's
// body. Mirrors the plain-English, non-clinical framing already used for
// METABOLIC_STAGES in fastingData.ts, just expanded into per-marker detail.

export type StageId = 'fed' | 'fat-burning' | 'ketosis' | 'autophagy';

export const STAGE_STYLES: Record<StageId, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  fed: { icon: 'water-outline', color: '#B9773A', bg: '#FDECC8' },
  'fat-burning': { icon: 'flame', color: colors.primary, bg: '#FFEDE3' },
  ketosis: { icon: 'flash', color: '#8B5CF6', bg: '#EDE9FE' },
  autophagy: { icon: 'leaf-outline', color: '#276B54', bg: '#E4F2EC' },
};

export interface StageSummary {
  headline: string;
  activeBlurb: string;
  blazeInsight: string;
}

export const STAGE_SUMMARY: Record<StageId, StageSummary> = {
  fed: {
    headline: 'Fed',
    activeBlurb: "Digesting your last meal. Insulin is elevated and you're running on glucose.",
    blazeInsight: "You're just getting started — insulin is still elevated from your last meal. Fat-burning kicks in around hour 12.",
  },
  'fat-burning': {
    headline: 'Fat Burning',
    activeBlurb: 'Glycogen is depleting and your body is switching over to fat for fuel.',
    blazeInsight: "Your body is shifting gears — glycogen is depleting and fat-burning is ramping up.",
  },
  ketosis: {
    headline: 'Ketosis',
    activeBlurb: 'Ketones are rising, bringing mental clarity and steady energy.',
    blazeInsight: "You're in ketosis — enjoy the steady energy and mental clarity while ketones do the work.",
  },
  autophagy: {
    headline: 'Autophagy',
    activeBlurb: "Cellular cleanup is active — your body's deepest metabolic reset.",
    blazeInsight: "You've reached autophagy — your body's deepest cellular repair window is active.",
  },
};

export type MarkerId = 'insulin' | 'glycogen' | 'ketones' | 'mentalClarity' | 'autophagyMarker' | 'hgh' | 'inflammation';

export interface MarkerMeta {
  id: MarkerId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
}

export const MARKERS: MarkerMeta[] = [
  { id: 'insulin', label: 'Insulin', icon: 'water-outline', color: '#3E7BFA', bg: '#E3F0FD' },
  { id: 'glycogen', label: 'Glycogen', icon: 'flame', color: colors.primary, bg: '#FFEDE3' },
  { id: 'ketones', label: 'Ketones (BHB)', icon: 'flash', color: '#8B5CF6', bg: '#EDE9FE' },
  { id: 'mentalClarity', label: 'Mental Clarity (BDNF)', icon: 'bulb-outline', color: colors.success, bg: '#DCFCE7' },
  { id: 'autophagyMarker', label: 'Autophagy', icon: 'leaf-outline', color: '#276B54', bg: '#E4F2EC' },
  { id: 'hgh', label: 'HGH (Growth Hormone)', icon: 'heart', color: '#E0554F', bg: '#FDE3E3' },
  { id: 'inflammation', label: 'Inflammation', icon: 'thermometer-outline', color: '#B9773A', bg: '#F1E5D3' },
];

export interface MarkerStageContent {
  value: string;
  whatItIs: string;
  whyItMatters: string;
  meansNow: string;
  expectNext: string;
}

export const MARKER_CONTENT: Record<MarkerId, Record<StageId, MarkerStageContent>> = {
  insulin: {
    fed: {
      value: 'Elevated — storing energy',
      whatItIs: 'The hormone that tells your body to store energy after you eat.',
      whyItMatters: 'Low insulin unlocks stored fat as fuel and improves insulin sensitivity long-term.',
      meansNow: "Your body is still processing the last meal.",
      expectNext: 'Insulin will start dropping around hour 4–6.',
    },
    'fat-burning': {
      value: 'Falling — glycogen depleting',
      whatItIs: 'The hormone that tells your body to store energy after you eat.',
      whyItMatters: 'As insulin drops, fat cells release stored fat for your body to burn as fuel.',
      meansNow: "Your body is shifting away from food energy and toward stored fat.",
      expectNext: 'Insulin keeps falling as ketone production ramps up around hour 16.',
    },
    ketosis: {
      value: 'Low — fat oxidation active',
      whatItIs: 'The hormone that tells your body to store energy after you eat.',
      whyItMatters: 'Sustained low insulin is what allows fat-burning and ketone production to continue uninterrupted.',
      meansNow: 'Fat is now your primary fuel source, and insulin sensitivity is improving.',
      expectNext: 'Levels stay low as autophagy begins ramping up around hour 20.',
    },
    autophagy: {
      value: 'Very low — maximal fat access',
      whatItIs: 'The hormone that tells your body to store energy after you eat.',
      whyItMatters: 'Rock-bottom insulin gives cellular repair processes room to activate.',
      meansNow: "Your body has near-unrestricted access to fat stores for fuel.",
      expectNext: 'Levels stay low until your next meal, when insulin rises again to signal refeeding.',
    },
  },
  glycogen: {
    fed: {
      value: 'Full stores (~400–500g)',
      whatItIs: 'The sugar stored in your liver and muscles — your quick-access fuel.',
      whyItMatters: 'Emptying glycogen forces your body to switch to fat and ketones for energy.',
      meansNow: 'You still have plenty of quick sugar to burn.',
      expectNext: 'Around hour 12 the liver will start running low.',
    },
    'fat-burning': {
      value: 'Depleting — switching to fat',
      whatItIs: 'The sugar stored in your liver and muscles — your quick-access fuel.',
      whyItMatters: 'Emptying glycogen forces your body to switch to fat and ketones for energy.',
      meansNow: "The liver's reserves are running low and fat is taking over as fuel.",
      expectNext: 'Stores are nearly gone by the time you reach ketosis, around hour 16.',
    },
    ketosis: {
      value: 'Mostly depleted',
      whatItIs: 'The sugar stored in your liver and muscles — your quick-access fuel.',
      whyItMatters: 'Emptying glycogen forces your body to switch to fat and ketones for energy.',
      meansNow: 'Your body has shifted to fat and ketones as its main fuel.',
      expectNext: 'Stores stay low until you eat again and replenish them.',
    },
    autophagy: {
      value: 'Reserves exhausted',
      whatItIs: 'The sugar stored in your liver and muscles — your quick-access fuel.',
      whyItMatters: 'Emptying glycogen forces your body to switch to fat and ketones for energy.',
      meansNow: "You're fully fat-adapted for this fast.",
      expectNext: 'Reserves rebuild once you break your fast and eat carbohydrates again.',
    },
  },
  ketones: {
    fed: {
      value: '< 0.3 mmol/L',
      whatItIs: 'Fuel your liver makes from fat once glycogen runs low.',
      whyItMatters: 'Ketones power the brain, calm inflammation, and drive fat loss.',
      meansNow: "Barely detectable — you're still using glucose.",
      expectNext: 'Ketones start climbing after hour 12.',
    },
    'fat-burning': {
      value: '0.3–0.5 mmol/L — rising',
      whatItIs: 'Fuel your liver makes from fat once glycogen runs low.',
      whyItMatters: 'Ketones power the brain, calm inflammation, and drive fat loss.',
      meansNow: 'Your liver has started converting fat into usable ketones.',
      expectNext: 'Ketones climb further into nutritional ketosis after hour 16.',
    },
    ketosis: {
      value: '0.5–3 mmol/L — nutritional ketosis',
      whatItIs: 'Fuel your liver makes from fat once glycogen runs low.',
      whyItMatters: 'Ketones power the brain, calm inflammation, and drive fat loss.',
      meansNow: "You're in nutritional ketosis — fat and ketones are powering most of your energy needs.",
      expectNext: 'Levels keep climbing the longer you fast, deepening ketosis.',
    },
    autophagy: {
      value: '1–5 mmol/L — deep ketosis',
      whatItIs: 'Fuel your liver makes from fat once glycogen runs low.',
      whyItMatters: 'Ketones power the brain, calm inflammation, and drive fat loss.',
      meansNow: "You're in deep ketosis, with ketones covering a large share of your brain's energy needs.",
      expectNext: 'Levels stay elevated until you eat again, when insulin signals a return to glucose burning.',
    },
  },
  mentalClarity: {
    fed: {
      value: 'Normal',
      whatItIs: 'BDNF is a protein that helps your brain build new connections.',
      whyItMatters: 'Fasting raises BDNF, which supports focus, memory and mood.',
      meansNow: 'BDNF is at baseline levels.',
      expectNext: 'It starts rising after hour 12.',
    },
    'fat-burning': {
      value: 'Improving',
      whatItIs: 'BDNF is a protein that helps your brain build new connections.',
      whyItMatters: 'Fasting raises BDNF, which supports focus, memory and mood.',
      meansNow: 'You may start noticing steadier energy and fewer cravings.',
      expectNext: 'Clarity tends to sharpen further as ketones become a bigger part of your fuel mix.',
    },
    ketosis: {
      value: 'Elevated — steady energy',
      whatItIs: 'BDNF is a protein that helps your brain build new connections.',
      whyItMatters: 'Fasting raises BDNF, which supports focus, memory and mood.',
      meansNow: 'This is often when people report their sharpest focus during a fast.',
      expectNext: 'Clarity tends to hold steady as long as you remain in ketosis.',
    },
    autophagy: {
      value: 'Peak clarity',
      whatItIs: 'BDNF is a protein that helps your brain build new connections.',
      whyItMatters: 'Fasting raises BDNF, which supports focus, memory and mood.',
      meansNow: 'Combined with active autophagy, this is typically when mental clarity peaks.',
      expectNext: 'Levels gradually return to baseline within a day or so of breaking your fast.',
    },
  },
  autophagyMarker: {
    fed: {
      value: 'Baseline',
      whatItIs: "Your body's cellular cleanup — recycling old, damaged proteins.",
      whyItMatters: 'Autophagy is linked to longevity, better immunity and less inflammation.',
      meansNow: 'Cellular cleanup is running at normal, low levels.',
      expectNext: 'Meaningful autophagy starts after hour 18.',
    },
    'fat-burning': {
      value: 'Priming',
      whatItIs: "Your body's cellular cleanup — recycling old, damaged proteins.",
      whyItMatters: 'Autophagy is linked to longevity, better immunity and less inflammation.',
      meansNow: 'Falling insulin is creating the right conditions for autophagy to ramp up.',
      expectNext: 'Meaningful autophagy starts after hour 18.',
    },
    ketosis: {
      value: 'Ramping up',
      whatItIs: "Your body's cellular cleanup — recycling old, damaged proteins.",
      whyItMatters: 'Autophagy is linked to longevity, better immunity and less inflammation.',
      meansNow: 'Cellular cleanup is picking up pace alongside deepening ketosis.',
      expectNext: 'Autophagy becomes most active once you pass hour 18–20.',
    },
    autophagy: {
      value: 'Active — cellular cleanup',
      whatItIs: "Your body's cellular cleanup — recycling old, damaged proteins.",
      whyItMatters: 'Autophagy is linked to longevity, better immunity and less inflammation.',
      meansNow: "You've reached the window where autophagy is most active.",
      expectNext: 'Activity continues as long as the fast does, then gradually resets after eating.',
    },
  },
  hgh: {
    fed: {
      value: 'Normal',
      whatItIs: 'Hormone that preserves muscle and helps repair tissue.',
      whyItMatters: 'Higher HGH spares lean mass while you burn fat.',
      meansNow: 'Small pulses throughout the day.',
      expectNext: 'HGH surges by ~24h of fasting.',
    },
    'fat-burning': {
      value: 'Rising',
      whatItIs: 'Hormone that preserves muscle and helps repair tissue.',
      whyItMatters: 'Higher HGH spares lean mass while you burn fat.',
      meansNow: 'Your body is releasing more HGH to help mobilize fat stores.',
      expectNext: 'HGH surges by ~24h of fasting.',
    },
    ketosis: {
      value: 'Significantly elevated',
      whatItIs: 'Hormone that preserves muscle and helps repair tissue.',
      whyItMatters: 'Higher HGH spares lean mass while you burn fat.',
      meansNow: "Elevated HGH is helping preserve lean muscle while you're in a fat-burning state.",
      expectNext: 'Levels keep climbing toward their peak by ~24h of fasting.',
    },
    autophagy: {
      value: 'Approaching peak — surges by ~24h',
      whatItIs: 'Hormone that preserves muscle and helps repair tissue.',
      whyItMatters: 'Higher HGH spares lean mass while you burn fat.',
      meansNow: 'HGH is climbing toward its fasting peak, supporting fat loss and muscle preservation.',
      expectNext: 'Levels stay elevated until you break your fast, then return to baseline.',
    },
  },
  inflammation: {
    fed: {
      value: 'Normal',
      whatItIs: 'Chronic inflammation drives most modern disease.',
      whyItMatters: 'Fasting lowers CRP and IL-6 — key inflammation markers.',
      meansNow: 'Inflammation markers are at your baseline.',
      expectNext: 'They start dropping after hour 16.',
    },
    'fat-burning': {
      value: 'Beginning to lower',
      whatItIs: 'Chronic inflammation drives most modern disease.',
      whyItMatters: 'Fasting lowers CRP and IL-6 — key inflammation markers.',
      meansNow: 'Your body is shifting away from digestion-related inflammatory signaling.',
      expectNext: 'They start dropping after hour 16.',
    },
    ketosis: {
      value: 'Reduced',
      whatItIs: 'Chronic inflammation drives most modern disease.',
      whyItMatters: 'Fasting lowers CRP and IL-6 — key inflammation markers.',
      meansNow: 'CRP and IL-6 are trending down as ketones take over as fuel.',
      expectNext: 'Levels stay lower the longer you remain in ketosis.',
    },
    autophagy: {
      value: 'Markedly reduced',
      whatItIs: 'Chronic inflammation drives most modern disease.',
      whyItMatters: 'Fasting lowers CRP and IL-6 — key inflammation markers.',
      meansNow: 'Combined with active autophagy, inflammation is at its lowest point of the fast.',
      expectNext: 'Levels gradually return to baseline after you eat again.',
    },
  },
};
