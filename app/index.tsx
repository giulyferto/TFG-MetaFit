import { LandingScreen } from '@/components/screens/landing-screen';
import { router } from 'expo-router';

export default function IndexPage() {
  const handleLoginPress = () => {
    // Navegar a la pantalla de login
    router.push('/login');
  };

  const handleRegisterPress = () => {
    // Navegar a la pantalla de registro
    router.push('/register');
  };

  return (
    <LandingScreen 
      onLoginPress={handleLoginPress}
      onRegisterPress={handleRegisterPress}
    />
  );
}

