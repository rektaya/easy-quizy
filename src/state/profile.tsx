import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Answer } from '../onboarding/calibration';

/** Where the user is in the first-run path: name, 15 words, a message, a first Study session. */
export type Phase = 'name' | 'calibration' | 'message' | 'study' | 'done';

export type StudyResult = { value: number; at: number };

type Profile = {
  name: string;
  phase: Phase;
  /** Every rating made so far, in order (calibration and Explore). The level estimate comes from these. */
  answers: Answer[];
  /** The latest Study rating of each word (scheduling with FSRS comes later). */
  studied: Record<string, StudyResult>;
  /** Words the user deleted from their pile: they are never offered again. */
  removed: Record<string, true>;
};

type Ctx = Profile & {
  ready: boolean;
  setName: (name: string) => void;
  setPhase: (phase: Phase) => void;
  addAnswer: (answer: Answer) => void;
  removeAnswer: (wordId: string) => void;
  recordStudy: (wordId: string, value: number) => void;
  /** Delete a word from the pile for good (its rating is removed separately). */
  removeWord: (wordId: string) => void;
  /** Back to the very start of the first-run path (the ratings are reset separately). */
  restartOnboarding: () => void;
};

const KEY = 'easyquizy.profile.v1';
const INITIAL: Profile = { name: '', phase: 'name', answers: [], studied: {}, removed: {} };
const ProfileContext = createContext<Ctx | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile>(INITIAL);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setProfile({ ...INITIAL, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(profile)).catch(() => {});
  }, [profile, ready]);

  const setName = useCallback(
    (name: string) => setProfile((p) => ({ ...p, name: name.trim(), phase: 'calibration' })),
    [],
  );
  const setPhase = useCallback((phase: Phase) => setProfile((p) => ({ ...p, phase })), []);
  const addAnswer = useCallback(
    (answer: Answer) =>
      setProfile((p) => ({ ...p, answers: [...p.answers.filter((a) => a.id !== answer.id), answer] })),
    [],
  );
  const removeAnswer = useCallback(
    (wordId: string) => setProfile((p) => ({ ...p, answers: p.answers.filter((a) => a.id !== wordId) })),
    [],
  );
  const recordStudy = useCallback(
    (wordId: string, value: number) =>
      setProfile((p) => ({ ...p, studied: { ...p.studied, [wordId]: { value, at: Date.now() } } })),
    [],
  );
  const removeWord = useCallback(
    (wordId: string) =>
      setProfile((p) => {
        const { [wordId]: _studied, ...studied } = p.studied;
        return { ...p, studied, removed: { ...p.removed, [wordId]: true } };
      }),
    [],
  );
  const restartOnboarding = useCallback(() => setProfile(INITIAL), []);

  const value = useMemo<Ctx>(
    () => ({
      ...profile,
      ready,
      setName,
      setPhase,
      addAnswer,
      removeAnswer,
      recordStudy,
      removeWord,
      restartOnboarding,
    }),
    [profile, ready, setName, setPhase, addAnswer, removeAnswer, recordStudy, removeWord, restartOnboarding],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): Ctx {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
}
