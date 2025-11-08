import { RegistroManualScreen } from '@/components/screens/registro-manual-screen';
import { router } from 'expo-router';

export default function RegistroManualPage() {
  const handleAgregarAlDiario = () => {
    // Aquí irá la lógica para agregar al diario cuando se integre Firebase
    console.log('Agregar al diario');
    // Navegar a la pantalla de feedback
    router.push('/feedback');
  };

  const handleCancelar = () => {
    // Volver a la pantalla anterior
  };

  return (
    <RegistroManualScreen
      onAgregarAlDiarioPress={handleAgregarAlDiario}
      onCancelarPress={handleCancelar}
    />
  );
}

