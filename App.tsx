import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { AppProviders } from './src/app/providers/AppProviders';
import RootNavigator from './src/navigation/RootNavigator';
import StepSyncManager from './src/components/StepSyncManager';
import IncomingCallManager from './src/components/IncomingCallManager';
import { navigationRef } from './src/navigation/navigationRef';

export default function App() {
  return (
    <AppProviders>
      <StepSyncManager />
      <NavigationContainer
        ref={navigationRef}
        linking={{
          prefixes: ['teamcal://', 'https://teamcal.app', 'https://teamcal.app/'],
          config: {
            screens: {
              AudienceAccounts: 'social-auth/callback',
              BotChatPublic: 'b/:slug',
              LiveViewer: 'live/:streamId',
            },
          },
        }}
      >
        <RootNavigator />
      </NavigationContainer>
      <IncomingCallManager />
    </AppProviders>
  );
}
