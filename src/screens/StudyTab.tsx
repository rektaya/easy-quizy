import React, { useState } from 'react';
import { useTabBarSpace } from '../components/FloatingTabBar';
import { useProfile } from '../state/profile';
import { useRatings } from '../state/ratings';
import StudyHomeScreen from './StudyHomeScreen';
import StudyScreen from './StudyScreen';
import WordsScreen from './WordsScreen';

type View = 'home' | 'session' | 'words';

// The Study tab: the dashboard, a session, or the list of all words.
export default function StudyTab() {
  const [view, setView] = useState<View>('home');
  const space = useTabBarSpace(); // buttons stay clear of the floating tab bar
  const { reset } = useRatings();
  const { restartOnboarding } = useProfile();

  if (view === 'session') {
    return <StudyScreen bottomSpace={space} exitLabel="back to study" onExit={() => setView('home')} />;
  }
  if (view === 'words') return <WordsScreen bottomSpace={space} onBack={() => setView('home')} />;
  return (
    <StudyHomeScreen
      bottomSpace={space}
      onStudy={() => setView('session')}
      onAllWords={() => setView('words')}
      onRestartOnboarding={() => {
        reset(); // prototype only: run the first-run path again from the name screen
        restartOnboarding();
      }}
    />
  );
}
