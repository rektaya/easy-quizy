import React, { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { ChevronLeftIcon, SearchIcon, SortIcon, TrashIcon } from '../components/Icons';
import { HEADER_HEIGHT, TabHeader } from '../components/TabHeader';
import { WordCard } from '../components/WordCard';
import { WORDS } from '../data/words';
import type { Word } from '../data/words';
import { RING_AMBER, RING_GREEN, RING_RED } from '../circle/color';
import { STATUS_LABEL, STATUS_ORDER, statusOf } from '../onboarding/status';
import type { Status } from '../onboarding/status';
import { useProfile } from '../state/profile';
import { useRatings } from '../state/ratings';
import { colors, fonts, radius, shadow } from '../theme';

const STATUS_COLOR: Record<Status, string> = {
  new: '#AEB8C3',
  shaky: RING_RED,
  getting: RING_AMBER,
  solid: '#9ACD5A',
  learned: RING_GREEN,
};

type Sort = 'status' | 'a-z' | 'newest';
const SORTS: { key: Sort; label: string }[] = [
  { key: 'status', label: 'status' },
  { key: 'a-z', label: 'a–z' },
  { key: 'newest', label: 'newest' },
];

// The Study tab's home: the words you are learning (gathered, not yet learned), with where each stands:
// searchable, sortable, and each one can be deleted. Tapping a word opens its full card. The "study"
// buttons start a session ("quick study", or "study all"). Deleting asks first, in a window, and the word is
// never offered again.
export default function WordsScreen({
  bottomSpace,
  sessions,
  note,
}: {
  bottomSpace: number;
  /** The sessions that can be started now (a quick one, a longer one): a button each. */
  sessions: { label: string; caption: string; onPress: () => void }[];
  /** Said above the buttons when no session is ready. */
  note?: string;
}) {
  const insets = useSafeAreaInsets();
  const { ratings, unrate } = useRatings();
  const { cards, removeWord } = useProfile();
  const [openId, setOpenId] = useState<string | null>(null); // the word whose card is showing
  const nudged = useRef(false); // the first card of a visit shows a little sideways nudge, to say "swipe"
  const [query, setQuery] = useState('');
  const [sortOpen, setSortOpen] = useState(false); // the list of ways to sort, hidden behind the sort icon
  const [searching, setSearching] = useState(false); // the search field is hidden until the magnifier is tapped
  const [sort, setSort] = useState<Sort>('status');

  const q = query.trim().toLowerCase();
  // a word marked known in Explore has no card; it counts as learned
  const statusFor = (id: string): Status => (!cards[id] && ratings[id]?.known ? 'learned' : statusOf(cards[id]));
  // the words in study: gathered, and not yet learned
  const inPile = WORDS.filter((w) => ratings[w.id] && statusFor(w.id) !== 'learned');
  const shown = inPile
    .filter((w) => !q || w.lemma.toLowerCase().includes(q) || w.en.toLowerCase().includes(q))
    .sort((a, b) => {
      if (sort === 'newest') return ratings[b.id].at - ratings[a.id].at;
      if (sort === 'a-z') return a.lemma.localeCompare(b.lemma, 'de');
      return (
        STATUS_ORDER.indexOf(statusFor(a.id)) - STATUS_ORDER.indexOf(statusFor(b.id)) ||
        a.lemma.localeCompare(b.lemma, 'de')
      );
    });

  const openIndex = openId ? shown.findIndex((w) => w.id === openId) : -1;

  // Deleting asks first, in a window: the word is never offered again.
  const remove = (id: string, lemma: string) => {
    Alert.alert(
      'delete this word?',
      `are you sure you want to delete “${lemma}”? it will not be offered to you again.`,
      [
        { text: 'cancel', style: 'cancel' },
        {
          text: 'delete',
          style: 'destructive',
          onPress: () => {
            unrate(id);
            removeWord(id);
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: bottomSpace }]}>
      <TabHeader
        title="study"
        right={
          <View style={styles.headerIcons}>
            <Pressable
              onPress={() => {
                setSortOpen((v) => !v);
                setSearching(false);
                setQuery('');
              }}
              accessibilityRole="button"
              accessibilityLabel={`sort words, now by ${SORTS.find((o) => o.key === sort)?.label}`}
              accessibilityState={{ expanded: sortOpen }}
              hitSlop={8}
              style={[styles.iconButton, sortOpen && styles.iconButtonOn]}
            >
              <SortIcon color={sortOpen ? colors.onAccent : colors.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() => {
                if (searching) setQuery('');
                setSearching((v) => !v);
                setSortOpen(false);
              }}
              accessibilityRole="button"
              accessibilityLabel={searching ? 'close the search' : 'search words'}
              accessibilityState={{ selected: searching }}
              hitSlop={8}
              style={[styles.iconButton, searching && styles.iconButtonOn]}
            >
              <SearchIcon color={searching ? colors.onAccent : colors.textSecondary} />
            </Pressable>
          </View>
        }
      />

      {searching ? (
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="search words"
          placeholderTextColor={colors.textTertiary}
          autoFocus
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          returnKeyType="search"
          style={styles.search}
          accessibilityLabel="search words"
        />
      ) : null}

      <ScrollView
        contentContainerStyle={{ paddingBottom: 8, gap: 10 }}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {shown.length === 0 ? (
          <Text style={styles.empty}>{q ? 'no words match' : 'no words yet. rate some in explore'}</Text>
        ) : null}
        {shown.map((w) => {
          const status = statusFor(w.id);
          return (
            <View key={w.id} style={styles.row}>
              <Pressable
                style={styles.open}
                onPress={() => {
                  setOpenId(w.id);
                }}
                accessibilityRole="button"
                accessibilityLabel={`${w.article ? w.article + ' ' : ''}${w.lemma}, ${w.en}: open the card`}
              >
                <View style={styles.text}>
                  <Text style={styles.lemma}>
                    {w.article ? <Text style={styles.article}>{w.article} </Text> : null}
                    {w.lemma}
                  </Text>
                  <Text style={styles.en} numberOfLines={1}>
                    {w.en}
                  </Text>
                </View>
                <View style={styles.status}>
                  <View style={[styles.dot, { backgroundColor: STATUS_COLOR[status] }]} />
                  <Text style={styles.statusText}>{STATUS_LABEL[status]}</Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => remove(w.id, w.lemma)}
                accessibilityRole="button"
                accessibilityLabel={`delete ${w.lemma}`}
                hitSlop={6}
                style={styles.trash}
              >
                <TrashIcon color={colors.textSecondary} />
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.action}>
        {sessions.length === 0 && note ? <Text style={styles.note}>{note}</Text> : null}
        {sessions.length === 0 ? <Button label="quick study" onPress={() => {}} disabled /> : null}
        <View style={styles.buttons}>
          {sessions.map((s, i) => (
            <View key={s.label} style={styles.session}>
              <Button label={s.label} onPress={s.onPress} kind={i === 0 ? 'primary' : 'ghost'} />
              <Text style={styles.caption}>{s.caption}</Text>
            </View>
          ))}
        </View>
      </View>

      {sortOpen ? (
        // the ways to sort are hidden in here until the sort icon is tapped
        <View style={[styles.menu, { top: insets.top + 12 + HEADER_HEIGHT + 6 }]}>
          {SORTS.map((o) => (
            <Pressable
              key={o.key}
              onPress={() => {
                setSort(o.key);
                setSortOpen(false);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: sort === o.key }}
              style={styles.menuItem}
            >
              <Text style={[styles.menuText, sort === o.key && styles.menuTextOn]}>{o.label}</Text>
              {sort === o.key ? <View style={styles.menuDot} /> : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      {openIndex >= 0 ? (
        <CardPager
          words={shown}
          startIndex={openIndex}
          onClose={() => setOpenId(null)}
          tagFor={(id) => STATUS_LABEL[statusFor(id)]}
          top={insets.top + 12}
          bottom={bottomSpace}
          nudged={nudged}
        />
      ) : null}
    </View>
  );
}

// A word's card over the list. Swipe up for the next word of the list and down for the previous one, the same
// motion as moving on in Explore and Study (the card follows the finger). The first card of a visit gives a
// small nudge upwards, to say "swipe". The only way out is the chevron (the same back chevron as on Profile).
function CardPager({
  words,
  startIndex,
  onClose,
  tagFor,
  top,
  bottom,
  nudged,
}: {
  words: Word[];
  startIndex: number;
  onClose: () => void;
  tagFor: (id: string) => string;
  top: number;
  bottom: number;
  nudged: React.MutableRefObject<boolean>;
}) {
  const { height } = useWindowDimensions();
  const dy = useSharedValue(0);
  // the position lives here, not in the list: moving to the next word redraws only this card, so it stays smooth
  const [index, setIndex] = useState(startIndex);
  const hasPrev = index > 0;
  const hasNext = index < words.length - 1;

  React.useEffect(() => {
    if (nudged.current || !hasNext) return;
    nudged.current = true;
    dy.value = withDelay(550, withSequence(withTiming(-26, { duration: 220 }), withTiming(0, { duration: 320 })));
  }, [hasNext, dy, nudged]);

  // dir +1: the next word (the card leaves upwards, the next one rises from below), -1: the previous one
  const go = (dir: number) => {
    setIndex((i) => i + dir);
    // jump to the entry side and glide in, as one animation (so the order is certain)
    dy.value = withSequence(
      withTiming(dir * height * 0.3, { duration: 0 }),
      withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) }),
    );
  };
  const swipe = Gesture.Pan()
    .activeOffsetY([-14, 14])
    .failOffsetX([-24, 24])
    .onUpdate((e) => {
      'worklet';
      const blocked = (e.translationY < 0 && !hasNext) || (e.translationY > 0 && !hasPrev);
      dy.value = blocked ? e.translationY * 0.25 : e.translationY;
    })
    .onEnd((e) => {
      'worklet';
      const dir = e.translationY < 0 ? 1 : -1;
      const wants = Math.abs(e.translationY) > 80 || Math.abs(e.velocityY) > 650;
      if (wants && ((dir === 1 && hasNext) || (dir === -1 && hasPrev))) {
        dy.value = withTiming(-dir * height * 0.6, { duration: 170, easing: Easing.in(Easing.cubic) }, (finished) => {
          'worklet';
          if (finished) scheduleOnRN(go, dir);
        });
      } else {
        dy.value = withSpring(0, { damping: 18, stiffness: 220 });
      }
    });
  const cardStyle = useAnimatedStyle(() => ({
    opacity: 1 - 0.6 * Math.min(1, Math.abs(dy.value) / (height * 0.5)),
    transform: [{ translateY: dy.value }],
  }));

  const word = words[index];
  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="close the card" accessibilityRole="button" />
      <View style={[styles.cardWrap, { paddingTop: top, paddingBottom: bottom }]} pointerEvents="box-none">
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="back to the list" hitSlop={12} style={styles.back}>
          <ChevronLeftIcon color={colors.accent} size={28} />
        </Pressable>
        <GestureDetector gesture={swipe}>
          <Animated.View style={[styles.pagerCard, cardStyle]}>
            <WordCard word={word} tag={tagFor(word.id)} fade={false} />
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // the card of a tapped word, over the list (tap outside it to close)
  overlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(8,16,26,0.95)' },
  cardWrap: { flex: 1, paddingHorizontal: 24, gap: 12 },
  pagerCard: { flex: 1 },
  back: { height: 32, justifyContent: 'center', marginLeft: -6, alignSelf: 'flex-start' },
  screen: { flex: 1, paddingHorizontal: 24, gap: 12 },
  search: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
  },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconButton: { width: 34, height: 34, borderRadius: radius.chip, alignItems: 'center', justifyContent: 'center' },
  iconButtonOn: { backgroundColor: colors.accent },
  menu: {
    position: 'absolute',
    right: 24,
    minWidth: 150,
    paddingVertical: 6,
    borderRadius: radius.tile,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadow,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 11 },
  menuText: { fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary },
  menuTextOn: { fontFamily: fonts.medium, color: colors.text },
  menuDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  list: { flex: 1 },
  buttons: { flexDirection: 'row', gap: 12 },
  session: { flex: 1, gap: 6 },
  caption: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
  action: { gap: 10, paddingTop: 4 },
  note: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: radius.tile,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  open: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  text: { flex: 1, gap: 2 },
  lemma: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  article: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  en: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary },
  trash: { width: 36, height: 36, borderRadius: radius.tile, alignItems: 'center', justifyContent: 'center' },
});
