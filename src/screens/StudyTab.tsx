import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTabBarSpace, useTabRepress } from '../components/FloatingTabBar';
import { WORDS } from '../data/words';
import { makeSession, waitingWords } from '../onboarding/batch';
import { MIN_PILE_TO_STUDY } from '../onboarding/calibration';
import { useProfile } from '../state/profile';
import { useRatings } from '../state/ratings';
import AddWordScreen from './AddWordScreen';
import StudyScreen from './StudyScreen';
import WordsScreen from './WordsScreen';

// The Study tab opens on the list of the words you are learning. Below it one button, "study", with the number of
// words in the session (at most the size chosen in the profile). Every time the tab is opened it starts on the
// list again.
export default function StudyTab() {
  const space = useTabBarSpace(); // buttons stay clear of the floating tab bar
  const { ratings } = useRatings();
  const { cards, sessionWords } = useProfile();
  const [session, setSession] = useState(false);
  const [adding, setAdding] = useState(false); // the form for a word of your own
  const [round, setRound] = useState(0); // counts up to start the list afresh (closing a word's card that is open over it)
  const focused = useIsFocused();
  useEffect(() => {
    if (focused) {
      setSession(false);
      setAdding(false);
    }
  }, [focused]);
  // pressing the tab you are already on brings you back to the list
  useTabRepress(() => {
    setSession(false);
    setAdding(false);
    setRound((r) => r + 1);
  });

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
        <StudyScreen size={sessionWords} bottomSpace={space} onList={() => setSession(false)} />
      </Animated.View>
    );
  }

  const now = Date.now();
  const ready = makeSession(WORDS, ratings, cards, now, sessionWords).length;
  // One button, "study": the words that are ready, up to the size of a session.
  const sessions = ready > 0 ? [{ label: 'study', onPress: () => setSession(true) }] : [];
  const waiting = waitingWords(WORDS, ratings, cards).length;
  const note =
    waiting > 0
      ? `${waiting} of ${MIN_PILE_TO_STUDY} words gathered. rate a few more in explore to start a session`
      : 'nothing is due. gather new words in explore';
  return (
    <Animated.View key={`list-${round}`} entering={FadeIn.duration(260)} style={{ flex: 1 }}>
      <WordsScreen bottomSpace={space} sessions={sessions} note={note} onAdd={() => setAdding(true)} />
    </Animated.View>
  );
}
