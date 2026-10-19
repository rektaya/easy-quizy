import { Figtree_400Regular, Figtree_500Medium, useFonts } from '@expo-google-fonts/figtree';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef } from 'react';
import { AppState, Easing, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Starry } from './src/components/StarBackground';
import { FloatingTabBar, useTabBarSpace } from './src/components/FloatingTabBar';
import CalibrationDoneScreen from './src/screens/CalibrationDoneScreen';
import ExploreScreen, { ExploreView } from './src/screens/ExploreScreen';
import { KnownDust } from './src/components/KnownDust';
import { applyReminder, setupNotifications } from './src/notifications/reminders';
import { planReminder } from './src/notifications/schedule';
import ProfileScreen from './src/screens/ProfileScreen';
import { OnboardingProgress } from './src/components/OnboardingProgress';
import ExploreWayStep from './src/screens/ExploreWayStep';
import PaceStep from './src/screens/PaceStep';
import IntroScreen from './src/screens/IntroScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import NameScreen from './src/screens/NameScreen';
import PracticeScreen from './src/screens/PracticeScreen';
import QuizIntroScreen from './src/screens/QuizIntroScreen';
import MapScreen from './src/screens/MapScreen';
import StudyTab from './src/screens/StudyTab';
import { ProfileProvider, useProfile } from './src/state/profile';
import { RatingsProvider, useRatings } from './src/state/ratings';
import { WORDS } from './src/data/words';
import { waitingWords } from './src/onboarding/batch';
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
const ExploreTabScreen = () => (
  <Starry>
    <ExploreScreen />
  </Starry>
);
const StudyTabScreen = () => (
  <Starry>
    <StudyTab />
  </Starry>
);
const ProfileTabScreen = () => (
  <Starry>
    <ProfileScreen />
  </Starry>
);
// The Map is on the same starry paper as every other screen; its own big stars (one per topic) are drawn on top.
const MapTabScreen = ({ navigation }: { navigation: { navigate: (name: string) => void } }) => {
  const { setSeedTheme } = useProfile();
  const space = useTabBarSpace();
  return (
    <Starry>
    <MapScreen
      bottomSpace={space - 8}
      onExplore={(themeId) => {
        setSeedTheme(themeId);
        navigation.navigate('Explore');
      }}
      onStudy={() => navigation.navigate('Study')}
    />
    </Starry>
  );
};

// The first-run path: name, an intro, the way of exploring, the session size, a practice word, the quick-test screen, 15 adaptive words, a message.
// No tab bar until it is finished, so the first minutes are one guided road. It ends in the tabs, on Study.
function Onboarding() {
  return (
    <Starry>
      <OnboardingStep />
    </Starry>
  );
}

// Each step fades in over the one before it (the old one fades out underneath).
const BAR_STEPS: Partial<Record<string, number>> = { name: 1, intro: 2, way: 3, pace: 4, practice: 5, quiz: 6 };

function OnboardingStep() {
  const { phase } = useProfile();
  const step = BAR_STEPS[phase];
  return (
    <>
    <Animated.View key={phase} entering={FadeIn.duration(380)} exiting={FadeOut.duration(220)} style={StyleSheet.absoluteFill}>
      <OnboardingScreen />
    </Animated.View>
    {step ? <OnboardingProgress step={step} total={6} /> : null}
    </>
  );
}

function OnboardingScreen() {
  const { phase, setName, setPhase } = useProfile();
  const { reset } = useRatings();
  if (phase === 'welcome') return <WelcomeScreen onBegin={() => setPhase('name')} />;
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
  if (phase === 'intro') return <IntroScreen onDone={() => setPhase('way')} />;
  if (phase === 'way') return <ExploreWayStep onDone={() => setPhase('pace')} />;
  if (phase === 'pace') return <PaceStep onDone={() => setPhase('practice')} />;
  if (phase === 'practice') return <PracticeScreen onDone={() => setPhase('quiz')} />;
  if (phase === 'quiz') return <QuizIntroScreen onStart={() => setPhase('calibration')} />;
  if (phase === 'calibration') {
    return <ExploreView mode="calibration" onCalibrationDone={() => setPhase('message')} />;
  }
  if (phase === 'message') return <CalibrationDoneScreen onContinue={() => setPhase('done')} />;
  return null;
}

// Keeps the one daily reminder up to date: whenever the settings change, and whenever the app goes to the
// background (so it reflects what is waiting at that moment).
function ReminderSync() {
  const { reminder, cards } = useProfile();
  const { ratings } = useRatings();
  const latest = useRef({ reminder, cards, ratings });
  latest.current = { reminder, cards, ratings };
  const run = useCallback(() => {
    const { reminder: r, cards: c, ratings: rt } = latest.current;
    const waiting = waitingWords(WORDS, rt, c).length;
    const due = Object.values(c).map((card) => card.due);
    applyReminder(r.on ? planReminder(Date.now(), r.hour, r.minute, waiting, due) : null).catch(() => {});
  }, []);
  useEffect(() => {
    run();
  }, [reminder.on, reminder.hour, reminder.minute, run]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') run();
    });
    return () => sub.remove();
  }, [run]);
  return null;
}

function Root() {
  const { ready, phase } = useProfile();
  // Straight after the first-run path the tabs open on Study (the first session), with the tab bar there
  // so the user can leave at any moment. Any later launch opens on Explore.
  const fromOnboarding = useRef(false);
  const inOnboarding = phase !== 'done' && phase !== 'study'; // 'study' is an older saved value: treated as done
  if (ready && inOnboarding) fromOnboarding.current = true;
  if (!ready) return null;
  if (inOnboarding) {
    return (
      <>
        <Onboarding />
        <KnownDust />
      </>
    );
  }
  return (
    <>
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        initialRouteName={fromOnboarding.current ? 'Study' : 'Explore'}
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg }, ...(tabTransition as object) }}
      >
        <Tab.Screen name="Explore" component={ExploreTabScreen} />
        <Tab.Screen name="Study" component={StudyTabScreen} />
        <Tab.Screen name="Map" component={MapTabScreen} />
        <Tab.Screen name="Profile" component={ProfileTabScreen} />
      </Tab.Navigator>
    </NavigationContainer>
    <KnownDust />
    <ReminderSync />
    </>
  );
}

setupNotifications();

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
