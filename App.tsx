import { Figtree_400Regular, Figtree_500Medium, useFonts } from '@expo-google-fonts/figtree';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Starry } from './src/components/StarBackground';
import { FloatingTabBar, useTabBarSpace } from './src/components/FloatingTabBar';
import CalibrationDoneScreen from './src/screens/CalibrationDoneScreen';
import ExploreScreen, { ExploreView } from './src/screens/ExploreScreen';
import NameScreen from './src/screens/NameScreen';
import MapScreen from './src/screens/MapScreen';
import StudyScreen from './src/screens/StudyScreen';
import StudyTab from './src/screens/StudyTab';
import { ProfileProvider, useProfile } from './src/state/profile';
import { RatingsProvider, useRatings } from './src/state/ratings';
import { colors } from './src/theme';

const Tab = createBottomTabNavigator();

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bg, border: 'transparent' },
};

// Each tab is drawn on the starry paper; the tab scenes stay opaque so they hide each other.
const ExploreTabScreen = (props: React.ComponentProps<typeof ExploreScreen>) => (
  <Starry>
    <ExploreScreen {...props} />
  </Starry>
);
const StudyTabScreen = () => (
  <Starry>
    <StudyTab />
  </Starry>
);
// The Map draws a night sky of its own, so it has no starry paper.
const MapTabScreen = ({ navigation }: { navigation: { navigate: (name: string) => void } }) => {
  const { setSeedTheme } = useProfile();
  const space = useTabBarSpace();
  return (
    <MapScreen
      bottomSpace={space - 8}
      onExplore={(themeId) => {
        setSeedTheme(themeId);
        navigation.navigate('Explore');
      }}
    />
  );
};

// The first-run path: name, 15 adaptive words, a message, a first Study session. No tab bar until
// it is finished, so the first minutes are one guided road.
function Onboarding() {
  return (
    <Starry>
      <OnboardingStep />
    </Starry>
  );
}

function OnboardingStep() {
  const { phase, setName, setPhase } = useProfile();
  const { reset } = useRatings();
  const insets = useSafeAreaInsets();
  if (phase === 'name') {
    return (
      <NameScreen
        onSubmit={(name) => {
          reset(); // start from a clean slate, whatever earlier testing left behind
          setName(name);
        }}
      />
    );
  }
  if (phase === 'calibration') {
    return <ExploreView mode="calibration" onCalibrationDone={() => setPhase('message')} />;
  }
  if (phase === 'message') return <CalibrationDoneScreen onContinue={() => setPhase('study')} />;
  return <StudyScreen bottomSpace={insets.bottom + 20} exitLabel="go to explore" onExit={() => setPhase('done')} />;
}

function Root() {
  const { ready, phase } = useProfile();
  if (!ready) return null;
  if (phase !== 'done') return <Onboarding />;
  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
      >
        <Tab.Screen name="Explore" component={ExploreTabScreen} />
        <Tab.Screen name="Study" component={StudyTabScreen} />
        <Tab.Screen name="Map" component={MapTabScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ Figtree_400Regular, Figtree_500Medium });
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <RatingsProvider>
          <ProfileProvider>
            <Root />
          </ProfileProvider>
        </RatingsProvider>
      </SafeAreaProvider>
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}
