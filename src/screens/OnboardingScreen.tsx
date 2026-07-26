import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import OnboardingLayout, { TitleSegment } from '../components/onboarding/OnboardingLayout';
import { BackNextButtons, PrimaryCta } from '../components/onboarding/OnboardingFooterButtons';
import {
  HeroPhoto,
  IconChipsRow,
  MacroDial,
  RobotFace,
  AIToolsList,
  ScanResultCard,
  TrophyGraphic,
  LeaderboardMini,
  FeedPostMini,
  GroupCard,
  MarketplaceIllustration,
  RewardsIllustration,
  InviteIllustration,
  ShieldGraphic,
} from '../components/onboarding/illustrations';
import type { RootStackParamList } from '../navigation/types';

type Slide = {
  title: TitleSegment[];
  subtitle: string;
  illustration: React.ReactNode;
};

const SLIDES: Slide[] = [
  {
    title: [{ text: 'Track. Compete.\n' }, { text: 'Win Together.', highlighted: true }],
    subtitle:
      'The social calorie tracker built for teams, challenges, and real accountability.',
    illustration: <HeroPhoto uri="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80" height={230} />,
  },
  {
    title: [{ text: "You're " }, { text: 'Stronger', highlighted: true }, { text: '\nTogether.' }],
    subtitle: 'Join friends, create teams, share goals, and keep each other accountable every day.',
    illustration: (
      <>
        <HeroPhoto uri="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80" height={170} />
        <IconChipsRow
          items={[
            { icon: 'people-outline', label: 'Team Goals' },
            { icon: 'heart-outline', label: 'Daily Support' },
            { icon: 'bar-chart-outline', label: 'Real Results' },
          ]}
        />
      </>
    ),
  },
  {
    title: [{ text: 'Track ' }, { text: 'More.\n', highlighted: true }, { text: 'Do More.' }],
    subtitle: 'Everything you need in one powerful app.',
    illustration: <MacroDial value="1,620" label="Calories Left" />,
  },
  {
    title: [{ text: 'Smart ' }, { text: 'AI.\n', highlighted: true }, { text: 'Real Results.' }],
    subtitle: 'Get personalized coaching, meal plans, grocery help, and smart food analysis.',
    illustration: (
      <>
        <RobotFace />
        <AIToolsList
          items={[
            { icon: 'chatbubble-outline', label: 'AI Nutrition Coach' },
            { icon: 'calendar-outline', label: 'AI Meal Planner' },
            { icon: 'scan-outline', label: 'AI Food Analyzer' },
            { icon: 'cart-outline', label: 'AI Grocery Assistant' },
            { icon: 'medkit-outline', label: 'AI Supplement Advisor' },
          ]}
        />
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
        you={{ rank: 8, name: 'You', points: '4,320 pts', avatar: 'https://i.pravatar.cc/150?img=12' }}
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
        caption="Meal prepped for the week! Consistency is the key. \u{1F4AA}"
        likes={128}
        comments={24}
      />
    ),
  },
  {
    title: [{ text: 'Build Your\n' }, { text: 'Dream Team.', highlighted: true }],
    subtitle: 'Create a group or join one. Invite friends and grow stronger together.',
    illustration: (
      <GroupCard
        members={[
          'https://i.pravatar.cc/150?img=13',
          'https://i.pravatar.cc/150?img=47',
          'https://i.pravatar.cc/150?img=45',
          'https://i.pravatar.cc/150?img=14',
        ]}
      />
    ),
  },
  {
    title: [{ text: 'Share ' }, { text: 'Wins.\n', highlighted: true }, { text: 'Inspire Others.' }],
    subtitle: 'Post updates, photos, meals, workouts and celebrate every milestone.',
    illustration: (
      <FeedPostMini
        avatar="https://i.pravatar.cc/150?img=13"
        name="Jason"
        time="1h ago"
        photo="https://images.unsplash.com/photo-1594381898411-846e7d193883?w=600&q=80"
        caption="Down 5 lbs this month! Discipline pays off. \u{1F4AA}"
        likes={136}
        comments={32}
      />
    ),
  },
  {
    title: [{ text: 'Fuel Your ' }, { text: 'Goals.\n', highlighted: true }, { text: 'Shop Smart.' }],
    subtitle: 'Healthy meals, supplements, programs, gear and more.',
    illustration: (
      <MarketplaceIllustration
        categories={[
          { icon: 'restaurant-outline', label: 'Meals' },
          { icon: 'medkit-outline', label: 'Supplements' },
          { icon: 'list-outline', label: 'Programs' },
          { icon: 'barbell-outline', label: 'Equipment' },
          { icon: 'person-outline', label: 'Coaching' },
          { icon: 'book-outline', label: 'Ebooks' },
        ]}
      />
    ),
  },
  {
    title: [{ text: 'Earn ' }, { text: 'Points.\n', highlighted: true }, { text: 'Get Rewards.' }],
    subtitle: 'Complete challenges, refer friends, and unlock amazing rewards.',
    illustration: (
      <RewardsIllustration
        points="2,450"
        items={[
          { label: 'Daily Check-in', points: '+10' },
          { label: 'Log Meals', points: '+20' },
          { label: 'Invite a Friend', points: '+100' },
          { label: 'Win Challenge', points: '+250' },
        ]}
      />
    ),
  },
  {
    title: [{ text: 'Invite ' }, { text: 'Friends.\n', highlighted: true }, { text: 'Grow Your Team.' }],
    subtitle: 'More friends = stronger teams = bigger wins.',
    illustration: (
      <InviteIllustration
        photo="https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&q=80"
        code="TEAMCAL22"
      />
    ),
  },
  {
    title: [{ text: "You're " }, { text: 'All Set!', highlighted: true }],
    subtitle: "Let's build healthy habits, crush goals, and win together!",
    illustration: <ShieldGraphic />,
  },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const slide = SLIDES[index];
  const isFirst = index === 0;
  const isLast = index === SLIDES.length - 1;

  const finish = () => navigation.replace('Login');
  const goNext = () => (isLast ? finish() : setIndex((i) => i + 1));
  const goBack = () => setIndex((i) => Math.max(0, i - 1));

  let footer: React.ReactNode;
  if (isFirst) {
    footer = <PrimaryCta label="Let's Go!" onPress={goNext} caption="Skip for now" onPressCaption={finish} />;
  } else if (isLast) {
    footer = <PrimaryCta label="Start Your Journey" onPress={finish} />;
  } else {
    footer = <BackNextButtons onBack={goBack} onNext={goNext} />;
  }

  return (
    <OnboardingLayout
      step={index}
      total={SLIDES.length}
      showSkip={!isFirst && !isLast}
      onSkip={finish}
      title={slide.title}
      subtitle={slide.subtitle}
      illustration={slide.illustration}
      footer={footer}
    />
  );
}
