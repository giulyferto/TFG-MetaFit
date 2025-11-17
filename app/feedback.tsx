import type { DatosComida } from '@/components/formulario-comida/DetallesComidaCard';
import { FeedbackScreen } from '@/components/screens/feedback-screen';
import { router, useLocalSearchParams } from 'expo-router';

export default function FeedbackPage() {
  const params = useLocalSearchParams<{
    nombre?: string;
    cantidad?: string;
    energia?: string;
    carb?: string;
    proteina?: string;
    fibra?: string;
    grasa?: string;
    tipoComida?: string;
  }>();

  // Construir el objeto DatosComida desde los parámetros
  const datosComida: DatosComida | undefined = params.nombre
    ? {
        nombre: params.nombre || '',
        cantidad: params.cantidad || '',
        energia: params.energia || '',
        carb: params.carb || '',
        proteina: params.proteina || '',
        fibra: params.fibra || '',
        grasa: params.grasa || '',
      }
    : undefined;

  const handleGuardarPress = () => {
    // Aquí irá la lógica para guardar el feedback cuando se integre Firebase
    console.log('Guardar feedback');
    // Navegar de vuelta a la pantalla anterior o a la home
    router.back();
  };

  return <FeedbackScreen onGuardarPress={handleGuardarPress} datosComida={datosComida} tipoComida={params.tipoComida} />;
}

