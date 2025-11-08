import { LoginScreen } from '@/components/screens/login-screen';
import { router } from 'expo-router';

export default function LoginPage() {
  const handleLoginPress = () => {
    // Aquí irá la lógica de autenticación cuando se integre Firebase
    // Por ahora, navegamos a la pantalla principal
    router.replace('/(tabs)');
  };

  const handleRegisterPress = () => {
    // Navegar a la pantalla de registro
    router.push('/register');
  };

  return (
    <LoginScreen 
      onLoginPress={handleLoginPress}
      onRegisterPress={handleRegisterPress}
    />
  );
}

