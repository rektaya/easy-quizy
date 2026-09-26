import React, { useState } from 'react';
import { TAB_BAR_SPACE } from '../theme';
import { useProfile } from '../state/profile';
import { useRatings } from '../state/ratings';
import StudyHomeScreen from './StudyHomeScreen';
import StudyScreen from './StudyScreen';
import WordsScreen from './WordsScreen';

// Extra room above the floating tab bar, so buttons never sit right against it.
export const TAB_SAFE_SPACE = TAB_BAR_SPACE + 20;

type View = 'home' | 'session' | 'words';

// The Study tab: the dashboard, a session, or the list of all words.
export default function StudyTab() {
  const [view, setView] = useState<View>('home');
  const { reset } = useRatings();
  const { restartOnboarding } = useProfile();

  if (view === 'session') {
    return <StudyScreen bottomSpace={TAB_SAFE_SPACE} exitLabel="back to study" onExit={() => setView('home')} />;
  }
  if (view === 'words') return <WordsScreen bottomSpace={TAB_SAFE_SPACE} onBack={() => setView('home')} />;
  return (
    <StudyHomeScreen
      bottomSpace={TAB_SAFE_SPACE}
      onStudy={() => setView('session')}
      onAllWords={() => setView('words')}
      onRestartOnboarding={() => {
        reset(); // prototype only: run the first-run path again from the name screen
        restartOnboarding();
      }}
    />
  );
}
