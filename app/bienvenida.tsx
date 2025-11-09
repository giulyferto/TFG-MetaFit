import { InicioScreen } from '@/components/screens/inicio-screen';
import { auth } from '@/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

export default function BienvenidaPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Verificar si hay un usuario autenticado
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // Usuario autenticado, permitir acceso
        setUser(currentUser);
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
    // Navegar a la pantalla de información nutricional
    router.push('/info-nutricional');
  };

  // Mostrar un loader mientras se verifica la autenticación
  if (loading) {
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

  // Usuario autenticado, mostrar la pantalla de inicio
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

