import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

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

