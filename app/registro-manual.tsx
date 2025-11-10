import type { DatosComida } from '@/components/formulario-comida/DetallesComidaCard';
import { RegistroManualScreen } from '@/components/screens/registro-manual-screen';
import { router } from 'expo-router';

export default function RegistroManualPage() {
  const handleAgregarAlDiario = (datosComida: DatosComida) => {
    // Navegar a la pantalla de feedback con los datos de la comida
    router.push({
      pathname: '/feedback',
      params: {
        nombre: datosComida.nombre || '',
        cantidad: datosComida.cantidad || '',
        energia: datosComida.energia || '',
        carb: datosComida.carb || '',
        proteina: datosComida.proteina || '',
        fibra: datosComida.fibra || '',
        grasa: datosComida.grasa || '',
      },
    });
  };

  const handleCancelar = () => {
    // Volver a la pantalla anterior
    router.back();
  };

  return (
    <RegistroManualScreen
      onAgregarAlDiarioPress={handleAgregarAlDiario}
      onCancelarPress={handleCancelar}
    />
  );
}

