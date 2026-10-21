import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { useTabBarSpace } from '../components/FloatingTabBar';
import { Choice, ChoiceText, Pill } from '../components/Choice';
import { ChevronDownIcon } from '../components/Icons';
import { Menu, MenuItem } from '../components/Menu';
import { PageHeader } from '../components/PageHeader';
import { Plate } from '../components/Plate';
import { StatusRing } from '../components/StatusRing';
import { THEMES, WORD_KINDS, findByGerman, parseGerman } from '../data/words';
import type { Word, WordKind } from '../data/words';
import type { WordStatus } from '../onboarding/status';
import { useProfile } from '../state/profile';
import { useRatings } from '../state/ratings';
import { colors, fonts, radius } from '../theme';

// Adding a word of your own (our list may have it already: while the german word is typed, matching words are offered,
// and a tap fills the whole form in; adding a word that is in the list just puts that word in your study words): its German form, its English meaning, an example in each language (optional), the
// topic it belongs to (one of ours), a note of your own (optional: what it is confused with, a sentence, how it connects to your life), and how well you know it already. The last one is what the circle says: it
// sets where the word starts (a word you know well goes straight to "learned").
const KNOW: { label: string; value: number; status: WordStatus }[] = [
  { label: 'not at all', value: 0.1, status: 'new' },
  { label: 'a little', value: 0.35, status: 'shaky' },
  { label: 'quite well', value: 0.65, status: 'getting' },
  { label: 'very well', value: 0.95, status: 'learned' },
];

