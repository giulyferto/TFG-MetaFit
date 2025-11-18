/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// Colores de la aplicación MetaFit
export const MetaFitColors = {
  // Colores de texto
  text: {
    primary: '#333333',
    secondary: '#666666',
    tertiary: '#999999',
    white: '#FFFFFF',
  },
  // Colores de fondo
  background: {
    white: '#FFFFFF',
    beige: '#f1f0e8',
    transparent: 'transparent',
  },
  // Colores de bordes
  border: {
    light: '#E0E0E0',
    divider: '#F0F0F0',
    beige: '#f1f0e8',
  },
  // Colores de estado
  error: '#FF0000',
  // Colores de botones
  button: {
    primary: '#96b6c5',
    secondary: '#cce6f1',
    active: '#f1f0e8',
  },
  // Colores de calificación
  calificacion: {
    alta: '#4CAF50', // Verde
    media: '#FFC107', // Amarillo
    baja: '#F44336', // Rojo
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
