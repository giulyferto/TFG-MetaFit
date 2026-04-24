import { RegistroComidaScreen } from '@/components/screens/registro-comida-screen';
import { convertirImagenABase64, seleccionarImagen } from '@/utils/image';
import { analizarCodigoBarras, analizarImagenComida } from '@/utils/openai';
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
      if (asset.base64) {
        await procesarImagenConBase64(asset.base64, asset.uri);
      } else {
        await procesarImagen(asset.uri);
      }
    });
  };

  const handleCargarImagenEtiqueta = async () => {
    await seleccionarImagen(async (asset) => {
      // Si tenemos base64 directamente, usarlo; si no, convertir desde URI
      if (asset.base64) {
        await procesarCodigoBarrasConBase64(asset.base64);
      } else {
        await procesarCodigoBarras(asset.uri);
      }
    });
  };

  const procesarCodigoBarrasConBase64 = async (imagenBase64: string) => {
    setIsAnalyzing(true);
    try {
      // Analizar la imagen con IA para reconocer el código de barras
      const resultado = await analizarCodigoBarras(imagenBase64);
      
      if (!resultado.esCodigoBarras) {
        Alert.alert(
          'Código de barras no reconocido',
          resultado.mensaje || 'No se pudo reconocer un código de barras en la imagen. Por favor, intenta con otra imagen.',
          [{ text: 'OK' }]
        );
        setIsAnalyzing(false);
        return;
      }
      
      // Si se reconoció el código de barras, navegar a la pantalla de registro manual con los datos prellenados
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
            desdeIA: 'true', // Flag para indicar que viene de IA
          },
        });
      }
    } catch (error: any) {
      console.error('Error al procesar código de barras:', error);
      Alert.alert(
        'Error',
        error.message || 'No se pudo analizar el código de barras. Por favor, intenta nuevamente.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const procesarCodigoBarras = async (imageUri: string) => {
    setIsAnalyzing(true);
    try {
      // Convertir la imagen a base64
      const imagenBase64 = await convertirImagenABase64(imageUri);
      await procesarCodigoBarrasConBase64(imagenBase64);
    } catch (error: any) {
      console.error('Error al procesar código de barras:', error);
      Alert.alert(
        'Error',
        error.message || 'No se pudo analizar el código de barras. Por favor, intenta nuevamente.'
      );
      setIsAnalyzing(false);
    }
  };

  const procesarImagenConBase64 = async (imagenBase64: string, uri?: string) => {
    setIsAnalyzing(true);
    try {
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
            imagenUri: uri || imagenUri || '',
          },
        });
        return;
      }

      // Fallback: single-item result (old-style or barcode)
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
            imagenUri: uri || imagenUri || '',
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

  const procesarImagen = async (imageUri: string) => {
    setIsAnalyzing(true);
    try {
      // Convertir la imagen a base64
      const imagenBase64 = await convertirImagenABase64(imageUri);
      await procesarImagenConBase64(imagenBase64);
    } catch (error: any) {
      console.error('Error al procesar imagen:', error);
      Alert.alert(
        'Error',
        error.message || 'No se pudo analizar la imagen. Por favor, intenta nuevamente.'
      );
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
      onCargarImagenEtiquetaPress={handleCargarImagenEtiqueta}
    />
  );
}

