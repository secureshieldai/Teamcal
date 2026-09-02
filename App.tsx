import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import StepSyncManager from './src/components/StepSyncManager';
import IncomingCallManager from './src/components/IncomingCallManager';
import { navigationRef } from './src/navigation/navigationRef';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StepSyncManager />
          <NavigationContainer
            ref={navigationRef}
            linking={{
              prefixes: ['teamcal://'],
              config: {
                screens: {
                  AudienceAccounts: 'social-auth/callback',
                  BotChatPublic: 'b/:slug',
                },
              },
            }}
          >
            <RootNavigator />
          </NavigationContainer>
          <IncomingCallManager />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
