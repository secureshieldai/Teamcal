import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BottomTabBar from '../components/BottomTabBar';
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import CommunityScreen from '../screens/CommunityScreen';
import ProfileScreen from '../screens/ProfileScreen';
import type { MainTabParamList, RootStackParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_KEY_BY_ROUTE = {
  Home: 'home',
  Explore: 'explore',
  Community: 'community',
  Profile: 'profile',
} as const;

const ROUTE_BY_TAB_KEY = {
  home: 'Home',
  explore: 'Explore',
  community: 'Community',
  profile: 'Profile',
} as const;

export default function MainTabs() {
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => {
        const routeName = state.routeNames[state.index] as keyof typeof TAB_KEY_BY_ROUTE;
        const activeTab = TAB_KEY_BY_ROUTE[routeName];

        return (
          <BottomTabBar
            activeTab={activeTab}
            onChangeTab={(tab) => navigation.navigate(ROUTE_BY_TAB_KEY[tab])}
            onPressAdd={() => rootNavigation.navigate('Plus')}
          />
        );
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
