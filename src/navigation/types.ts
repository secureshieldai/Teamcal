export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  VerifyCode: { mode: 'signup' | 'reset'; email: string; verificationToken?: string };
  ResetPassword: { email: string; resetToken: string };
  MainTabs: undefined;
  CoachChat: undefined;
  ScanFood: { mode?: 'food' | 'barcode' | 'cook' } | undefined;
  Challenges: undefined;
  Leaderboards: undefined;
  MealPlanner: undefined;
  Workouts: undefined;
  Progress: undefined;
  PowerSquad: undefined;
  Marketplace: undefined;
  Rewards: undefined;
  InviteFriends: undefined;
  Settings: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  NotificationSettings: undefined;
  Privacy: undefined;
  HelpSupport: undefined;
  QuickLogEntry: { kind: string };
  GroceryList: undefined;
  GlobalSearch: { query?: string } | undefined;
  MealEditor: { date: string; meal?: { id: string; name: string; mealType: string; kcal: number; protein: number; carbs: number; fats: number } };
  WorkoutSession: { workout: { id?: string; title: string; duration?: number; exercises: { id: string; name: string; detail: string }[] } };
  Comments: { postId: string };
  CreateChallenge: undefined;
  ProfileCollection: { kind: 'measurements' | 'photos' | 'achievements' };
  MarketplaceDetail: { productId: string };
  MarketplaceOrders: undefined;
  NotificationsInbox: undefined;
  BlogDetail: { blogId: string };
  Water: undefined;
  Steps: undefined;
  Fasting: undefined;
  Profile: undefined;
  BlogDashboard: { blogId: string };
  CreateBlog: undefined;
  AudienceEngine: { sourceLabel?: string } | undefined;
  Goals: undefined;
  ChallengeDetail: { challengeId: string };
  ChallengeInvite: { challengeId: string };
};

export type NoParamRoute = {
  [K in keyof RootStackParamList]: RootStackParamList[K] extends undefined ? K : never;
}[keyof RootStackParamList];

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Community: undefined;
  Earn: undefined;
};
