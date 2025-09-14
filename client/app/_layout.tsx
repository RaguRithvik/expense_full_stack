import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import {
    Rubik_400Regular,
    Rubik_700Bold,
} from '@expo-google-fonts/rubik';

import { useColorScheme } from '@/hooks/useColorScheme';
import { IncomeProvider } from '../contexts/IncomeContext';
import { ExpenseProvider } from '../contexts/ExpenseContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    'Rubik-Regular': Rubik_400Regular,
    'Rubik-Bold': Rubik_700Bold,
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ExpenseProvider>
      <IncomeProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="light" backgroundColor="transparent" translucent />
        </ThemeProvider>
      </IncomeProvider>
    </ExpenseProvider>
  );
}