export default function AddWordScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const { addOwnWord } = useProfile();
  const { rate } = useRatings();
  const [german, setGerman] = useState('');
  const [english, setEnglish] = useState('');
  const [exampleDe, setExampleDe] = useState('');
  const [exampleEn, setExampleEn] = useState('');
  const [note, setNote] = useState('');
  const [theme, setTheme] = useState<string | undefined>(undefined);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [know, setKnow] = useState(0);

  const scroller = useRef<ScrollView>(null);
  // the keyboard covers the tab bar, so the button needs no room for it then (the form was cropped to a few lines)
  const [keyboard, setKeyboard] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboard(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboard(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const [kind, setKind] = useState<WordKind | null>(null); // chosen by the user; until then it is worked out from what was typed
  const guessedKind: WordKind | null = parseGerman(german).article ? 'noun' : /^to\s/i.test(english.trim()) ? 'verb' : null;
  const shownKind = kind ?? guessedKind;
  const [filledId, setFilledId] = useState<string | null>(null); // the word from our list that the form was filled in from

  const ready = german.trim().length > 0 && english.trim().length > 0;
  const matches = findByGerman(german);
  const exact = matches.find((w) => w.lemma.toLowerCase() === parseGerman(german).lemma.toLowerCase()) ?? null;
  // suggestions are shown until the form has been filled in from one of them
  const suggestions = filledId && matches.some((w) => w.id === filledId) && exact?.id === filledId ? [] : matches;

  const fillIn = (w: Word) => {
    setGerman(w.article ? `${w.article} ${w.lemma}` : w.lemma);
    setEnglish(w.en);
    setExampleDe(w.example.de);
    setExampleEn(w.example.en);
    setTheme(w.theme);
    setKind(w.pos === 'other' ? null : w.pos); // the list only knows nouns and verbs apart; the rest the user picks
    setFilledId(w.id);
  };

  const save = () => {
    if (!ready) return;
    // a word that is already in our list is not added twice: that word goes into the words you are learning
    const id = exact ? exact.id : `own-${Date.now().toString(36)}`;
    if (!exact) addOwnWord({ id, german, english, exampleDe, exampleEn, theme, kind: shownKind ?? undefined, note: note.trim() || undefined });
    rate(id, KNOW[know].value); // it joins the words you are learning, where you said you stand with it
    onBack();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
      <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
        <PageHeader title="add new word" onBack={onBack} />

        <ScrollView ref={scroller} style={styles.fill} contentContainerStyle={[styles.content, { paddingBottom: topicsOpen ? 220 : 16 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Field label="german word" value={german} onChange={(v) => { setGerman(v); setFilledId(null); }} placeholder="e.g. das Fahrrad">
            {suggestions.length > 0 ? (
              <Plate entering={FadeIn.duration(200)} exiting={FadeOut.duration(120)} style={styles.suggest}>
                <Text style={styles.suggestHead}>{exact ? 'this word is already in our list. tap it to fill in the rest' : 'already in our list? tap to fill in the rest'}</Text>
                {suggestions.map((w) => (
                  <Pressable key={w.id} onPress={() => { Keyboard.dismiss(); fillIn(w); }} accessibilityRole="button" accessibilityLabel={`fill in ${w.lemma}`} style={styles.suggestRow}>
                    <Text style={styles.suggestDe}>
                      {w.article ? <Text style={styles.suggestArticle}>{w.article} </Text> : null}
                      {w.lemma}
                    </Text>
                    <Text style={styles.suggestEn} numberOfLines={1}>
                      {w.en}
                    </Text>
                  </Pressable>
                ))}
              </Plate>
            ) : null}
          </Field>
          <Field label="english translation" value={english} onChange={setEnglish} placeholder="e.g. bicycle" />
          <View style={styles.group}>
            <Text style={styles.label}>part of speech</Text>
            <View style={styles.kinds}>
              {WORD_KINDS.map((k) => {
                const on = shownKind === k.key;
                return <Pill key={k.key} label={k.label} size="m" selected={on} onPress={() => setKind(on && kind === k.key ? null : k.key)} />;
              })}
            </View>
          </View>
          <Field label="example in german" value={exampleDe} onChange={setExampleDe} placeholder="optional" multiline capitalize />
          <Field label="example in english" value={exampleEn} onChange={setExampleEn} placeholder="optional" multiline capitalize />
          <Field
            label="your note"
            value={note}
            onChange={setNote}
            placeholder="optional. a word it is confused with? a sentence of your own? how does it connect to your life?"
            multiline
            capitalize
          />

          <View style={[styles.group, styles.topicGroup]}>
            <Text style={styles.label}>topic</Text>
            <View>
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                if (!topicsOpen) setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 60); // so the whole list is in view
                setTopicsOpen((v) => !v);
              }}
              accessibilityRole="button"
              accessibilityState={{ expanded: topicsOpen }}
              style={[styles.select, topicsOpen && styles.selectOpen]}
            >
              <Text style={[styles.selectText, !theme && styles.placeholder]}>
                {theme ? THEMES.find((t) => t.id === theme)?.en : 'choose a topic'}
              </Text>
              <ChevronDownIcon color={colors.accent} size={20} />
            </Pressable>
            {topicsOpen ? (
              <Menu style={styles.dropdown}>
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {THEMES.map((t) => (
                    <MenuItem
                      key={t.id}
                      label={t.en}
                      selected={theme === t.id}
                      onPress={() => {
                        setTheme(t.id);
                        setTopicsOpen(false);
                      }}
                    />
                  ))}
                </ScrollView>
              </Menu>
            ) : null}
            </View>
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>how well do you know it already?</Text>
            <View style={styles.know}>
              {KNOW.map((k, i) => (
                <Choice key={k.label} selected={know === i} onPress={() => setKnow(i)} style={styles.knowItem}>
                  <StatusRing status={k.status} size={22} />
                  <ChoiceText style={styles.knowText}>{k.label}</ChoiceText>
                </Choice>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={{ paddingBottom: keyboard ? 8 : tabSpace - 8, paddingTop: 8 }}>
          <Button label="add word" onPress={save} disabled={!ready} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  capitalize,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  multiline?: boolean;
  /** Sentences start with a capital; the words themselves are typed as they are ("das Fahrrad"). */
  capitalize?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        autoCorrect={false}
        autoCapitalize={capitalize ? 'sentences' : 'none'}
        multiline={multiline}
        style={[styles.input, multiline && styles.inputMulti]}
        accessibilityLabel={label}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  screen: { flex: 1, paddingHorizontal: 24 },
  // the title is in the middle of the row, the chevron at its left edge
  content: { paddingTop: 14, gap: 12 },
  group: { gap: 8 },
  label: { fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
  },
  inputMulti: { minHeight: 56, textAlignVertical: 'top' },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selectText: { fontFamily: fonts.regular, fontSize: 16, color: colors.text },
  placeholder: { color: colors.textTertiary },
  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectOpen: { borderColor: colors.accent },
  // the drop-down list of topics, over what is below it
  topicGroup: { zIndex: 10 },
  dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, maxHeight: 260 },
  suggest: { paddingVertical: 6 },
  suggestHead: { fontFamily: fonts.regular, fontSize: 12, color: colors.textSecondary, paddingHorizontal: 14, paddingVertical: 6 },
  suggestRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, paddingHorizontal: 14, paddingVertical: 9 },
  suggestDe: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  suggestArticle: { fontFamily: fonts.regular, color: colors.textSecondary },
  suggestEn: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.textSecondary },
  know: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  knowItem: { width: '48.5%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9 },
  knowText: { fontFamily: fonts.medium, fontSize: 13 },
});
