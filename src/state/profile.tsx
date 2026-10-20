import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Answer } from '../onboarding/calibration';
import { carryOver, RENAMED_WORDS } from '../data/renamedWords';
import { currentTheme, registerOwnWords } from '../data/words';
import type { OwnWord } from '../data/words';
import { DEFAULT_FEED } from '../onboarding/feed';
import type { FeedOptions } from '../onboarding/feed';
import { DEFAULT_SESSION_WORDS } from '../onboarding/batch';
import type { SessionWords } from '../onboarding/batch';
import { firstStudy, reviewCard } from '../srs/scheduler';
import type { StoredCard } from '../srs/scheduler';

/**
 * Where the user is in the first-run path: welcome, name, an intro, the way of exploring, the session size, a practice word, the quick-test
 * screen, 15 words, a message. ('study' is an older value, kept so saved profiles still load; it is treated as done.)
 */
export type Phase = 'welcome' | 'name' | 'way' | 'intro' | 'pace' | 'practice' | 'quiz' | 'calibration' | 'message' | 'study' | 'done';

/** The daily reminder to come back to the words. */
export type Reminder = { on: boolean; hour: number; minute: number; asked: boolean };

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
  reminder: Reminder;
  /** Setting: how many words a Study session holds (reviews and new words together). */
  sessionWords: SessionWords;
  /** How Explore chooses the next word ("explore by ...") and its filters. */
  explore: ExploreSettings;
  /** Themes the user likes: Explore brings words from them more often. */
  interests: string[];
  /** Words the user added themselves (the plus in Study). */
  ownWords: OwnWord[];
  /** Every review in Study: the first answer (`confidence`, drawn before the meaning was shown) and the answer after it was adjusted (`value`, the one FSRS used). */
  reviewLog: ReviewEntry[];
};

export type ReviewEntry = { id: string; at: number; confidence: number; value: number };

export type ExploreSettings = Omit<FeedOptions, 'interests'>;

type Ctx = Profile & {
  ready: boolean;
  /** The theme "explore from here" was tapped on in the Map; Explore takes it and clears it. */
  seedTheme: string | null;
  /** A word whose card was asked for from another card (a chip "often together with"): the Map opens it, and clears this. */
  wordRequest: string | null;
  setWordRequest: (wordId: string | null) => void;
  setSeedTheme: (themeId: string | null) => void;
  setName: (name: string) => void;
  setPhase: (phase: Phase) => void;
  setMapIntroSeen: () => void;
  setReminder: (patch: Partial<Reminder>) => void;
  setSessionWords: (words: SessionWords) => void;
  setExplore: (patch: Partial<ExploreSettings>) => void;
  addOwnWord: (word: OwnWord) => void;
  /** Change the name later (the first-run path sets it with setName). */
  rename: (name: string) => void;
  addAnswer: (answer: Answer) => void;
  removeAnswer: (wordId: string) => void;
  /**
   * Rate a word in Study. The first time, its card is seeded from the Explore rating (`explore`),
   * then this rating reviews it; after that it is a plain review.
   */
  reviewWord: (wordId: string, value: number, explore: { value: number; at: number } | undefined) => void;
  /**
   * The answer to a word in Study was changed after its meaning was shown: the review is done again from `before`
   * (the card as it was, or none) with the new value. The log keeps both answers.
   */
  adjustReview: (wordId: string, before: StoredCard | undefined, value: number, explore: { value: number; at: number } | undefined) => void;
  /** Delete a word from the pile for good (its rating is removed separately). */
  removeWord: (wordId: string) => void;
  /** Back to the very start of the first-run path (the ratings are reset separately). */
  restartOnboarding: () => void;
};

