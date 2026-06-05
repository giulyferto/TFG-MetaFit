import type { DatosComida } from '@/components/formulario-comida/DetallesComidaCard';
import { FeedbackScreen } from '@/components/screens/feedback-screen';
import type { IngredienteGuardado } from '@/utils/comidas';
import { consumePendingImagenUrl } from '@/utils/nav-state';
import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router';
import { useState } from 'react';

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
    registroComidaId?: string;
    ingredientesJson?: string;
  }>();

  const [imagenUrl] = useState<string | null>(() => consumePendingImagenUrl());

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

  let ingredientes: IngredienteGuardado[] | undefined;
  if (params.ingredientesJson) {
    try {
      ingredientes = JSON.parse(params.ingredientesJson);
    } catch {
      ingredientes = undefined;
    }
  }

  const handleGuardarPress = () => {
    router.replace('/(tabs)');
  };

  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false, headerShown: false }} />
      <FeedbackScreen
        onGuardarPress={handleGuardarPress}
        datosComida={datosComida}
        tipoComida={params.tipoComida}
        registroComidaId={params.registroComidaId}
        ingredientes={ingredientes}
        imagenUrl={imagenUrl || undefined}
      />
    </>
  );
}

