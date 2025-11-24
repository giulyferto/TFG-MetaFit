import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';

/**
 * Convierte una imagen desde una URI a base64
 * @param uri - URI de la imagen
 * @returns Promise con la imagen en formato base64 (sin el prefijo data:image)
 */
export async function convertirImagenABase64(uri: string): Promise<string> {
  try {
    // En iOS, las URIs pueden tener el formato file:// o ph://
    // En Android, pueden ser content:// o file://
    let fileUri = uri;
    
    // Si es una URI de iOS (ph://), necesitamos copiarla primero
    if (Platform.OS === 'ios' && uri.startsWith('ph://')) {
      // Para iOS, intentamos usar la URI directamente
      // Si falla, usamos FileSystem para copiar el archivo
      try {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return base64;
      } catch {
        // Si falla, intentamos copiar el archivo primero
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (fileInfo.exists) {
          const base64 = await FileSystem.readAsStringAsync(fileInfo.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          return base64;
        }
      }
    }
    
    // Para Android o URIs file://, intentamos leer directamente
    if (uri.startsWith('file://') || uri.startsWith('content://')) {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    }
    
    // Si es una URI http/https, usamos fetch
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Remover el prefijo data:image/...;base64,
          const base64 = base64String.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
    
    // Último intento: leer directamente
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error: any) {
    console.error('Error al convertir imagen a base64:', error);
    console.error('URI que falló:', uri);
    throw new Error(`No se pudo convertir la imagen a base64: ${error.message || 'Error desconocido'}`);
  }
}

/**
 * Tipo para el callback que procesa la imagen seleccionada
 */
export type ProcesarImagenCallback = (asset: {
  uri: string;
  base64?: string;
}) => Promise<void> | void;

/**
 * Solicita permisos de cámara y galería
 * @returns Promise<boolean> - true si los permisos fueron otorgados, false en caso contrario
 */
export async function requestImagePermissions(): Promise<boolean> {
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
}

/**
 * Muestra un diálogo para seleccionar una imagen desde la galería o tomar una foto con la cámara
 * @param onImageSelected - Callback que se ejecuta cuando se selecciona una imagen
 * @param options - Opciones opcionales para personalizar el diálogo y la selección de imagen
 */
export async function seleccionarImagen(
  onImageSelected: ProcesarImagenCallback,
  options?: {
    title?: string;
    message?: string;
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
  }
): Promise<void> {
  const hasPermission = await requestImagePermissions();
  if (!hasPermission) return;

  const {
    title = 'Seleccionar imagen',
    message = '¿De dónde quieres cargar la imagen?',
    allowsEditing = true,
    aspect = [4, 3],
    quality = 1,
  } = options || {};

  Alert.alert(
    title,
    message,
    [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
        {
          text: 'Galería',
          onPress: async () => {
            let result;
            try {
              result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing,
                aspect,
                quality,
                base64: true,
              });
            } catch (error) {
              console.error('Error al seleccionar imagen de galería:', error);
              Alert.alert('Error', 'No se pudo seleccionar la imagen de la galería');
              return;
            }

            // Ejecutar el callback fuera del try-catch de ImagePicker
            // Los errores del callback deben manejarse en el código que llama a seleccionarImagen
            if (!result.canceled && result.assets[0]) {
              const asset = result.assets[0];
              await onImageSelected({
                uri: asset.uri,
                base64: asset.base64 || undefined,
              });
            }
          },
        },
        {
          text: 'Tomar foto',
          onPress: async () => {
            let result;
            try {
              result = await ImagePicker.launchCameraAsync({
                allowsEditing,
                aspect,
                quality,
                base64: true,
              });
            } catch (error) {
              console.error('Error al tomar foto:', error);
              Alert.alert('Error', 'No se pudo tomar la foto');
              return;
            }

            // Ejecutar el callback fuera del try-catch de ImagePicker
            // Los errores del callback deben manejarse en el código que llama a seleccionarImagen
            if (!result.canceled && result.assets[0]) {
              const asset = result.assets[0];
              await onImageSelected({
                uri: asset.uri,
                base64: asset.base64 || undefined,
              });
            }
          },
        },
    ],
    { cancelable: true }
  );
}

