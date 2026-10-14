import { Figtree_400Regular, Figtree_500Medium, useFonts } from '@expo-google-fonts/figtree';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef } from 'react';
import { AppState, Easing, StyleSheet, View } from 'react-native';
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
import IntroScreen from './src/screens/IntroScreen';
import NameScreen from './src/screens/NameScreen';
import PracticeScreen from './src/screens/PracticeScreen';
import QuizIntroScreen from './src/screens/QuizIntroScreen';
import MapScreen from './src/screens/MapScreen';
import StudyTab from './src/screens/StudyTab';
import { ProfileProvider, useProfile } from './src/state/profile';
import { ProfileSheetProvider, useProfileSheet } from './src/state/profileSheet';
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
const ExploreTabScreen = (props: React.ComponentProps<typeof ExploreScreen>) => (
  <Starry>
    <ExploreScreen {...props} />
  </Starry>
);
const StudyTabScreen = ({ navigation }: { navigation: { navigate: (name: string) => void } }) => (
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
      onStudy={() => navigation.navigate('Study')}
    />
  );
};

// The first-run path: name, an intro, a practice word, the quick-test screen, 15 adaptive words, a message.
// No tab bar until it is finished, so the first minutes are one guided road. It ends in the tabs, on Study.
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
  if (phase === 'intro') return <IntroScreen onDone={() => setPhase('practice')} />;
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

// Profile and settings, opened from the avatar in Explore, over the whole app.
function ProfileOverlay() {
  const { open } = useProfileSheet();
  if (!open) return null;
  return (
    <View style={StyleSheet.absoluteFill}>
      <Starry>
        <ProfileScreen />
      </Starry>
    </View>
  );
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
      </Tab.Navigator>
    </NavigationContainer>
    <KnownDust />
    <ProfileOverlay />
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
            <ProfileSheetProvider>
              <Root />
            </ProfileSheetProvider>
          </ProfileProvider>
        </RatingsProvider>
      </SafeAreaProvider>
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}
