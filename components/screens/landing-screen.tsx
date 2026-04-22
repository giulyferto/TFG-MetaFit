import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { MetaFitColors } from '@/constants/theme';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

type LandingScreenProps = {
  onLoginPress?: () => void;
  onRegisterPress?: () => void;
};

export function LandingScreen({ onLoginPress, onRegisterPress }: LandingScreenProps) {
  const handleLoginPress = () => {
    if (onLoginPress) {
      onLoginPress();
    } else {
      router.push('/login');
    }
  };

  const handleRegisterPress = () => {
    if (onRegisterPress) {
      onRegisterPress();
    } else {
      router.push('/register');
    }
  };

  return (
    <ThemedView style={styles.container} lightColor={MetaFitColors.background.white}>
      {/* Hero */}
      <View style={styles.heroSection}>
        <Image source={require('@/assets/images/MetaFitLogo.png')} style={styles.logo} contentFit="contain" />

        <ThemedText style={styles.tagline} lightColor={MetaFitColors.text.secondary}>
          Tu asistente de nutrición inteligente
        </ThemedText>
      </View>

      {/* CTA card anchored to bottom */}
      <View style={styles.ctaCard}>
        <TouchableOpacity style={styles.loginButton} onPress={handleLoginPress} activeOpacity={0.82}>
          <ThemedText style={styles.loginButtonText} lightColor={MetaFitColors.text.white}>
            Iniciar sesión
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <ThemedText style={styles.registerQuestion} lightColor={MetaFitColors.text.secondary}>
            ¿No tienes cuenta?{' '}
          </ThemedText>
          <TouchableOpacity onPress={handleRegisterPress} activeOpacity={0.7}>
            <ThemedText style={styles.registerLink} lightColor={MetaFitColors.button.primary}>
              Registrarme
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MetaFitColors.background.white,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 48,
  },

  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },

  logo: {
    width: 158,
    height: 158,
  },

  tagline: {
    fontSize: 16,
    letterSpacing: 0.2,
    textAlign: 'center',
    lineHeight: 24,
  },

  ctaCard: {
    width: '100%',
    backgroundColor: MetaFitColors.background.card,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: MetaFitColors.text.primary,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: MetaFitColors.border.divider,
  },

  loginButton: {
    backgroundColor: MetaFitColors.button.primary,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: MetaFitColors.button.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },

  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  registerQuestion: {
    fontSize: 14,
  },

  registerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
