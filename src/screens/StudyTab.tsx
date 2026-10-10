import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { useTabBarSpace } from '../components/FloatingTabBar';
import StudyScreen from './StudyScreen';

// The Study tab is the session itself: the reviews that are due, then a few new words. No dashboard.
export default function StudyTab({ onExplore }: { onExplore: () => void }) {
  const space = useTabBarSpace(); // buttons stay clear of the floating tab bar
  // Every time the tab is opened the session is looked at again, so words gathered meanwhile show up.
  const focused = useIsFocused();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (focused) setTick((t) => t + 1);
  }, [focused]);
  return (
    <StudyScreen bottomSpace={space} exitLabel="go to explore" onExit={onExplore} onClosed={onExplore} focusTick={tick} />
  );
}
