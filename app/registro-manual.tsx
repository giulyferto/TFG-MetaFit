import type { DatosComida } from '@/components/formulario-comida/DetallesComidaCard';
import { RegistroManualScreen } from '@/components/screens/registro-manual-screen';
import { router, useLocalSearchParams } from 'expo-router';

export default function RegistroManualPage() {
  const params = useLocalSearchParams<{
    nombre?: string;
    cantidad?: string;
    energia?: string;
    carb?: string;
    proteina?: string;
    fibra?: string;
    grasa?: string;
    desdeIA?: string;
  }>();

  // Preparar datos iniciales si vienen de la IA
  const datosIniciales: DatosComida | undefined = params.desdeIA === 'true' ? {
    nombre: params.nombre || '',
    cantidad: params.cantidad || '',
    energia: params.energia || '',
    carb: params.carb || '',
    proteina: params.proteina || '',
    fibra: params.fibra || '',
    grasa: params.grasa || '',
  } : undefined;

  const handleAgregarAlDiario = (datosComida: DatosComida, tipoComida: string, registroComidaId: string) => {
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
        tipoComida: tipoComida || '',
        registroComidaId: registroComidaId || '',
      },
    });
  };

  const handleCancelar = () => {
    // Volver a la pantalla anterior
    router.back();
  };

  return (
    <RegistroManualScreen
      datosIniciales={datosIniciales}
      onAgregarAlDiarioPress={handleAgregarAlDiario}
      onCancelarPress={handleCancelar}
    />
  );
}

