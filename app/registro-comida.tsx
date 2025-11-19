import { RegistroComidaScreen } from '@/components/screens/registro-comida-screen';
import { convertirImagenABase64 } from '@/utils/image';
import { analizarImagenComida } from '@/utils/openai';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, View } from 'react-native';

export default function RegistroComidaPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleRegistroManual = () => {
    // Navegar a la pantalla de registro manual
    router.push('/registro-manual');
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
        Alert.alert(
          'Permisos necesarios',
          'Se necesitan permisos de cámara y galería para cargar imágenes.'
        );
        return false;
      }
    }
    return true;
  };

  const handleCargarImagenComida = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    // Mostrar opciones: Galería o Cámara
    Alert.alert(
      'Seleccionar imagen',
      '¿De dónde quieres cargar la imagen?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Galería',
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
                base64: true, // Obtener la imagen en base64 directamente
              });

              if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                // Si tenemos base64 directamente, usarlo; si no, convertir desde URI
                if (asset.base64) {
                  await procesarImagenConBase64(asset.base64);
                } else {
                  await procesarImagen(asset.uri);
                }
              }
            } catch (error) {
              console.error('Error al seleccionar imagen de galería:', error);
              Alert.alert('Error', 'No se pudo seleccionar la imagen de la galería');
            }
          },
        },
        {
          text: 'Tomar foto',
          onPress: async () => {
            try {
              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
                base64: true, // Obtener la imagen en base64 directamente
              });

              if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                // Si tenemos base64 directamente, usarlo; si no, convertir desde URI
                if (asset.base64) {
                  await procesarImagenConBase64(asset.base64);
                } else {
                  await procesarImagen(asset.uri);
                }
              }
            } catch (error) {
              console.error('Error al tomar foto:', error);
              Alert.alert('Error', 'No se pudo tomar la foto');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleCargarImagenEtiqueta = () => {
    // Navegar a la pantalla de cargar imagen de etiqueta (cuando se cree)
    console.log('Cargar imagen etiqueta nutricional');
  };

  const procesarImagenConBase64 = async (imagenBase64: string) => {
    setIsAnalyzing(true);
    try {
      // Analizar la imagen con IA
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
      
      // Si es un plato de comida, navegar a la pantalla de registro manual con los datos prellenados
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

