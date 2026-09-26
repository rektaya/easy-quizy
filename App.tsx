import { Figtree_400Regular, Figtree_500Medium, useFonts } from '@expo-google-fonts/figtree';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FloatingTabBar } from './src/components/FloatingTabBar';
import ExploreScreen from './src/screens/ExploreScreen';
import PlaceholderScreen from './src/screens/PlaceholderScreen';
import { RatingsProvider } from './src/state/ratings';
import { colors } from './src/theme';

const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.bg, border: 'transparent' },
};

function StudyScreen() {
  return (
    <PlaceholderScreen
      title="study"
      note="small batches of your gathered words, mixed with reviews. coming after the explore prototype."
      showReset
    />
  );
}

function MapScreen() {
  return (
    <PlaceholderScreen
      title="map"
      note="your vocabulary as a growing constellation. every word you rate lights a dot."
      showDots
    />
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ Figtree_400Regular, Figtree_500Medium });
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <RatingsProvider>
          <NavigationContainer theme={navTheme}>
            <Tab.Navigator
              tabBar={(props) => <FloatingTabBar {...props} />}
              screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
            >
              <Tab.Screen name="Explore" component={ExploreScreen} />
              <Tab.Screen name="Study" component={StudyScreen} />
              <Tab.Screen name="Map" component={MapScreen} />
            </Tab.Navigator>
          </NavigationContainer>
        </RatingsProvider>
      </SafeAreaProvider>
      <StatusBar style="dark" />
    </GestureHandlerRootView>
  );
}
