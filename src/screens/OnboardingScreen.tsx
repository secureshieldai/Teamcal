import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import OnboardingLayout, { TitleSegment } from '../components/onboarding/OnboardingLayout';
import { BackNextButtons, PrimaryCta } from '../components/onboarding/OnboardingFooterButtons';
import { PlanSelector, PaymentDetailsForm } from '../components/onboarding/PlanPaymentCard';
import {
  HeroPhoto,
  IconChipsRow,
  CalorieRing,
  AIGrid,
  RobotFace,
  AIToolsList,
  ScanResultCard,
  TrophyGraphic,
  LeaderboardMini,
  FeedPostMini,
  JourneyPhoto,
  FeatureChecklist,
  GiftBoxGraphic,
  BellGraphic,
  AllSetCheck,
} from '../components/onboarding/illustrations';
import { colors, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

const AI_TOOLS = [
  { icon: 'chatbubble-outline' as const, label: 'AI Nutrition Coach' },
  { icon: 'calendar-outline' as const, label: 'AI Meal Planner' },
  { icon: 'scan-outline' as const, label: 'AI Food Analyzer' },
  { icon: 'cart-outline' as const, label: 'AI Grocery Assistant' },
  { icon: 'medkit-outline' as const, label: 'AI Supplement Advisor' },
];

type Slide = {
  title: TitleSegment[];
  subtitle: string;
  illustration: React.ReactNode;
};

const SLIDES: Slide[] = [
  {
    title: [{ text: 'Track. Compete.\n' }, { text: 'Win Together.', highlighted: true }],
    subtitle: 'The social calorie tracker built for teams, challenges, and real accountability.',
    illustration: <HeroPhoto uri="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80" height={230} />,
  },
  {
    title: [{ text: 'Track ' }, { text: 'More.\n', highlighted: true }, { text: 'Do More.' }],
    subtitle: 'Everything you need in one powerful app.',
    illustration: (
      <IconChipsRow
        items={[
          { icon: 'flame-outline', label: 'Macros' },
          { icon: 'water-outline', label: 'Water' },
          { icon: 'moon-outline', label: 'Fasting' },
          { icon: 'scale-outline', label: 'Weight' },
          { icon: 'restaurant-outline', label: 'Meals' },
          { icon: 'bed-outline', label: 'Sleep' },
        ]}
      />
    ),
  },
  {
    title: [{ text: 'Smart ' }, { text: 'AI.\n', highlighted: true }, { text: 'Real Results.' }],
    subtitle: 'Get personalized coaching, meal plans, grocery help, and smart food analysis.',
    illustration: (
      <>
        <CalorieRing value="1,620" label="Calories Left" />
        <AIGrid items={AI_TOOLS} />
      </>
    ),
  },
  {
    title: [{ text: 'Your ' }, { text: 'AI Team.\n', highlighted: true }, { text: 'Always On.' }],
    subtitle: 'Five AI specialists working around the clock to help you win.',
    illustration: (
      <>
        <RobotFace />
        <AIToolsList items={AI_TOOLS} />
      </>
    ),
  },
  {
    title: [{ text: 'Scan ' }, { text: 'Anything.\n', highlighted: true }, { text: 'Log Instantly.' }],
    subtitle: 'Scan food, barcodes or menus. AI does the rest.',
    illustration: (
      <ScanResultCard
        uri="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80"
        title="Grilled Chicken Salad"
        kcal={420}
        macros="P 38g   C 31g   F 16g"
      />
    ),
  },
  {
    title: [{ text: 'Challenges ' }, { text: 'That\n', highlighted: true }, { text: 'Make You Better.' }],
    subtitle: 'Join fun challenges, crush goals, earn rewards, and climb the leaderboards.',
    illustration: (
      <TrophyGraphic
        stats={[
          { label: 'Day Streak', value: '12' },
          { label: 'Points', value: '2,450' },
          { label: 'Badges', value: '24' },
        ]}
      />
    ),
  },
  {
    title: [{ text: 'Compete. ' }, { text: 'Climb.\n', highlighted: true }, { text: 'Celebrate.' }],
    subtitle: 'See how you rank, support your team, and celebrate every win together.',
    illustration: (
      <LeaderboardMini
        entries={[
          { rank: 1, name: 'Power Squad', points: '12,450 pts', avatar: 'https://i.pravatar.cc/150?img=32' },
          { rank: 2, name: 'Fit Fam', points: '9,860 pts', avatar: 'https://i.pravatar.cc/150?img=15' },
          { rank: 3, name: 'Hustle Crew', points: '8,210 pts', avatar: 'https://i.pravatar.cc/150?img=51' },
        ]}
        you={{ rank: 4, name: 'You', points: '4,320 pts', avatar: 'https://i.pravatar.cc/150?img=12' }}
      />
    ),
  },
  {
    title: [{ text: 'Your ' }, { text: 'Community.\n', highlighted: true }, { text: 'Your Motivation.' }],
    subtitle: 'Stay inspired with posts, updates, tips, and wins from your team and the community.',
    illustration: (
      <FeedPostMini
        avatar="https://i.pravatar.cc/150?img=47"
        name="Lena"
        time="2h ago"
        photo="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80"
        caption={'Meal prepared for the week! Consistency is the key. \u{1F4AA}\u{1F957}'}
        likes={128}
        comments={24}
      />
    ),
  },
  {
    title: [{ text: 'Imagine Where\n' }, { text: "You'll Be\n" }, { text: '30 Days From Now.', highlighted: true }],
    subtitle: 'A few minutes each day can build healthier habits, stronger accountability, and lasting results.',
    illustration: (
      <JourneyPhoto uri="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=80" height={230} />
    ),
  },
  {
    title: [{ text: 'Everything ' }, { text: 'You Get', highlighted: true }],
    subtitle: 'All the tools you need to succeed — even as a beginner.',
    illustration: (
      <FeatureChecklist
        badge="Even as a Beginner!"
        items={[
          { icon: 'scan-outline', label: 'Food Scanner' },
          { icon: 'flame-outline', label: 'Calories & Macros' },
          { icon: 'water-outline', label: 'Water Tracker' },
          { icon: 'scale-outline', label: 'Weight Tracker' },
          { icon: 'moon-outline', label: 'Sleep Tracker' },
          { icon: 'calendar-outline', label: 'Meals Planner' },
          { icon: 'timer-outline', label: 'Fasting' },
          { icon: 'shield-checkmark-outline', label: 'Accountability' },
          { icon: 'people-outline', label: 'Socials' },
          { icon: 'newspaper-outline', label: 'Earn with Blogs' },
          { icon: 'ribbon-outline', label: 'Earn with Memberships' },
          { icon: 'videocam-outline', label: 'Earn with Video & PDF' },
        ]}
      />
    ),
  },
  {
    title: [{ text: 'We want you to try ' }, { text: 'TeamCal', highlighted: true }, { text: ' for free.' }],
    subtitle: 'Enjoy all premium features with a 3-day free trial.',
    illustration: <GiftBoxGraphic />,
  },
  {
    title: [
      { text: "We'll send you a " },
      { text: 'notification', highlighted: true },
      { text: ' a day before so you won’t miss out.' },
    ],
    subtitle: 'Cancel anytime before the trial ends, no charge.',
    illustration: <BellGraphic />,
  },
];

const LAST_SLIDE: Slide = {
  title: [{ text: "You're " }, { text: 'All Set!', highlighted: true }],
  subtitle: "Let's build healthy habits, crush goals, and win together!",
  illustration: <AllSetCheck />,
};

const PLAN_STEP_INDEX = SLIDES.length; // 12
const LAST_STEP_INDEX = SLIDES.length + 1; // 13
const TOTAL_STEPS = SLIDES.length + 2; // 14

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const finish = () => navigation.replace('Login');
  const goNext = () => setIndex((i) => Math.min(TOTAL_STEPS - 1, i + 1));
  const goBack = () => setIndex((i) => Math.max(0, i - 1));

  if (index === PLAN_STEP_INDEX) {
    return (
      <SafeAreaView style={styles.planSafeArea} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <ScrollView contentContainerStyle={styles.planScrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.planTitle}>Choose Your Plan</Text>
          <Text style={styles.planSubtitle}>Start your 3-day free trial</Text>
          <PlanSelector />
          <PaymentDetailsForm />
        </ScrollView>
        <View style={styles.planFooter}>
          <PrimaryCta
            label="Start Free Trial"
            onPress={goNext}
            caption="You won't be charged until your trial ends. Cancel anytime."
          />
        </View>
      </SafeAreaView>
    );
  }

  if (index === LAST_STEP_INDEX) {
    return (
      <OnboardingLayout
        title={LAST_SLIDE.title}
        subtitle={LAST_SLIDE.subtitle}
        illustration={LAST_SLIDE.illustration}
        footer={<PrimaryCta label="Start Your Journey" onPress={finish} />}
      />
    );
  }

  const slide = SLIDES[index];
  const isFirst = index === 0;
  const isPaywallIntro = index === SLIDES.length - 2 || index === SLIDES.length - 1;

  let footer: React.ReactNode;
  if (isFirst) {
    footer = <PrimaryCta label="Let's Go!" onPress={goNext} />;
  } else if (isPaywallIntro) {
    footer = <PrimaryCta label="Next" onPress={goNext} />;
  } else {
    footer = <BackNextButtons onBack={goBack} onNext={goNext} />;
  }

  return (
    <OnboardingLayout
      title={slide.title}
      subtitle={slide.subtitle}
      illustration={slide.illustration}
      footer={footer}
    />
  );
}

const styles = StyleSheet.create({
  planSafeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  planScrollContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  planTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  planSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  planFooter: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
});
