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
    // Obtener el usuario actual
    const currentUser = auth.currentUser;
    setUser(currentUser);
    setLoading(false);
  }, []);

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              // Redirigir al login después de cerrar sesión
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
      title: 'Mi Cuenta',
      icon: 'person.circle',
      onPress: () => {
        Alert.alert('Mi Cuenta', 'Funcionalidad en desarrollo');
      },
    },
    {
      id: 'signout',
      title: 'Cerrar Sesión',
      icon: 'arrow.right.square',
      onPress: handleSignOut,
      isDestructive: true,
    },
  ];

  if (loading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]} lightColor={MetaFitColors.background.white}>
        <ActivityIndicator size="large" color={MetaFitColors.button.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container} lightColor={MetaFitColors.background.white}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.title} lightColor={MetaFitColors.text.primary}>
              Perfil
            </ThemedText>
            {user && (
              <ThemedText style={styles.email} lightColor={MetaFitColors.text.secondary}>
                {user.email}
              </ThemedText>
            )}
          </View>

          {/* Config Options */}
          <View style={styles.optionsContainer}>
            {configOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  option.isDestructive && styles.optionButtonDestructive,
                ]}
                onPress={option.onPress}
              >
                <View style={styles.optionContent}>
                  <IconSymbol
                    name={option.icon as any}
                    size={24}
                    color={
                      option.isDestructive
                        ? MetaFitColors.error
                        : MetaFitColors.text.primary
                    }
                  />
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
                </View>
                <IconSymbol
                  name="chevron.right"
                  size={20}
                  color={
                    option.isDestructive
                      ? MetaFitColors.error
                      : MetaFitColors.text.secondary
                  }
                />
              </TouchableOpacity>
            ))}
          </View>
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
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 33,
    fontWeight: 'bold',
    marginBottom: 8,
    paddingTop: 10,
  },
  email: {
    fontSize: 16,
    marginTop: 4,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: MetaFitColors.background.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
    marginBottom: 8,
  },
  optionButtonDestructive: {
    borderColor: MetaFitColors.error,
    backgroundColor: '#FEE2E2',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionTextDestructive: {
    fontWeight: '600',
  },
});