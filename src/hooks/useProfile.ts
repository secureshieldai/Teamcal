import { useApiQuery } from './useApiQuery';
import { earnService } from '../services/api/earn.service';
import { userService } from '../services/api/user.service';
import { useAuth } from '../context/AuthContext';
import { getLevelProgress } from '../data/levelsData';
import { apiClient } from '../services/api/client';

export type PointHistoryEntry = { label: string; points: number; date: string };
export type LevelData = {
  lifetimePoints: number;
  spendablePoints: number;
  activeDays: number;
  recentHistory: PointHistoryEntry[];
};

async function getLevelData(): Promise<LevelData> {
  try {
    const { data } = await apiClient.get<{ success: boolean; levelData: LevelData }>('/user/level');
    return data.levelData;
  } catch {
    return { lifetimePoints: 0, spendablePoints: 0, activeDays: 0, recentHistory: [] };
  }
}

export function useProfile() {
  const { user } = useAuth();
  const summary = useApiQuery(() => userService.getProfileSummary(), null, []);
  const levelQ = useApiQuery(getLevelData, { lifetimePoints: 0, spendablePoints: 0, activeDays: 0, recentHistory: [] }, []);

  const levelData = levelQ.data;
  const { current, next, pointsProgress } = getLevelProgress(
    levelData.lifetimePoints,
    levelData.activeDays,
  );

  const profileUser = {
    name: user?.name ?? '',
    handle: `@${user?.name?.toLowerCase().replace(/\s/g, '') ?? 'user'}`,
    avatar: user?.avatar ?? '',
    bio: user?.bio ?? '',
    isOwner: true,
    level: current.level,
    levelName: current.name,
    levelProgress: pointsProgress,
    lifetimePoints: levelData.lifetimePoints,
    nextLevelPoints: next?.pointsRequired ?? levelData.lifetimePoints,
    spendablePoints: levelData.spendablePoints,
  };

  const profileStats = [
    { label: 'Posts',     value: (summary.data?.posts     ?? 0).toLocaleString() },
    { label: 'Following', value: (summary.data?.following ?? 0).toLocaleString() },
    { label: 'Followers', value: (summary.data?.followers ?? 0).toLocaleString() },
  ];

  const week = summary.data?.week;
  const weekStats = [
    {
      label: 'Calories',
      value: (week?.calories ?? 0).toLocaleString(),
      sub: `/${((user?.goal_kcal ?? 0) * 7).toLocaleString()} kcal`,
      percent: user?.goal_kcal ? Math.round((week?.calories ?? 0) / (user.goal_kcal * 7) * 100) : 0,
    },
    {
      label: 'Steps',
      value: (week?.steps ?? 0).toLocaleString(),
      sub: `/${((user?.goal_steps ?? 0) * 7).toLocaleString()}`,
      percent: user?.goal_steps ? Math.round((week?.steps ?? 0) / (user.goal_steps * 7) * 100) : 0,
    },
    {
      label: 'Workouts',
      value: (week?.workouts ?? 0).toString(),
      sub: 'this week',
      percent: Math.min(100, (week?.workouts ?? 0) * 20),
    },
  ];

  return { profileUser, profileStats, weekStats, levelData, loading: summary.loading || levelQ.loading };
}

export function useRewards() {
  const earn = useApiQuery(() => earnService.getEntries(), null, []);
  const iconFor = (source: string): any =>
    source === 'workout' ? 'barbell-outline' :
    source === 'meal-log' ? 'restaurant-outline' :
    source === 'challenge' ? 'trophy-outline' :
    source === 'referral' ? 'person-add-outline' : 'star-outline';

  const rewardsList = (earn.data?.entries ?? []).map((e) => ({
    id: e.id,
    icon: iconFor(e.source),
    label: e.label,
    points: `+${e.amount}`,
    done: true,
  }));

  return {
    rewardsPoints: (earn.data?.total ?? 0).toLocaleString(),
    rewardsList,
    loading: earn.loading,
  };
}

export function useInvite() {
  const { user } = useAuth();
  const referralCode = user?.referral_code ?? '';
  const referralLink = `https://teamcal.app/join?ref=${referralCode}`;
  return { inviteCode: referralCode, referralLink, loading: false };
}
