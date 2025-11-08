import { RegisterScreen } from '@/components/screens/register-screen';
import { router } from 'expo-router';

export default function RegisterPage() {
  const handleRegisterPress = () => {
    // Aquí irá la lógica de registro cuando se integre Firebase
    // Por ahora, navegamos a la pantalla de bienvenida
    router.replace('/bienvenida');
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

