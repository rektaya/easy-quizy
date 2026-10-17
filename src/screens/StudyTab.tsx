import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTabBarSpace } from '../components/FloatingTabBar';
import { WORDS } from '../data/words';
import { makeSession, waitingWords } from '../onboarding/batch';
import type { SessionKind } from '../onboarding/batch';
import { MIN_PILE_TO_STUDY } from '../onboarding/calibration';
import { useProfile } from '../state/profile';
import { useRatings } from '../state/ratings';
import AddWordScreen from './AddWordScreen';
import StudyScreen from './StudyScreen';
import WordsScreen from './WordsScreen';

// The Study tab opens on the list of the words you are learning. Below it one button, "study". With
// "quick sessions" on in the settings there are two, side by side: "quick study" (up to 10 words) and, when
// there are more words to go through, "study all". Every time the tab is opened it
// starts on the list again.
export default function StudyTab() {
  const space = useTabBarSpace(); // buttons stay clear of the floating tab bar
  const { ratings } = useRatings();
  const { cards, quickSessions } = useProfile();
  const [session, setSession] = useState<SessionKind | null>(null);
  const [adding, setAdding] = useState(false); // the form for a word of your own
  const focused = useIsFocused();
  useEffect(() => {
    if (focused) {
      setSession(null);
      setAdding(false);
    }
  }, [focused]);

  if (adding) {
    return (
      <Animated.View key="add" entering={FadeIn.duration(260)} style={{ flex: 1 }}>
        <AddWordScreen onBack={() => setAdding(false)} />
      </Animated.View>
    );
  }
  if (session) {
    return (
      <Animated.View key="session" entering={FadeIn.duration(260)} style={{ flex: 1 }}>
        <StudyScreen kind={session} bottomSpace={space} onList={() => setSession(null)} />
      </Animated.View>
    );
  }

  const now = Date.now();
  const quick = makeSession(WORDS, ratings, cards, now, 'quick').length;
  const long = makeSession(WORDS, ratings, cards, now, 'long').length;
  // One button, "study" (everything that is ready). With "quick sessions" on in the settings there are two.
  const sessions = quickSessions
    ? [
        ...(quick > 0 ? [{ label: 'quick study', caption: `${quick} words`, onPress: () => setSession('quick') }] : []),
        ...(long > quick ? [{ label: 'study all', caption: `${long} words`, onPress: () => setSession('long') }] : []),
      ]
    : long > 0
      ? [{ label: 'study', caption: `${long} words`, onPress: () => setSession('long') }]
      : [];
  const waiting = waitingWords(WORDS, ratings, cards).length;
  const note =
    waiting > 0
      ? `${waiting} of ${MIN_PILE_TO_STUDY} words gathered. rate a few more in explore to start a session`
      : 'nothing is due. gather new words in explore';
  return (
    <Animated.View key="list" entering={FadeIn.duration(260)} style={{ flex: 1 }}>
      <WordsScreen bottomSpace={space} sessions={sessions} note={note} onAdd={() => setAdding(true)} />
    </Animated.View>
  );
}
