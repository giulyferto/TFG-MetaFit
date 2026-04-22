import { auth } from "@/firebase";
import * as FileSystem from "expo-file-system/legacy";

const BUCKET = "tfg-metafit.firebasestorage.app";

export async function subirImagenComida(uri: string, registroId: string): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("No hay usuario autenticado");

  const token = await user.getIdToken();
  const path = `comidas/${user.uid}/${registroId}.jpg`;

  const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o?name=${encodeURIComponent(path)}&uploadType=media`;

  const result = await FileSystem.uploadAsync(uploadUrl, uri, {
    httpMethod: "POST",
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      Authorization: `Firebase ${token}`,
      "Content-Type": "image/jpeg",
    },
  });

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Error al subir imagen: ${result.status} ${result.body}`);
  }

  const metadata = JSON.parse(result.body);
  const downloadToken = metadata.downloadTokens;
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(path)}?alt=media&token=${downloadToken}`;
}
