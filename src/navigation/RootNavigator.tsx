import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import SplashScreen from '../screens/SplashScreen';
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
import BlogPublicScreen from '../screens/social/BlogPublicScreen';
import ArticleDetailScreen from '../screens/social/ArticleDetailScreen';
import WaterScreen from '../screens/WaterScreen';
import StepsScreen from '../screens/StepsScreen';
import WeightScreen from '../screens/WeightScreen';
import SleepScreen from '../screens/SleepScreen';
import FastingScreen from '../screens/FastingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BlogDashboardScreen from '../screens/BlogDashboardScreen';
import CreateBlogScreen from '../screens/CreateBlogScreen';
import CreateChannelScreen from '../screens/CreateChannelScreen';
import ChannelFeedScreen from '../screens/ChannelFeedScreen';
import CreateChannelPostScreen from '../screens/CreateChannelPostScreen';
import ChannelPostDetailScreen from '../screens/ChannelPostDetailScreen';
import ChannelSettingsScreen from '../screens/ChannelSettingsScreen';
import EditChannelScreen from '../screens/EditChannelScreen';
import ChannelDetailSettingsScreen from '../screens/ChannelDetailSettingsScreen';
import ShareChannelScreen from '../screens/ShareChannelScreen';
import ReportChannelScreen from '../screens/ReportChannelScreen';
import ChannelAnalyticsScreen from '../screens/ChannelAnalyticsScreen';
import ChannelDiscoveryScreen from '../screens/ChannelDiscoveryScreen';
import ChannelAdminManagementScreen from '../screens/ChannelAdminManagementScreen';
import ChannelMonetizationScreen from '../screens/ChannelMonetizationScreen';
import ChannelEarningsScreen from '../screens/ChannelEarningsScreen';
import CreateCommunityScreen from '../screens/CreateCommunityScreen';
import AudienceEngineScreen from '../screens/AudienceEngineScreen';
import DirectMessageScreen from '../screens/DirectMessageScreen';
import DiscoverPeopleScreen from '../screens/DiscoverPeopleScreen';
import ConnectionsScreen from '../screens/ConnectionsScreen';
import CallScreen from '../screens/CallScreen';
import GoalsScreen from '../screens/GoalsScreen';
import ChallengeDetailScreen from '../screens/ChallengeDetailScreen';
import ChallengeInviteScreen from '../screens/ChallengeInviteScreen';
import MyRecipesScreen from '../screens/MyRecipesScreen';
import PeriodTrackerScreen from '../screens/PeriodTrackerScreen';
import SupplementTrackerScreen from '../screens/SupplementTrackerScreen';
import SupplementScannerScreen from '../screens/SupplementScannerScreen';
import MoodJournalScreen from '../screens/MoodJournalScreen';
import LiveJournalCallScreen from '../screens/LiveJournalCallScreen';
import RecipeLibraryScreen from '../screens/RecipeLibraryScreen';
import CookModeScreen from '../screens/CookModeScreen';
import ArticleEditorScreen from '../screens/ArticleEditorScreen';
import SelectCategoryScreen from '../screens/SelectCategoryScreen';
import AddTagsScreen from '../screens/AddTagsScreen';
import AIHelperScreen from '../screens/AIHelperScreen';
import AudienceAccountsScreen from '../screens/AudienceAccountsScreen';
import BlogSettingsScreen from '../screens/BlogSettingsScreen';
import LegalDocumentScreen from '../screens/LegalDocumentScreen';
import PdfEditorScreen from '../screens/PdfEditorScreen';
import PdfDashboardScreen from '../screens/PdfDashboardScreen';
import PdfReaderScreen from '../screens/PdfReaderScreen';
import PdfReviewsScreen from '../screens/PdfReviewsScreen';
import VideoEditorScreen from '../screens/VideoEditorScreen';
import VideoDashboardScreen from '../screens/VideoDashboardScreen';
import VideoPlayerScreen from '../screens/VideoPlayerScreen';
import VideoRecorderScreen from '../screens/VideoRecorderScreen';
import VideoEditDetailsScreen from '../screens/VideoEditDetailsScreen';
import VideoReplaceScreen from '../screens/VideoReplaceScreen';
import VideoChangeThumbnailScreen from '../screens/VideoChangeThumbnailScreen';
import VideoPreviewSettingsScreen from '../screens/VideoPreviewSettingsScreen';
import VideoPricingScreen from '../screens/VideoPricingScreen';
import VideoCaptionsScreen from '../screens/VideoCaptionsScreen';
import VideoTranscriptScreen from '../screens/VideoTranscriptScreen';
import VideoAddToSeriesScreen from '../screens/VideoAddToSeriesScreen';
import VideoRearrangeEpisodesScreen from '../screens/VideoRearrangeEpisodesScreen';
import VideoCommentsScreen from '../screens/VideoCommentsScreen';
import VideoPurchasersScreen from '../screens/VideoPurchasersScreen';
import VideoSubscribersScreen from '../screens/VideoSubscribersScreen';
import VideoShareScreen from '../screens/VideoShareScreen';
import VideoQrCodeScreen from '../screens/VideoQrCodeScreen';
import UploadVideoScreen from '../screens/UploadVideoScreen';
import UploadMultipleScreen from '../screens/UploadMultipleScreen';
import CreateSeriesScreen from '../screens/CreateSeriesScreen';
import CreateCourseScreen from '../screens/CreateCourseScreen';
import ImportFromCloudScreen from '../screens/ImportFromCloudScreen';
import UploadPdfScreen from '../screens/UploadPdfScreen';
import CreatePdfScreen from '../screens/CreatePdfScreen';
import AiGeneratePdfScreen from '../screens/AiGeneratePdfScreen';
import PdfEditDetailsScreen from '../screens/PdfEditDetailsScreen';
import PdfReplaceScreen from '../screens/PdfReplaceScreen';
import PdfNewEditionScreen from '../screens/PdfNewEditionScreen';
import PdfCoverScreen from '../screens/PdfCoverScreen';
import PdfPreviewSettingsScreen from '../screens/PdfPreviewSettingsScreen';
import PdfPricingScreen from '../screens/PdfPricingScreen';
import PdfQrCodeScreen from '../screens/PdfQrCodeScreen';
import CreateStoreScreen from '../screens/CreateStoreScreen';
import StoreDashboardScreen from '../screens/StoreDashboardScreen';
import AddProductScreen from '../screens/AddProductScreen';
import MembershipEditorScreen from '../screens/MembershipEditorScreen';
import MembershipDashboardScreen from '../screens/MembershipDashboardScreen';
import MembershipPublicScreen from '../screens/MembershipPublicScreen';
import MembershipCheckoutScreen from '../screens/MembershipCheckoutScreen';
import LiveSetupScreen from '../screens/live/LiveSetupScreen';
import LiveHostScreen from '../screens/live/LiveHostScreen';
import LiveViewerScreen from '../screens/live/LiveViewerScreen';
import LiveSummaryScreen from '../screens/live/LiveSummaryScreen';
import CreateRecipeScreen from '../screens/CreateRecipeScreen';
import BotsHomeScreen from '../screens/bots/BotsHomeScreen';
import CreateBotScreen from '../screens/bots/CreateBotScreen';
import BotManageScreen from '../screens/bots/BotManageScreen';
import BotChatPublicScreen from '../screens/bots/BotChatPublicScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import ShowcaseEditorScreen from '../screens/ShowcaseEditorScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
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
      <Stack.Screen name="LegalDocument" component={LegalDocumentScreen} />
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
      <Stack.Screen name="BlogPublic" component={BlogPublicScreen} />
      <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
      <Stack.Screen name="Water" component={WaterScreen} />
      <Stack.Screen name="Steps" component={StepsScreen} />
      <Stack.Screen name="Weight" component={WeightScreen} />
      <Stack.Screen name="Sleep" component={SleepScreen} />
      <Stack.Screen name="Fasting" component={FastingScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="BlogDashboard" component={BlogDashboardScreen} />
      <Stack.Screen name="CreateBlog" component={CreateBlogScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="CreateCommunity" component={CreateCommunityScreen} />
      <Stack.Screen name="CreateChannel" component={CreateChannelScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="ChannelFeed" component={ChannelFeedScreen} />
      <Stack.Screen name="CreateChannelPost" component={CreateChannelPostScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="ChannelPostDetail" component={ChannelPostDetailScreen} />
      <Stack.Screen name="ChannelSettings" component={ChannelSettingsScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="EditChannel" component={EditChannelScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="ChannelDetailSettings" component={ChannelDetailSettingsScreen} />
      <Stack.Screen name="ShareChannel" component={ShareChannelScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="ReportChannel" component={ReportChannelScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="ChannelDiscovery" component={ChannelDiscoveryScreen} />
      <Stack.Screen name="ChannelAdminManagement" component={ChannelAdminManagementScreen} />
      <Stack.Screen name="ChannelMonetization" component={ChannelMonetizationScreen} />
      <Stack.Screen name="ChannelEarnings" component={ChannelEarningsScreen} />
      <Stack.Screen name="ChannelAnalytics" component={ChannelAnalyticsScreen} />
      <Stack.Screen name="AudienceEngine" component={AudienceEngineScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="DirectMessage" component={DirectMessageScreen} />
      <Stack.Screen name="DiscoverPeople" component={DiscoverPeopleScreen} />
      <Stack.Screen name="Connections" component={ConnectionsScreen} />
      <Stack.Screen name="Call" component={CallScreen} options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
      <Stack.Screen name="Goals" component={GoalsScreen} />
      <Stack.Screen name="ChallengeDetail" component={ChallengeDetailScreen} />
      <Stack.Screen name="ChallengeInvite" component={ChallengeInviteScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="MyRecipes" component={MyRecipesScreen} />
      <Stack.Screen name="CreateRecipe" component={CreateRecipeScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="PeriodTracker" component={PeriodTrackerScreen} />
      <Stack.Screen name="SupplementTracker" component={SupplementTrackerScreen} />
      <Stack.Screen name="SupplementScanner" component={SupplementScannerScreen} />
      <Stack.Screen name="MoodJournal" component={MoodJournalScreen} />
      <Stack.Screen name="LiveJournalCall" component={LiveJournalCallScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="RecipeLibrary" component={RecipeLibraryScreen} />
      <Stack.Screen name="CookMode" component={CookModeScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="ArticleEditor" component={ArticleEditorScreen} options={{presentation:'modal'}} />
      <Stack.Screen name="SelectCategory" component={SelectCategoryScreen} options={{presentation:'modal'}} />
      <Stack.Screen name="AddTags" component={AddTagsScreen} options={{presentation:'modal'}} />
      <Stack.Screen name="AIHelper" component={AIHelperScreen} options={{presentation:'fullScreenModal'}} />
      <Stack.Screen name="AudienceAccounts" component={AudienceAccountsScreen} />
      <Stack.Screen name="BlogSettings" component={BlogSettingsScreen} />
      <Stack.Screen name="PdfEditor" component={PdfEditorScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="PdfDashboard" component={PdfDashboardScreen} />
      <Stack.Screen name="PdfReader" component={PdfReaderScreen} />
      <Stack.Screen name="PdfReviews" component={PdfReviewsScreen} />
      <Stack.Screen name="PdfEditDetails" component={PdfEditDetailsScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="PdfReplace" component={PdfReplaceScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="PdfNewEdition" component={PdfNewEditionScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="PdfCover" component={PdfCoverScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="PdfPreviewSettings" component={PdfPreviewSettingsScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="PdfPricing" component={PdfPricingScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="PdfQrCode" component={PdfQrCodeScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="VideoEditor" component={VideoEditorScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="VideoDashboard" component={VideoDashboardScreen} />
      <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
      <Stack.Screen name="VideoRecorder" component={VideoRecorderScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="VideoEditDetails" component={VideoEditDetailsScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="VideoReplace" component={VideoReplaceScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="VideoChangeThumbnail" component={VideoChangeThumbnailScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="VideoPreviewSettings" component={VideoPreviewSettingsScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="VideoPricing" component={VideoPricingScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="VideoCaptions" component={VideoCaptionsScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="VideoTranscript" component={VideoTranscriptScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="VideoAddToSeries" component={VideoAddToSeriesScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="VideoRearrangeEpisodes" component={VideoRearrangeEpisodesScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="VideoComments" component={VideoCommentsScreen} />
      <Stack.Screen name="VideoPurchasers" component={VideoPurchasersScreen} />
      <Stack.Screen name="VideoSubscribers" component={VideoSubscribersScreen} />
      <Stack.Screen name="VideoShare" component={VideoShareScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="VideoQrCode" component={VideoQrCodeScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="UploadVideo" component={UploadVideoScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="UploadMultiple" component={UploadMultipleScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="CreateSeries" component={CreateSeriesScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="CreateCourse" component={CreateCourseScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="ImportFromCloud" component={ImportFromCloudScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="UploadPdf" component={UploadPdfScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="CreatePdf" component={CreatePdfScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="AiGeneratePdf" component={AiGeneratePdfScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="CreateStore" component={CreateStoreScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="StoreDashboard" component={StoreDashboardScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="MembershipEditor" component={MembershipEditorScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="MembershipDashboard" component={MembershipDashboardScreen} />
      <Stack.Screen name="MembershipPublic" component={MembershipPublicScreen} />
      <Stack.Screen name="MembershipCheckout" component={MembershipCheckoutScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="LiveSetup" component={LiveSetupScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="LiveHost" component={LiveHostScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="LiveViewer" component={LiveViewerScreen} options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="LiveSummary" component={LiveSummaryScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Bots" component={BotsHomeScreen} />
      <Stack.Screen name="CreateBot" component={CreateBotScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="BotManage" component={BotManageScreen} />
      <Stack.Screen name="BotChatPublic" component={BotChatPublicScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="ShowcaseEditor" component={ShowcaseEditorScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
