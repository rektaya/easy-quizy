import { Figtree_400Regular, Figtree_500Medium, useFonts } from '@expo-google-fonts/figtree';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Easing, StyleSheet, View } from 'react-native';
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
import WordsScreen from './src/screens/WordsScreen';
import { ProfileProvider, useProfile } from './src/state/profile';
import { RatingsProvider, useRatings } from './src/state/ratings';
import { colors } from './src/theme';

const Tab = createBottomTabNavigator();

// Switching tabs: the old screen slides a little to the side, shrinks slightly and fades out while the
// new one slides in from the other side (towards the tab you pressed), easing out so it settles softly.
const tabTransition = {
  transitionSpec: { animation: 'timing', config: { duration: 420, easing: Easing.out(Easing.cubic) } },
  sceneStyleInterpolator: ({ current }: { current: { progress: { interpolate: (c: { inputRange: number[]; outputRange: number[] }) => unknown } } }) => ({
    sceneStyle: {
      opacity: current.progress.interpolate({ inputRange: [-1, -0.4, 0, 0.4, 1], outputRange: [0, 0.05, 1, 0.05, 0] }),
      transform: [
        { translateX: current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [-90, 0, 90] }) },
        { scale: current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.94, 1, 0.94] }) },
      ],
    },
  }),
} as const;

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
const StudyTabScreen = ({ navigation }: { navigation: { navigate: (name: string) => void } }) => (
  <Starry>
    <StudyTab onExplore={() => navigation.navigate('Explore')} />
  </Starry>
);
// The Map draws a night sky of its own, so it has no starry paper.
// The list of all words opens over the Map (which stays where it was) and closes back onto it.
const MapTabScreen = ({ navigation }: { navigation: { navigate: (name: string) => void } }) => {
  const { setSeedTheme } = useProfile();
  const space = useTabBarSpace();
  const [words, setWords] = React.useState(false);
  return (
    <View style={{ flex: 1 }}>
      <MapScreen
        bottomSpace={space - 8}
        onWords={() => setWords(true)}
        onExplore={(themeId) => {
          setSeedTheme(themeId);
          navigation.navigate('Explore');
        }}
      />
      {words ? (
        <View style={StyleSheet.absoluteFill}>
          <Starry>
            <WordsScreen bottomSpace={space} onBack={() => setWords(false)} />
          </Starry>
        </View>
      ) : null}
    </View>
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
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg }, ...(tabTransition as object) }}
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
