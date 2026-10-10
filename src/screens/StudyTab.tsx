import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { useTabBarSpace } from '../components/FloatingTabBar';
import { WORDS } from '../data/words';
import { makeSession, waitingWords } from '../onboarding/batch';
import type { SessionKind } from '../onboarding/batch';
import { MIN_PILE_TO_STUDY } from '../onboarding/calibration';
import { useProfile } from '../state/profile';
import { useRatings } from '../state/ratings';
import StudyScreen from './StudyScreen';
import WordsScreen from './WordsScreen';

// The Study tab opens on the list of the words you are learning. Below it, side by side, "quick study"
// (up to 10 words) and, when there are more words to go through, "study all". Every time the tab is opened it
// starts on the list again.
export default function StudyTab({ onMap }: { onMap: () => void }) {
  const space = useTabBarSpace(); // buttons stay clear of the floating tab bar
  const { ratings } = useRatings();
  const { cards } = useProfile();
  const [session, setSession] = useState<SessionKind | null>(null);
  const focused = useIsFocused();
  useEffect(() => {
    if (focused) setSession(null);
  }, [focused]);

  if (session) return <StudyScreen kind={session} bottomSpace={space} onMap={onMap} onList={() => setSession(null)} />;

  const now = Date.now();
  const quick = makeSession(WORDS, ratings, cards, now, 'quick').length;
  const long = makeSession(WORDS, ratings, cards, now, 'long').length;
  const sessions = [
    ...(quick > 0 ? [{ label: 'quick study', caption: `${quick} words`, onPress: () => setSession('quick') }] : []),
    ...(long > quick ? [{ label: 'study all', caption: `${long} words`, onPress: () => setSession('long') }] : []),
  ];
  const waiting = waitingWords(WORDS, ratings, cards).length;
  const note =
    waiting > 0
      ? `${waiting} of ${MIN_PILE_TO_STUDY} words gathered. rate a few more in explore to start a session`
      : 'nothing is due. gather new words in explore';
  return <WordsScreen bottomSpace={space} sessions={sessions} note={note} />;
}
