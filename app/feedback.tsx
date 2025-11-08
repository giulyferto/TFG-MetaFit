import { FeedbackScreen } from '@/components/screens/feedback-screen';
import { router } from 'expo-router';

export default function FeedbackPage() {
  const handleGuardarPress = () => {
    // Aquí irá la lógica para guardar el feedback cuando se integre Firebase
    console.log('Guardar feedback');
    // Navegar de vuelta a la pantalla anterior o a la home
    router.back();
  };

  return <FeedbackScreen onGuardarPress={handleGuardarPress} />;
}

