import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabBarSpace } from '../components/FloatingTabBar';
import { ChevronLeftIcon } from '../components/Icons';
import { colors, fonts, radius } from '../theme';

// Where the words, the sentences and the type come from, and under which licence. Reached from the profile.
type Source = { title: string; what: string; licence: string; links: { label: string; url: string }[] };

const SOURCES: Source[] = [
  {
    title: 'words and meanings',
    what: 'Wiktionary, the free dictionary written by its community. The entries come from the English edition, read with Wiktextract (Tatu Ylönen) through kaikki.org.',
    licence: 'CC BY-SA 4.0',
    links: [
      { label: 'wiktionary.org', url: 'https://www.wiktionary.org' },
      { label: 'kaikki.org', url: 'https://kaikki.org' },
    ],
  },
  {
    title: 'example sentences',
    what: 'Tatoeba, a collection of sentences and their translations written by volunteers all over the world.',
    licence: 'CC BY 2.0 FR (some sentences CC0)',
    links: [{ label: 'tatoeba.org', url: 'https://tatoeba.org' }],
  },
  {
    title: 'how common a word is',
    what: 'FrequencyWords by Hermit Dave, made from the OpenSubtitles collection of film and series subtitles.',
    licence: 'CC BY-SA 4.0',
    links: [
      { label: 'FrequencyWords', url: 'https://github.com/hermitdave/FrequencyWords' },
      { label: 'opensubtitles.org', url: 'https://www.opensubtitles.org' },
    ],
  },
  {
    title: 'when a word comes back',
    what: 'FSRS, the Free Spaced Repetition Scheduler, by Jarrett Ye and the open-spaced-repetition community, through the ts-fsrs library.',
    licence: 'MIT',
    links: [{ label: 'ts-fsrs', url: 'https://github.com/open-spaced-repetition/ts-fsrs' }],
  },
  {
    title: 'type',
    what: 'Figtree, designed by Erik D. Kennedy and the Figtree Project Authors.',
    licence: 'SIL Open Font License 1.1',
    links: [{ label: 'Figtree', url: 'https://github.com/erikdkennedy/figtree' }],
  },
  {
    title: 'built with',
    what: 'Expo, React Native, React Native Skia, React Native Reanimated and many other open-source libraries.',
    licence: 'mostly MIT',
    links: [{ label: 'expo.dev', url: 'https://expo.dev' }],
  },
];

export default function CreditsScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace(); // scroll clear of the floating tab bar
  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="back" hitSlop={12} style={styles.back}>
          <ChevronLeftIcon color={colors.accent} size={28} />
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">
          credits
        </Text>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabSpace + 16 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>easy quizy is made from the work of many people. thank you.</Text>
        {SOURCES.map((s) => (
          <View key={s.title} style={styles.card}>
            <Text style={styles.cardTitle}>{s.title}</Text>
            <Text style={styles.what}>{s.what}</Text>
            <Text style={styles.licence}>licence: {s.licence}</Text>
            <View style={styles.links}>
              {s.links.map((l) => (
                <Pressable key={l.url} onPress={() => Linking.openURL(l.url)} accessibilityRole="link" hitSlop={6}>
                  <Text style={styles.link}>{l.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
        <Text style={styles.note}>
          the word list in this app is made from the sources above. where their licence says share-alike (CC BY-SA), the list is shared under the same terms.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  // the title is in the middle of the row, the chevron at its left edge
  header: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, minHeight: 32 },
  back: { position: 'absolute', left: 18, top: 0, height: 32, justifyContent: 'center' },
  title: { fontFamily: fonts.medium, fontSize: 22, color: colors.text, textAlign: 'center', paddingHorizontal: 34 },
  content: { paddingHorizontal: 24, paddingTop: 20, gap: 12 },
  intro: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23, color: colors.textSecondary, marginBottom: 4 },
  card: {
    gap: 6,
    padding: 16,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  cardTitle: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  what: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  licence: { fontFamily: fonts.regular, fontSize: 13, color: colors.textTertiary, marginTop: 2 },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 4 },
  link: { fontFamily: fonts.medium, fontSize: 14, color: colors.accent },
  note: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.textTertiary, marginTop: 8 },
});
