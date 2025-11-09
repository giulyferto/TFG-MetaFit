import { LoginScreen } from '@/components/screens/login-screen';
import { router } from 'expo-router';

export default function LoginPage() {
  const handleRegisterPress = () => {
    // Navegar a la pantalla de registro
    router.push('/register');
  };

  return (
    <LoginScreen 
      onRegisterPress={handleRegisterPress}
    />
  );
}

