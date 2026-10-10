import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Answer } from '../onboarding/calibration';
import { firstStudy, reviewCard } from '../srs/scheduler';
import type { StoredCard } from '../srs/scheduler';

/**
 * Where the user is in the first-run path: name, an intro, a practice word, the quick-test screen, 15 words,
 * a message. ('study' is an older value, kept so saved profiles still load; it is treated as done.)
 */
export type Phase = 'name' | 'intro' | 'practice' | 'quiz' | 'calibration' | 'message' | 'study' | 'done';

type Profile = {
  name: string;
  phase: Phase;
  /** Every rating made so far, in order (calibration and Explore). The level estimate comes from these. */
  answers: Answer[];
  /** The FSRS card of every word that has been studied: when it is next due, and how firm it is. */
  cards: Record<string, StoredCard>;
  /** Words the user deleted from their pile: they are never offered again. */
  removed: Record<string, true>;
  /** Makes this user's night sky one of a kind (the Map and the stars in the background). 0 = not chosen yet. */
  skySeed: number;
  /** The Map explains itself the first time it is opened. */
  mapIntroSeen: boolean;
};

type Ctx = Profile & {
  ready: boolean;
  /** The theme "explore from here" was tapped on in the Map; Explore takes it and clears it. */
  seedTheme: string | null;
  setSeedTheme: (themeId: string | null) => void;
  setName: (name: string) => void;
  setPhase: (phase: Phase) => void;
  setMapIntroSeen: () => void;
  addAnswer: (answer: Answer) => void;
  removeAnswer: (wordId: string) => void;
  /**
   * Rate a word in Study. The first time, its card is seeded from the Explore rating (`explore`),
   * then this rating reviews it; after that it is a plain review.
   */
  reviewWord: (wordId: string, value: number, explore: { value: number; at: number } | undefined) => void;
  /** Delete a word from the pile for good (its rating is removed separately). */
  removeWord: (wordId: string) => void;
  /** Back to the very start of the first-run path (the ratings are reset separately). */
  restartOnboarding: () => void;
};

const KEY = 'easyquizy.profile.v1';
const INITIAL: Profile = { name: '', phase: 'name', answers: [], cards: {}, removed: {}, skySeed: 0, mapIntroSeen: false };
const ProfileContext = createContext<Ctx | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile>(INITIAL);
  const [seedTheme, setSeedTheme] = useState<string | null>(null); // not saved: it only bridges Map -> Explore

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setProfile({ ...INITIAL, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // every user gets a sky of their own, chosen once (and again when onboarding restarts)
  useEffect(() => {
    if (ready && !profile.skySeed) setProfile((p) => (p.skySeed ? p : { ...p, skySeed: 1 + Math.floor(Math.random() * 1_000_000) }));
  }, [ready, profile.skySeed]);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(profile)).catch(() => {});
  }, [profile, ready]);

  const setName = useCallback(
    (name: string) => setProfile((p) => ({ ...p, name: name.trim(), phase: 'intro' })),
    [],
  );
  const setPhase = useCallback((phase: Phase) => setProfile((p) => ({ ...p, phase })), []);
  const setMapIntroSeen = useCallback(() => setProfile((p) => ({ ...p, mapIntroSeen: true })), []);
  const addAnswer = useCallback(
    (answer: Answer) =>
      setProfile((p) => ({ ...p, answers: [...p.answers.filter((a) => a.id !== answer.id), answer] })),
    [],
  );
  const removeAnswer = useCallback(
    (wordId: string) => setProfile((p) => ({ ...p, answers: p.answers.filter((a) => a.id !== wordId) })),
    [],
  );
  const reviewWord = useCallback(
    (wordId: string, value: number, explore: { value: number; at: number } | undefined) =>
      setProfile((p) => {
        const now = Date.now();
        const existing = p.cards[wordId];
        const card = existing
          ? reviewCard(existing, value, now)
          : firstStudy(explore?.value ?? value, explore?.at ?? now, value, now);
        return { ...p, cards: { ...p.cards, [wordId]: card } };
      }),
    [],
  );
  const removeWord = useCallback(
    (wordId: string) =>
      setProfile((p) => {
        const { [wordId]: _card, ...cards } = p.cards;
        return { ...p, cards, removed: { ...p.removed, [wordId]: true } };
      }),
    [],
  );
  const restartOnboarding = useCallback(() => setProfile(INITIAL), []);

  const value = useMemo<Ctx>(
    () => ({
      ...profile,
      ready,
      seedTheme,
      setSeedTheme,
      setName,
      setPhase,
      setMapIntroSeen,
      addAnswer,
      removeAnswer,
      reviewWord,
      removeWord,
      restartOnboarding,
    }),
    [profile, ready, seedTheme, setName, setPhase, setMapIntroSeen, addAnswer, removeAnswer, reviewWord, removeWord, restartOnboarding],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): Ctx {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
}
