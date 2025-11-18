import { auth, db } from "@/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export type Consumo = {
  id: string;
  calificacion: "Alta" | "Media" | "Baja" | null;
  descripcion: string;
  fechaCreacion: string;
  tipoComida?: string;
  nombre?: string;
};

/**
 * Obtiene los últimos consumos registrados del usuario con sus feedbacks
 * @param limite - Número máximo de consumos a obtener (por defecto 10)
 * @returns Promise con array de consumos
 */
export async function obtenerUltimosConsumos(limite: number = 10): Promise<Consumo[]> {
  const user = auth.currentUser;
  if (!user) {
    return [];
  }

  try {
    // Obtener los últimos registros de comida del usuario
    // Nota: Obtenemos todos los registros del usuario y ordenamos en memoria
    // para evitar requerir un índice compuesto en Firestore
    const registrosRef = collection(db, "registrosComidas");
    const q = query(
      registrosRef,
      where("userId", "==", user.uid)
    );

    const querySnapshot = await getDocs(q);
    const consumos: Consumo[] = [];

    // Obtener todos los feedbacks del usuario para hacer el join
    const feedbacksRef = collection(db, "feedback");
    const feedbacksQuery = query(
      feedbacksRef,
      where("userId", "==", user.uid)
    );
    const feedbacksSnapshot = await getDocs(feedbacksQuery);
    
    // Crear un mapa de registroComidaId -> calificacion
    const feedbacksMap = new Map<string, "Alta" | "Media" | "Baja">();
    feedbacksSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.registroComidaId && data.calificacion) {
        feedbacksMap.set(data.registroComidaId, data.calificacion);
      }
    });

    // Procesar cada registro de comida
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const registroId = doc.id;
      
      // Obtener la calificación del feedback asociado
      const calificacion = feedbacksMap.get(registroId) || null;
      
      // Formatear la fecha
      const fecha = data.fechaCreacion 
        ? new Date(data.fechaCreacion)
        : new Date();
      
      const fechaFormateada = formatearFecha(fecha);
      
      // Crear la descripción
      const tipoComida = data.tipoComida || "Comida";
      const nombre = data.nombre || "";
      const descripcion = nombre 
        ? `${tipoComida} - ${nombre} - ${fechaFormateada}`
        : `${tipoComida} - ${fechaFormateada}`;

      consumos.push({
        id: registroId,
        calificacion: calificacion,
        descripcion: descripcion,
        fechaCreacion: data.fechaCreacion || new Date().toISOString(),
        tipoComida: tipoComida,
        nombre: nombre,
      });
    });

    // Ordenar por fecha de creación (más reciente primero) y limitar
    consumos.sort((a, b) => {
      const fechaA = new Date(a.fechaCreacion).getTime();
      const fechaB = new Date(b.fechaCreacion).getTime();
      return fechaB - fechaA; // Orden descendente (más reciente primero)
    });

    // Limitar a los primeros N resultados
    return consumos.slice(0, limite);
  } catch (error) {
    console.error("Error al obtener últimos consumos:", error);
    return [];
  }
}

/**
 * Formatea una fecha a formato dd/mm/yyyy
 */
function formatearFecha(fecha: Date): string {
  const dia = fecha.getDate().toString().padStart(2, "0");
  const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
  const año = fecha.getFullYear();

  return `${dia}/${mes}/${año}`;
}

