import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="bienvenida" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="info-nutricional" />
        <Stack.Screen name="registro-comida" />
        <Stack.Screen name="registro-manual" />
        <Stack.Screen name="feedback" />
        <Stack.Screen name="editar-registro" />
        <Stack.Screen name="mi-cuenta" />
        <Stack.Screen name="exportar-historial" />
        <Stack.Screen name="ingredientes" />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
    </SafeAreaProvider>
  );
}
