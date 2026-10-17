import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isKnown } from '../circle/geometry';
import { carryOver } from '../data/renamedWords';

export type Rating = {
  /** Continuous circle value, 0..1. */
  value: number;
  /** True when the rating fell in the last ("know it for sure") segment. */
  known: boolean;
  at: number;
};

type Ratings = Record<string, Rating>;

type Ctx = {
  ready: boolean;
  ratings: Ratings;
  /** Words gathered for study: everything rated below the "know" segment. */
  pileCount: number;
  rate: (wordId: string, value: number) => void;
  unrate: (wordId: string) => void;
  reset: () => void;
};

const KEY = 'easyquizy.ratings.v1';
const RatingsContext = createContext<Ctx | null>(null);

export function RatingsProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [ratings, setRatings] = useState<Ratings>({});

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setRatings(carryOver(JSON.parse(raw)));
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(ratings)).catch(() => {});
  }, [ratings, ready]);

  const rate = useCallback((wordId: string, value: number) => {
    setRatings((prev) => ({ ...prev, [wordId]: { value, known: isKnown(value), at: Date.now() } }));
  }, []);

  const unrate = useCallback((wordId: string) => {
    setRatings((prev) => {
      const { [wordId]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const reset = useCallback(() => setRatings({}), []);

  const value = useMemo<Ctx>(
    () => ({
      ready,
      ratings,
      pileCount: Object.values(ratings).filter((r) => !r.known).length,
      rate,
      unrate,
      reset,
    }),
    [ready, ratings, rate, unrate, reset],
  );

  return <RatingsContext.Provider value={value}>{children}</RatingsContext.Provider>;
}

export function useRatings(): Ctx {
  const ctx = useContext(RatingsContext);
  if (!ctx) throw new Error('useRatings must be used inside RatingsProvider');
  return ctx;
}
