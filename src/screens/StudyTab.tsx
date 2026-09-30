import React from 'react';
import { useTabBarSpace } from '../components/FloatingTabBar';
import StudyScreen from './StudyScreen';

// The Study tab is the session itself: the reviews that are due, then a few new words. No dashboard.
export default function StudyTab({ onExplore }: { onExplore: () => void }) {
  const space = useTabBarSpace(); // buttons stay clear of the floating tab bar
  return <StudyScreen bottomSpace={space} exitLabel="go to explore" onExit={onExplore} />;
}
