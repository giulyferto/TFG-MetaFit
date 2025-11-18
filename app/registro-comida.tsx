import { RegistroComidaScreen } from '@/components/screens/registro-comida-screen';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform } from 'react-native';

export default function RegistroComidaPage() {
  const [image, setImage] = useState<string | null>(null);

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
              });

              if (!result.canceled && result.assets[0]) {
                setImage(result.assets[0].uri);
                // Aquí puedes navegar a una pantalla para procesar la imagen
                console.log('Imagen seleccionada de galería:', result.assets[0].uri);
                // TODO: Navegar a pantalla de procesamiento de imagen
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
              });

              if (!result.canceled && result.assets[0]) {
                setImage(result.assets[0].uri);
                // Aquí puedes navegar a una pantalla para procesar la imagen
                console.log('Foto tomada:', result.assets[0].uri);
                // TODO: Navegar a pantalla de procesamiento de imagen
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

  return (
    <RegistroComidaScreen
      onRegistroManualPress={handleRegistroManual}
      onCargarImagenComidaPress={handleCargarImagenComida}
      onCargarImagenEtiquetaPress={handleCargarImagenEtiqueta}
    />
  );
}

