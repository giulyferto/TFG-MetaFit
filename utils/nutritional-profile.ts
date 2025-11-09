import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

/**
 * Verifica si el usuario tiene un perfil nutricional completo
 * @returns Promise<boolean> - true si el perfil está completo, false si no
 */
export async function hasCompleteNutritionalProfile(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) {
    return false;
  }

  try {
    const perfilRef = doc(db, "perfilesNutricionales", user.uid);
    const perfilSnap = await getDoc(perfilRef);

    if (!perfilSnap.exists()) {
      return false;
    }

    const perfil = perfilSnap.data();
    
    // Verificar que el perfil esté marcado como completado
    // y que tenga todos los campos requeridos
    return (
      perfil.completado === true &&
      perfil.edad &&
      perfil.sexo &&
      perfil.altura &&
      perfil.peso &&
      perfil.ejercicio &&
      perfil.preferenciaNutricional &&
      perfil.objetivos
    );
  } catch (error) {
    console.error("Error al verificar perfil nutricional:", error);
    return false;
  }
}

/**
 * Obtiene el perfil nutricional del usuario actual
 * @returns Promise con los datos del perfil o null si no existe
 */
export async function getNutritionalProfile() {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }

  try {
    const perfilRef = doc(db, "perfilesNutricionales", user.uid);
    const perfilSnap = await getDoc(perfilRef);

    if (!perfilSnap.exists()) {
      return null;
    }

    return perfilSnap.data();
  } catch (error) {
    console.error("Error al obtener perfil nutricional:", error);
    return null;
  }
}

