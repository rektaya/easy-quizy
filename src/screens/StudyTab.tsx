import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { useTabBarSpace } from '../components/FloatingTabBar';
import { WORDS } from '../data/words';
import { makeBatch, waitingWords } from '../onboarding/batch';
import { MIN_PILE_TO_STUDY } from '../onboarding/calibration';
import { useProfile } from '../state/profile';
import { useRatings } from '../state/ratings';
import StudyScreen from './StudyScreen';
import WordsScreen from './WordsScreen';

// The Study tab opens on the list of the words you are learning; the "study" button starts a session
// (the Circle on each word that is due or new). Every time the tab is opened it starts on the list again.
export default function StudyTab({ onMap }: { onMap: () => void }) {
  const space = useTabBarSpace(); // buttons stay clear of the floating tab bar
  const { ratings } = useRatings();
  const { cards } = useProfile();
  const [session, setSession] = useState(false);
  const focused = useIsFocused();
  useEffect(() => {
    if (focused) setSession(false);
  }, [focused]);

  if (session) return <StudyScreen bottomSpace={space} onMap={onMap} onList={() => setSession(false)} />;

  const waiting = waitingWords(WORDS, ratings, cards).length;
  const canStudy = makeBatch(WORDS, ratings, cards, Date.now()).length > 0;
  const note =
    waiting > 0
      ? `${waiting} of ${MIN_PILE_TO_STUDY} words gathered. rate a few more in explore to start a session`
      : 'nothing is due. gather new words in explore';
  return <WordsScreen bottomSpace={space} canStudy={canStudy} note={note} onStudy={() => setSession(true)} />;
}
