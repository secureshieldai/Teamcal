// ── Auth ─────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  bio: string;
  avatar: string | null;
  dm_enabled?: boolean;
  level: number;
  xp: number;
  coins: number;
  referral_code: string;
  goal_kcal: number;
  goal_protein_g: number;
  goal_carbs_g: number;
  goal_fats_g: number;
  goal_water_ml: number;
  goal_steps: number;
  goal_fast_hours: number;
  goal_sleep_hours: number;
  goal_weight_kg: number;
  goal_focus_areas: string[];
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface RegistrationResponse {
  success: boolean;
  verificationToken: string;
  message: string;
}

// ── Tracker ───────────────────────────────────────────────────────────
export interface TrackerEntry {
  id: string;
  tracker: string;
  ts: number;
  value: number;
  meta: Record<string, unknown>;
}

export interface TodaySummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  steps: number;
  workouts: number;
}

// ── Challenges ────────────────────────────────────────────────────────
export interface Challenge {
  id: string;
  title: string;
  description: string;
  photo: string | null;
  icon: string;
  icon_color: string;
  duration_days: number;
  total_days: number;
  joined_count: number;
  is_featured: boolean;
  is_public: boolean;
  status: 'active' | 'completed' | 'archived';
  starts_at: number | null;
  ends_at: number | null;
  current_day?: number;
  challenge_type: string;
  goal_target: number | null;
  goal_unit: string | null;
  max_participants: number | null;
  rules: string | null;
  creator_name?: string | null;
}

export interface ChallengeMembership {
  current_day: number;
  completed: boolean;
  joined_at: string;
}

export interface ChallengeMember {
  id: string;
  name: string;
  avatar: string | null;
  current_day: number;
  completed: boolean;
}

// ── Workouts ──────────────────────────────────────────────────────────
export interface Exercise {
  id: string;
  name: string;
  detail: string;
  sets?: number;
  reps?: number;
  restSeconds?: number;
  notes?: string;
  muscles?: string[];
  image?: string;
}

export interface Workout {
  id: string;
  title: string;
  subtitle: string;
  duration: number;
  difficulty: string;
  category: string;
  is_template: boolean;
  is_public: boolean;
  exercises: Exercise[];
  scheduled_days: string[];
  rest_days: string[];
}

// ── Groups ────────────────────────────────────────────────────────────
export interface Group {
  id: string;
  name: string;
  description: string;
  cover: string | null;
  avatar: string | null;
  dm_enabled?: boolean;
  metadata?: Record<string, unknown>;
  is_private: boolean;
  member_count: number;
  role?: string;
}

export interface GroupMember {
  role: string;
  joined_at: string;
  user: Pick<User, 'id' | 'name' | 'avatar' | 'level'>;
}

// ── Posts ─────────────────────────────────────────────────────────────
export interface Post {
  id: string;
  user_id: string;
  text: string;
  image: string | null;
  image_urls?: string[] | null;
  likes: number;
  liked?: boolean;
  comments_count?: number;
  liked_by: string[];
  community: string | null;
  created_at: string;
  user?: Pick<User, 'id' | 'name' | 'avatar'>;
}

// ── Marketplace ───────────────────────────────────────────────────────
export interface Product {
  id: string;
  title: string;
  description: string;
  photo: string | null;
  price: number;
  price_display: string;
  currency: string;
  category: string;
  is_featured: boolean;
  sold_count: number;
  seller?: Pick<User, 'id' | 'name' | 'avatar'>;
}

// ── Earn / Rewards ────────────────────────────────────────────────────
export interface EarnEntry {
  id: string;
  source: string;
  label: string;
  amount: number;
  created_at: string;
}

// ── Leaderboard ───────────────────────────────────────────────────────
export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar: string | null;
  points: number;
  isYou?: boolean;
}

// ── Fasting ───────────────────────────────────────────────────────────
export interface FastLog {
  id: string;
  protocol: string;
  started_at: number;
  ended_at: number | null;
  target_hours: number;
  achieved_hours: number;
  active: boolean;
}

// ── Pagination ────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  success: boolean;
  data?: T[];
  total?: number;
}
