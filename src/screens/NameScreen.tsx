import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { colors, fonts, radius } from '../theme';

// The first thing a new user sees: a name, stored on the device only. No login.
export default function NameScreen({ onSubmit }: { onSubmit: (name: string) => void }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const ready = name.trim().length > 0;
  const submit = () => ready && onSubmit(name);

  // The padding sits on an inner view: KeyboardAvoidingView overwrites its own bottom padding
  // with the keyboard height, which used to leave the button flush against the keyboard.
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen}>
      <View style={[styles.inner, { paddingTop: insets.top + 24, paddingBottom: 24 }]}>
        <View style={styles.body}>
          <Text style={styles.title}>let’s get to know each other first</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            onSubmitEditing={submit}
            placeholder="your name"
            placeholderTextColor={colors.textTertiary}
            autoFocus
            autoCorrect={false}
            returnKeyType="go"
            maxLength={30}
            style={styles.input}
            accessibilityLabel="your name"
          />
        </View>
        <Button label="continue" onPress={submit} disabled={!ready} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 24 },
  body: { flex: 1, justifyContent: 'center', gap: 18 },
  title: { fontFamily: fonts.medium, fontSize: 28, lineHeight: 36, color: colors.text },
  input: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontFamily: fonts.medium,
    fontSize: 18,
    color: colors.text,
  },
});
