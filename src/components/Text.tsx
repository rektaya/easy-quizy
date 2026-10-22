import React from 'react';
import { StyleSheet, Text as RNText, TextInput as RNTextInput } from 'react-native';
import type { StyleProp, TextInputProps, TextProps, TextStyle } from 'react-native';
import { tracking } from '../theme';

// The app's Text and TextInput: the same as React Native's, but the letters are set a little tighter (`tracking`, theme.ts).
// React Native has no letter-spacing in em, so the spacing is worked out from the size of the text in its style. A text with
// its own `letterSpacing` keeps it, and a nested text with no size of its own takes the spacing of the text around it.
// Every screen takes `Text` and `TextInput` from here, never from react-native.
function tracked(style: StyleProp<TextStyle>): StyleProp<TextStyle> {
  const flat = StyleSheet.flatten(style);
  if (!flat || flat.fontSize == null || flat.letterSpacing != null) return style;
  return [style, { letterSpacing: tracking(flat.fontSize) }];
}

export const Text = React.forwardRef<RNText, TextProps>(function Text({ style, ...rest }, ref) {
  return <RNText ref={ref} {...rest} style={tracked(style)} />;
});

export const TextInput = React.forwardRef<RNTextInput, TextInputProps>(function TextInput({ style, ...rest }, ref) {
  return <RNTextInput ref={ref} {...rest} style={tracked(style)} />;
});
