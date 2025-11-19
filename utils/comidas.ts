import type { DatosComida } from "@/components/formulario-comida/DetallesComidaCard";
import { auth, db } from "@/firebase";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";

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
 * Obtiene las comidas guardadas anteriormente del usuario actual
 * @param limite - Número máximo de comidas a obtener (por defecto 50)
 * @returns Promise con array de comidas anteriores del usuario
 */
export async function obtenerComidasAnteriores(limite: number = 50): Promise<ComidaAnterior[]> {
  const user = auth.currentUser;
  if (!user) {
    return [];
  }

  try {
    const comidasRef = collection(db, "comidas");
    // Buscar comidas del usuario actual (sin orderBy para evitar índice compuesto)
    const q = query(
      comidasRef,
      where("userId", "==", user.uid)
    );
    
    const querySnapshot = await getDocs(q);
    const comidas: ComidaAnterior[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
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
    });
    
    // Ordenar en memoria por fecha de creación (más reciente primero)
    comidas.sort((a, b) => {
      const fechaA = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0;
      const fechaB = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0;
      return fechaB - fechaA; // Orden descendente (más reciente primero)
    });
    
    // Aplicar el límite después de ordenar
    return comidas.slice(0, limite);
  } catch (error) {
    console.error("Error al obtener comidas anteriores:", error);
    return [];
  }
}

export type DatosComidaParaGuardar = DatosComida & {
  tipoComida?: string;
};

/**
 * Guarda una comida como plantilla del usuario actual
 * @param datosComida - Datos de la comida a guardar
 * @returns Promise con el ID del documento creado
 */
export async function guardarComidaComoPlantilla(
  datosComida: DatosComida
): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No hay usuario autenticado");
  }

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
      userId: user.uid,
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

