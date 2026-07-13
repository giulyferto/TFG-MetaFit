import type { DatosComida } from '@/features/shared/components/DetallesComidaCard';
import { RegistroManualScreen } from '@/features/registro-comida/screens/registro-manual-screen';
import type { IngredienteGuardado } from '@/features/shared/utils/comidas';
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
    imagenUri?: string;
    ingredientesJson?: string;
    tipoComida?: string;
    fecha?: string;
  }>();

  const fechaInicial = params.fecha ? new Date(params.fecha) : undefined;

  const datosIniciales: DatosComida | undefined = params.desdeIA === 'true' ? {
    nombre: params.nombre || '',
    cantidad: params.cantidad || '',
    energia: params.energia || '',
    carb: params.carb || '',
    proteina: params.proteina || '',
    fibra: params.fibra || '',
    grasa: params.grasa || '',
  } : undefined;

  let ingredientes: IngredienteGuardado[] | undefined;
  if (params.ingredientesJson) {
    try {
      ingredientes = JSON.parse(params.ingredientesJson);
    } catch {
      ingredientes = undefined;
    }
  }

  const handleAgregarAlDiario = (datosComida: DatosComida, tipoComida: string, registroComidaId: string, ings?: IngredienteGuardado[]) => {
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
        ingredientesJson: ings && ings.length > 0 ? JSON.stringify(ings) : '',
      },
    });
  };

  const handleCancelar = () => {
    router.back();
  };

  return (
    <RegistroManualScreen
      datosIniciales={datosIniciales}
      imagenUri={params.imagenUri || undefined}
      ingredientes={ingredientes}
      tipoComidaInicial={params.tipoComida || undefined}
      fechaInicial={fechaInicial}
      onAgregarAlDiarioPress={handleAgregarAlDiario}
      onCancelarPress={handleCancelar}
    />
  );
}
