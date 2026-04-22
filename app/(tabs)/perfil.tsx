import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { MetaFitColors } from '@/constants/theme';
import { auth } from '@/firebase';
import { useRouter } from 'expo-router';
import { signOut, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ConfigOption = {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  onPress: () => void;
  isDestructive?: boolean;
};

export default function PerfilScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const currentUser = auth.currentUser;
    setUser(currentUser);
    setLoading(false);
  }, []);

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace('/login');
            } catch (error: any) {
              console.error('Error al cerrar sesión:', error);
              Alert.alert('Error', 'No se pudo cerrar sesión. Por favor intenta de nuevo.');
            }
          },
        },
      ]
    );
  };

  const configOptions: ConfigOption[] = [
    {
      id: 'account',
      title: 'Mi cuenta',
      subtitle: 'Gestionar información de cuenta',
      icon: 'person.circle',
      onPress: () => {
        Alert.alert('Mi Cuenta', 'Funcionalidad en desarrollo');
      },
    },
    {
      id: 'signout',
      title: 'Cerrar sesión',
      subtitle: 'Salir de tu cuenta',
      icon: 'arrow.right.square',
      onPress: handleSignOut,
      isDestructive: true,
    },
  ];

  if (loading) {
    return (
      <ThemedView
        style={[styles.container, { paddingTop: insets.top }]}
        lightColor={MetaFitColors.background.white}
      >
        <ActivityIndicator size="large" color={MetaFitColors.button.primary} />
      </ThemedView>
    );
  }

  const emailInitial = user?.email?.charAt(0).toUpperCase() ?? '?';

  return (
    <ThemedView style={styles.container} lightColor={MetaFitColors.background.white}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header */}
        <View style={styles.profileHeader}>
          {/* Avatar */}
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <ThemedText style={styles.avatarInitial} lightColor={MetaFitColors.text.white}>
                {emailInitial}
              </ThemedText>
            </View>
          </View>

          <ThemedText style={styles.title} lightColor={MetaFitColors.text.primary}>
            Perfil
          </ThemedText>
          {user && (
            <ThemedText style={styles.email} lightColor={MetaFitColors.text.secondary}>
              {user.email}
            </ThemedText>
          )}
        </View>

        {/* Options */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle} lightColor={MetaFitColors.text.tertiary}>
            Cuenta
          </ThemedText>
          <View style={styles.optionsContainer}>
            {configOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  option.isDestructive && styles.optionButtonDestructive,
                ]}
                onPress={option.onPress}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: option.isDestructive
                        ? "rgba(252, 129, 129, 0.12)"
                        : MetaFitColors.background.elevated,
                    },
                  ]}
                >
                  <IconSymbol
                    name={option.icon as any}
                    size={20}
                    color={
                      option.isDestructive
                        ? MetaFitColors.error
                        : MetaFitColors.text.secondary
                    }
                  />
                </View>
                <View style={styles.optionTextGroup}>
                  <ThemedText
                    style={[
                      styles.optionText,
                      option.isDestructive && styles.optionTextDestructive,
                    ]}
                    lightColor={
                      option.isDestructive
                        ? MetaFitColors.error
                        : MetaFitColors.text.primary
                    }
                  >
                    {option.title}
                  </ThemedText>
                  {option.subtitle && (
                    <ThemedText style={styles.optionSubtitle} lightColor={MetaFitColors.text.tertiary}>
                      {option.subtitle}
                    </ThemedText>
                  )}
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={16}
                  color={
                    option.isDestructive
                      ? MetaFitColors.error
                      : MetaFitColors.text.tertiary
                  }
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Version info */}
        <ThemedText style={styles.versionText} lightColor={MetaFitColors.text.tertiary}>
          MetaFit v1.0.0
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MetaFitColors.background.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 36,
    paddingTop: 10,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: MetaFitColors.background.elevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: MetaFitColors.border.accent,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: MetaFitColors.button.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32,
    includeFontPadding: false,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  email: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MetaFitColors.background.card,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    gap: 12,
  },
  optionButtonDestructive: {
    borderColor: "rgba(252, 129, 129, 0.3)",
    backgroundColor: "rgba(252, 129, 129, 0.06)",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  optionTextGroup: {
    flex: 1,
    gap: 2,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionSubtitle: {
    fontSize: 12,
  },
  optionTextDestructive: {
    fontWeight: '700',
  },
  versionText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
});