const KEY = 'easyquizy.profile.v1';
const INITIAL: Profile = { name: '', phase: 'welcome', answers: [], cards: {}, removed: {}, skySeed: 0, mapIntroSeen: false, reminder: { on: false, hour: 19, minute: 0, asked: false }, sessionWords: DEFAULT_SESSION_WORDS, explore: { ...DEFAULT_FEED }, interests: [], ownWords: [], reviewLog: [] };
const ProfileContext = createContext<Ctx | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile>(INITIAL);
  const [seedTheme, setSeedTheme] = useState<string | null>(null); // not saved: it only bridges Map -> Explore
  const [wordRequest, setWordRequest] = useState<string | null>(null); // not saved: it only bridges a word card -> the Map

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) {
          const stored = JSON.parse(raw);
          const saved = { ...INITIAL, ...stored } as Profile & { quickSessions?: boolean };
          // the old "quick sessions" switch became the size of a session
          if (stored.sessionWords === undefined) saved.sessionWords = stored.quickSessions ? 10 : DEFAULT_SESSION_WORDS;
          delete saved.quickSessions;
          // the interests step was replaced by the way of exploring; someone who left in it goes on to the new step
          if ((stored.phase as string) === 'interests') saved.phase = 'way';
          registerOwnWords(saved.ownWords); // the words the user added join the list before anything is drawn
          // words whose id changed (the reflexive verbs) keep their cards, deletions and answers
          saved.cards = carryOver(saved.cards);
          saved.removed = carryOver(saved.removed);
          saved.answers = (saved.answers ?? []).map((a) => ({ ...a, id: RENAMED_WORDS[a.id] ?? a.id }));
          // topics that were merged into bigger ones (work, home, kitchen, ...) are carried across
          saved.interests = [...new Set((saved.interests ?? []).map(currentTheme).filter((t): t is string => !!t))];
          if (saved.explore?.theme) saved.explore = { ...saved.explore, theme: currentTheme(saved.explore.theme) };
          setProfile(saved);
        }
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
  const setReminder = useCallback((patch: Partial<Reminder>) => setProfile((p) => ({ ...p, reminder: { ...p.reminder, ...patch } })), []);
  const setSessionWords = useCallback((sessionWords: SessionWords) => setProfile((p) => ({ ...p, sessionWords })), []);
  const setExplore = useCallback((patch: Partial<ExploreSettings>) => setProfile((p) => ({ ...p, explore: { ...p.explore, ...patch } })), []);
  const addOwnWord = useCallback((word: OwnWord) => {
    registerOwnWords([word]);
    setProfile((p) => ({ ...p, ownWords: [...p.ownWords, word] }));
  }, []);
  const rename = useCallback((name: string) => setProfile((p) => ({ ...p, name: name.trim() || p.name })), []);
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
        return {
          ...p,
          cards: { ...p.cards, [wordId]: card },
          reviewLog: [...p.reviewLog, { id: wordId, at: now, confidence: value, value }],
        };
      }),
    [],
  );
  const adjustReview = useCallback(
    (wordId: string, before: StoredCard | undefined, value: number, explore: { value: number; at: number } | undefined) =>
      setProfile((p) => {
        const now = Date.now();
        const card = before
          ? reviewCard(before, value, now)
          : firstStudy(explore?.value ?? value, explore?.at ?? now, value, now);
        const log = [...p.reviewLog];
        for (let i = log.length - 1; i >= 0; i--) {
          if (log[i].id === wordId) {
            log[i] = { ...log[i], value };
            break;
          }
        }
        return { ...p, cards: { ...p.cards, [wordId]: card }, reviewLog: log };
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
      wordRequest,
      setWordRequest,
      setSeedTheme,
      setName,
      setPhase,
      setMapIntroSeen,
      setReminder,
      setSessionWords,
      setExplore,
      addOwnWord,
      rename,
      addAnswer,
      removeAnswer,
      reviewWord,
      adjustReview,
      removeWord,
      restartOnboarding,
    }),
    [profile, ready, seedTheme, wordRequest, setName, setPhase, setMapIntroSeen, setReminder, setSessionWords, setExplore, addOwnWord, rename, addAnswer, removeAnswer, reviewWord, adjustReview, removeWord, restartOnboarding],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): Ctx {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
}
