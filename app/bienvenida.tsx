import { InicioScreen } from '@/components/screens/inicio-screen';
import { auth } from '@/firebase';
import { hasCompleteNutritionalProfile } from '@/utils/nutritional-profile';
import { useRouter } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function BienvenidaPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Verificar si hay un usuario autenticado y si tiene perfil completo
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        // Verificar si tiene perfil nutricional completo
        setCheckingProfile(true);
        const hasProfile = await hasCompleteNutritionalProfile();
        
        if (!hasProfile) {
          // No tiene perfil completo, redirigir al formulario
          router.replace('/info-nutricional');
          return;
        }
        
        setCheckingProfile(false);
      } else {
        // No hay usuario autenticado, redirigir a login
        router.replace('/login');
      }
      setLoading(false);
    });

    // Limpiar el listener cuando el componente se desmonte
    return () => unsubscribe();
  }, [router]);

  const handleStartPress = () => {
    // Si el usuario presiona "Empecemos", verificar perfil y redirigir
    router.push('/info-nutricional');
  };

  // Mostrar un loader mientras se verifica la autenticación y el perfil
  if (loading || checkingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#96b6c5" />
      </View>
    );
  }

  // Si no hay usuario, no mostrar nada (ya se redirigió a login)
  if (!user) {
    return null;
  }

  // Usuario autenticado con perfil completo, mostrar la pantalla de inicio
  return <InicioScreen onStartPress={handleStartPress} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

