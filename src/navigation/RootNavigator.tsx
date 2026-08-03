import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import VerifyCodeScreen from '../screens/auth/VerifyCodeScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import CoachChatScreen from '../screens/CoachChatScreen';
import ScanFoodScreen from '../screens/ScanFoodScreen';
import ChallengesScreen from '../screens/ChallengesScreen';
import LeaderboardsScreen from '../screens/LeaderboardsScreen';
import MealPlannerScreen from '../screens/MealPlannerScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import ProgressScreen from '../screens/ProgressScreen';
import PowerSquadScreen from '../screens/PowerSquadScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';
import RewardsScreen from '../screens/RewardsScreen';
import InviteFriendsScreen from '../screens/InviteFriendsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { ChangePasswordScreen, EditProfileScreen, HelpSupportScreen, NotificationSettingsScreen, PrivacyScreen } from '../screens/SettingsDetailScreens';
import QuickLogEntryScreen from '../screens/QuickLogEntryScreen';
import GroceryListScreen from '../screens/GroceryListScreen';
import GlobalSearchScreen from '../screens/GlobalSearchScreen';
import MealEditorScreen from '../screens/MealEditorScreen';
import WorkoutSessionScreen from '../screens/WorkoutSessionScreen';
import CommentsScreen from '../screens/CommentsScreen';
import CreateChallengeScreen from '../screens/CreateChallengeScreen';
import ProfileCollectionScreen from '../screens/ProfileCollectionScreen';
import MarketplaceDetailScreen from '../screens/MarketplaceDetailScreen';
import MarketplaceOrdersScreen from '../screens/MarketplaceOrdersScreen';
import NotificationsInboxScreen from '../screens/NotificationsInboxScreen';
import BlogDetailScreen from '../screens/social/BlogDetailScreen';
import WaterScreen from '../screens/WaterScreen';
import StepsScreen from '../screens/StepsScreen';
import FastingScreen from '../screens/FastingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BlogDashboardScreen from '../screens/BlogDashboardScreen';
import CreateBlogScreen from '../screens/CreateBlogScreen';
import AudienceEngineScreen from '../screens/AudienceEngineScreen';
import DirectMessageScreen from '../screens/DirectMessageScreen';
import GoalsScreen from '../screens/GoalsScreen';
import ChallengeDetailScreen from '../screens/ChallengeDetailScreen';
import ChallengeInviteScreen from '../screens/ChallengeInviteScreen';
import PersonalToolScreen from '../screens/PersonalToolScreen';
import ArticleEditorScreen from '../screens/ArticleEditorScreen';
import AudienceAccountsScreen from '../screens/AudienceAccountsScreen';
import BlogSettingsScreen from '../screens/BlogSettingsScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Onboarding"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="CoachChat" component={CoachChatScreen} />
      <Stack.Screen name="ScanFood" component={ScanFoodScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="Challenges" component={ChallengesScreen} />
      <Stack.Screen name="Leaderboards" component={LeaderboardsScreen} />
      <Stack.Screen name="MealPlanner" component={MealPlannerScreen} />
      <Stack.Screen name="Workouts" component={WorkoutsScreen} />
      <Stack.Screen name="Progress" component={ProgressScreen} />
      <Stack.Screen name="PowerSquad" component={PowerSquadScreen} />
      <Stack.Screen name="Marketplace" component={MarketplaceScreen} />
      <Stack.Screen name="Rewards" component={RewardsScreen} />
      <Stack.Screen name="InviteFriends" component={InviteFriendsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="QuickLogEntry" component={QuickLogEntryScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="GroceryList" component={GroceryListScreen} />
      <Stack.Screen name="GlobalSearch" component={GlobalSearchScreen} />
      <Stack.Screen name="MealEditor" component={MealEditorScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="WorkoutSession" component={WorkoutSessionScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Comments" component={CommentsScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="CreateChallenge" component={CreateChallengeScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="ProfileCollection" component={ProfileCollectionScreen} />
      <Stack.Screen name="MarketplaceDetail" component={MarketplaceDetailScreen} />
      <Stack.Screen name="MarketplaceOrders" component={MarketplaceOrdersScreen} />
      <Stack.Screen name="NotificationsInbox" component={NotificationsInboxScreen} />
      <Stack.Screen name="BlogDetail" component={BlogDetailScreen} />
      <Stack.Screen name="Water" component={WaterScreen} />
      <Stack.Screen name="Steps" component={StepsScreen} />
      <Stack.Screen name="Fasting" component={FastingScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="BlogDashboard" component={BlogDashboardScreen} />
      <Stack.Screen name="CreateBlog" component={CreateBlogScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="AudienceEngine" component={AudienceEngineScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="DirectMessage" component={DirectMessageScreen} />
      <Stack.Screen name="Goals" component={GoalsScreen} />
      <Stack.Screen name="ChallengeDetail" component={ChallengeDetailScreen} />
      <Stack.Screen name="ChallengeInvite" component={ChallengeInviteScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="PersonalTool" component={PersonalToolScreen} />
      <Stack.Screen name="ArticleEditor" component={ArticleEditorScreen} options={{presentation:'modal'}} />
      <Stack.Screen name="AudienceAccounts" component={AudienceAccountsScreen} />
      <Stack.Screen name="BlogSettings" component={BlogSettingsScreen} />
    </Stack.Navigator>
  );
}
