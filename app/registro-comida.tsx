import { RegistroComidaScreen } from '@/components/screens/registro-comida-screen';
import { asegurarBase64Jpeg, seleccionarImagen } from '@/utils/image';
import { analizarImagenComida } from '@/utils/openai';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';

export default function RegistroComidaPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagenUri, setImagenUri] = useState<string | null>(null);

  const handleRegistroManual = () => {
    router.push('/registro-manual');
  };

  const handleCargarImagenComida = async () => {
    await seleccionarImagen(async (asset) => {
      setImagenUri(asset.uri);
      await procesarImagenConBase64(asset.uri);
    });
  };

  const procesarImagenConBase64 = async (uri: string) => {
    setIsAnalyzing(true);
    try {
      const imagenBase64 = await asegurarBase64Jpeg(uri);
      const resultado = await analizarImagenComida(imagenBase64);

      if (!resultado.esPlatoComida) {
        Alert.alert(
          'Imagen no reconocida',
          resultado.mensaje || 'La imagen no parece ser un plato de comida. Por favor, intenta con otra imagen.',
          [{ text: 'OK' }]
        );
        setIsAnalyzing(false);
        return;
      }

      // If the AI returned per-ingredient breakdown, go to the ingredients screen
      if (resultado.ingredientes && resultado.ingredientes.length > 0) {
        router.push({
          pathname: '/ingredientes',
          params: {
            nombre: resultado.nombre || resultado.datosComida?.nombre || '',
            ingredientesJson: JSON.stringify(resultado.ingredientes),
            imagenUri: uri,
          },
        });
        return;
      }

      if (resultado.datosComida) {
        router.push({
          pathname: '/registro-manual',
          params: {
            nombre: resultado.datosComida.nombre || '',
            cantidad: resultado.datosComida.cantidad || '',
            energia: resultado.datosComida.energia || '',
            carb: resultado.datosComida.carb || '',
            proteina: resultado.datosComida.proteina || '',
            fibra: resultado.datosComida.fibra || '',
            grasa: resultado.datosComida.grasa || '',
            desdeIA: 'true',
            imagenUri: uri,
          },
        });
      }
    } catch (error: any) {
      console.error('Error al procesar imagen:', error);
      Alert.alert(
        'Error',
        error.message || 'No se pudo analizar la imagen. Por favor, intenta nuevamente.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <RegistroComidaScreen
      onRegistroManualPress={handleRegistroManual}
      onCargarImagenComidaPress={handleCargarImagenComida}
    />
  );
}

