import { InicioScreen } from '@/components/screens/inicio-screen';
import { router } from 'expo-router';

export default function BienvenidaPage() {
  const handleStartPress = () => {
    // Navegar a la pantalla de información nutricional
    router.push('/info-nutricional');
  };

  return <InicioScreen onStartPress={handleStartPress} />;
}

