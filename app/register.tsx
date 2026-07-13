import { RegisterScreen } from '@/features/auth/screens/register-screen';
import { router } from 'expo-router';

export default function RegisterPage() {
  const handleRegisterPress = () => {
    router.replace('/info-nutricional');
  };

  const handleLoginPress = () => {
    // Volver a la pantalla de login
    router.back();
  };

  return (
    <RegisterScreen 
      onRegisterPress={handleRegisterPress}
      onLoginPress={handleLoginPress}
    />
  );
}

