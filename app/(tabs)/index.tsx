import { InicioScreen } from '@/components/screens/inicio-screen';
import { router } from 'expo-router';

export default function HomeScreen() {
  const handleStartPress = () => {
    router.push('/info-nutricional');
  };

  return <InicioScreen onStartPress={handleStartPress} />;
}
