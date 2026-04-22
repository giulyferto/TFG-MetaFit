/**
 * MetaFit Design System — Logo Palette (Warm & Light)
 * Inspired directly by the MetaFit logo: steel blue ring, warm cream fill, sand accent.
 */

import { Platform } from 'react-native';

const tintColorLight = '#5B96B0';
const tintColorDark = '#5B96B0';

export const Colors = {
  light: {
    text: '#2C3E50',
    background: '#F2EDE4',
    tint: tintColorLight,
    icon: '#7A9AAA',
    tabIconDefault: '#7A9AAA',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#2C3E50',
    background: '#F2EDE4',
    tint: tintColorDark,
    icon: '#7A9AAA',
    tabIconDefault: '#7A9AAA',
    tabIconSelected: tintColorDark,
  },
};

// Colores de la aplicación MetaFit — Paleta del logo (crema cálida + azul acero)
export const MetaFitColors = {
  // Colores de texto
  text: {
    primary: '#2C3E50',      // Azul-charcoal profundo
    secondary: '#6B7C8D',    // Gris-azulado medio
    tertiary: '#A8B8C4',     // Gris-azulado claro
    white: '#FFFFFF',        // Blanco puro
    onAccent: '#FFFFFF',     // Texto sobre botones
  },
  // Colores de fondo
  background: {
    white: '#F2EDE4',        // Crema cálida (relleno interior del logo)
    beige: '#EAE4DA',        // Crema más profunda (tab bar, dividers)
    transparent: 'transparent',
    card: '#FFFFFF',         // Cards blancas sobre fondo crema
    elevated: '#EEF5F9',     // Azul muy claro (círculo azul del logo)
  },
  // Colores de bordes
  border: {
    light: '#DDD6CC',        // Borde gris-cálido
    divider: '#EDE8E0',      // Divisor muy sutil
    beige: '#EAE4DA',
    accent: '#B8CDD6',       // Borde con tinte azul-acero
  },
  // Colores de estado
  error: '#E05252',
  // Colores de botones
  button: {
    primary: '#5B96B0',      // Azul acero del logo (ligeramente intensificado)
    secondary: '#EEF5F9',    // Azul muy claro para botones secundarios
    active: '#EAE4DA',
  },
  // Colores de calificación
  calificacion: {
    alta: '#4A9E6B',         // Verde muted
    media: '#C9943A',        // Ámbar dorado (cálido como el acento arena del logo)
    baja: '#C94848',         // Rojo muted
  },
  // Color de acento arena del logo
  accent: {
    sand: '#C9A882',         // Acento arena/melocotón del logo
    sandLight: '#F0E6D8',    // Versión muy clara
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
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
