import { HomeScreen } from '@/components/screens/home-screen';
import { auth } from '@/firebase';
import { hasCompleteNutritionalProfile } from '@/utils/nutritional-profile';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Verificar autenticación y perfil nutricional
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // No hay usuario, redirigir a login
        router.replace('/login');
        return;
      }

      // Verificar si tiene perfil nutricional completo
      const hasProfile = await hasCompleteNutritionalProfile();
      
      if (!hasProfile) {
        // No tiene perfil completo, redirigir al formulario
        router.replace('/info-nutricional');
        return;
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#96b6c5" />
      </View>
    );
  }

  return <HomeScreen />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
