import type { DatosComida } from "@/components/formulario-comida/DetallesComidaCard";
import { auth, db } from "@/firebase";
import { addDoc, collection, getDocs, limit, orderBy, query } from "firebase/firestore";

export type ComidaAnterior = {
  id: string;
  nombre: string;
  cantidad: string;
  energia: string;
  carb: string;
  proteina: string;
  fibra: string;
  grasa: string;
  tipoComida?: string;
  fechaCreacion?: string;
};

/**
 * Obtiene las comidas plantilla desde Firebase
 * Las comidas plantilla no tienen userId, son reutilizables
 * @param limite - Número máximo de comidas a obtener (por defecto 50)
 * @returns Promise con array de comidas anteriores
 */
export async function obtenerComidasAnteriores(limite: number = 50): Promise<ComidaAnterior[]> {
  try {
    const comidasRef = collection(db, "comidas");
    // Buscar todas las comidas plantilla (sin userId) ordenadas por fecha
    const q = query(
      comidasRef,
      orderBy("fechaCreacion", "desc"),
      limit(limite)
    );
    
    const querySnapshot = await getDocs(q);
    const comidas: ComidaAnterior[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Solo incluir comidas que no tengan userId (son plantillas)
      if (!data.userId) {
        comidas.push({
          id: doc.id,
          nombre: data.nombre || "",
          cantidad: data.cantidad || "",
          energia: data.energia || "",
          carb: data.carb || "",
          proteina: data.proteina || "",
          fibra: data.fibra || "",
          grasa: data.grasa || "",
          tipoComida: data.tipoComida || "",
          fechaCreacion: data.fechaCreacion || "",
        });
      }
    });
    
    return comidas;
  } catch (error) {
    console.error("Error al obtener comidas anteriores:", error);
    return [];
  }
}

export type DatosComidaParaGuardar = DatosComida & {
  tipoComida?: string;
};

/**
 * Guarda una comida como plantilla (sin userId ni tipoComida)
 * Solo contiene los datos nutricionales para reutilizar
 * @param datosComida - Datos de la comida a guardar
 * @returns Promise con el ID del documento creado
 */
export async function guardarComidaComoPlantilla(
  datosComida: DatosComida
): Promise<string> {
  try {
    const comidasRef = collection(db, "comidas");
    const datosParaGuardar = {
      nombre: datosComida.nombre || "",
      cantidad: datosComida.cantidad || "",
      energia: datosComida.energia || "",
      carb: datosComida.carb || "",
      proteina: datosComida.proteina || "",
      fibra: datosComida.fibra || "",
      grasa: datosComida.grasa || "",
      fechaCreacion: new Date().toISOString(),
    };

    const docRef = await addDoc(comidasRef, datosParaGuardar);
    return docRef.id;
  } catch (error) {
    console.error("Error al guardar comida como plantilla:", error);
    throw error;
  }
}

/**
 * Guarda un registro de comida en el diario del usuario
 * @param datosComida - Datos de la comida
 * @param tipoComida - Tipo de comida (Desayuno, Almuerzo, etc.)
 * @param comidaId - ID de la comida plantilla (opcional, si se guardó como plantilla)
 * @returns Promise con el ID del documento creado
 */
export async function guardarComidaEnDiario(
  datosComida: DatosComida,
  tipoComida: string,
  comidaId?: string
): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No hay usuario autenticado");
  }

  try {
    const registrosRef = collection(db, "registrosComidas");
    const datosParaGuardar: any = {
      nombre: datosComida.nombre || "",
      cantidad: datosComida.cantidad || "",
      energia: datosComida.energia || "",
      carb: datosComida.carb || "",
      proteina: datosComida.proteina || "",
      fibra: datosComida.fibra || "",
      grasa: datosComida.grasa || "",
      tipoComida: tipoComida,
      userId: user.uid,
      fechaCreacion: new Date().toISOString(),
    };

    // Si hay un ID de comida plantilla, agregarlo como referencia
    if (comidaId) {
      datosParaGuardar.comidaId = comidaId;
    }

    const docRef = await addDoc(registrosRef, datosParaGuardar);
    return docRef.id;
  } catch (error) {
    console.error("Error al guardar registro de comida:", error);
    throw error;
  }
}

