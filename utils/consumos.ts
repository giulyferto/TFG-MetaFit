import { auth, db } from "@/firebase";
import { collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";

export type Consumo = {
  id: string;
  calificacion: "Alta" | "Media" | "Baja" | null;
  descripcion: string;
  fechaCreacion: string;
  tipoComida?: string;
  nombre?: string;
  imagenUrl?: string;
  energia?: string;
  carb?: string;
  proteina?: string;
  fibra?: string;
  grasa?: string;
  cantidad?: string;
};

export type ResumenNutricional = {
  energia: number;
  carb: number;
  proteina: number;
  fibra: number;
  grasa: number;
  totalRegistros: number;
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
        imagenUrl: data.imagenUrl || undefined,
        energia: data.energia || undefined,
        carb: data.carb || undefined,
        proteina: data.proteina || undefined,
        fibra: data.fibra || undefined,
        grasa: data.grasa || undefined,
        cantidad: data.cantidad || undefined,
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
 * Obtiene los consumos filtrados por fecha
 * @param fecha - Fecha para filtrar (solo se compara día, mes y año)
 * @returns Promise con array de consumos filtrados
 */
export async function obtenerConsumosPorFecha(fecha: Date): Promise<Consumo[]> {
  const user = auth.currentUser;
  if (!user) {
    return [];
  }

  try {
    // Normalizar la fecha de búsqueda (solo día, mes, año)
    const fechaInicio = new Date(fecha);
    fechaInicio.setHours(0, 0, 0, 0);
    
    const fechaFin = new Date(fecha);
    fechaFin.setHours(23, 59, 59, 999);

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

    // Procesar cada registro de comida y filtrar por fecha
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const registroId = doc.id;
      
      // Filtrar por fecha
      const fechaCreacion = data.fechaCreacion 
        ? new Date(data.fechaCreacion)
        : new Date();
      
      // Comparar solo día, mes y año
      if (fechaCreacion < fechaInicio || fechaCreacion > fechaFin) {
        return;
      }
      
      // Obtener la calificación del feedback asociado
      const calificacion = feedbacksMap.get(registroId) || null;
      
      const fechaFormateada = formatearFecha(fechaCreacion);
      
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
        imagenUrl: data.imagenUrl || undefined,
        energia: data.energia || undefined,
        carb: data.carb || undefined,
        proteina: data.proteina || undefined,
        fibra: data.fibra || undefined,
        grasa: data.grasa || undefined,
        cantidad: data.cantidad || undefined,
      });
    });

    // Ordenar por fecha de creación (más reciente primero)
    consumos.sort((a, b) => {
      const fechaA = new Date(a.fechaCreacion).getTime();
      const fechaB = new Date(b.fechaCreacion).getTime();
      return fechaB - fechaA; // Orden descendente (más reciente primero)
    });

    return consumos;
  } catch (error) {
    console.error("Error al obtener consumos por fecha:", error);
    return [];
  }
}

export async function obtenerResumenNutricionalDelDia(fecha: Date): Promise<ResumenNutricional> {
  const consumos = await obtenerConsumosPorFecha(fecha);

  const resumen: ResumenNutricional = {
    energia: 0,
    carb: 0,
    proteina: 0,
    fibra: 0,
    grasa: 0,
    totalRegistros: consumos.length,
  };

  for (const consumo of consumos) {
    resumen.energia += parseFloat(consumo.energia || "0") || 0;
    resumen.carb += parseFloat(consumo.carb || "0") || 0;
    resumen.proteina += parseFloat(consumo.proteina || "0") || 0;
    resumen.fibra += parseFloat(consumo.fibra || "0") || 0;
    resumen.grasa += parseFloat(consumo.grasa || "0") || 0;
  }

  return resumen;
}

export async function eliminarRegistroComida(registroId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuario no autenticado");

  // Delete the food record
  await deleteDoc(doc(db, "registrosComidas", registroId));

  // Delete associated feedback documents
  const feedbacksRef = collection(db, "feedback");
  const q = query(
    feedbacksRef,
    where("userId", "==", user.uid),
    where("registroComidaId", "==", registroId)
  );
  const snapshot = await getDocs(q);
  const deletions = snapshot.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletions);
}

export async function actualizarRegistroComida(
  registroId: string,
  datos: Partial<{
    nombre: string;
    cantidad: string;
    energia: string;
    carb: string;
    proteina: string;
    fibra: string;
    grasa: string;
    tipoComida: string;
  }>
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuario no autenticado");

  await updateDoc(doc(db, "registrosComidas", registroId), datos);
}

export async function obtenerConsumosPorRango(
  fechaInicio: Date,
  fechaFin: Date
): Promise<Consumo[]> {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const inicio = new Date(fechaInicio);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);

    const registrosRef = collection(db, "registrosComidas");
    const q = query(registrosRef, where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);

    const feedbacksRef = collection(db, "feedback");
    const feedbacksSnapshot = await getDocs(
      query(feedbacksRef, where("userId", "==", user.uid))
    );
    const feedbacksMap = new Map<string, "Alta" | "Media" | "Baja">();
    feedbacksSnapshot.forEach((d) => {
      const data = d.data();
      if (data.registroComidaId && data.calificacion) {
        feedbacksMap.set(data.registroComidaId, data.calificacion);
      }
    });

    const consumos: Consumo[] = [];
    querySnapshot.forEach((d) => {
      const data = d.data();
      const registroId = d.id;
      const fechaCreacion = data.fechaCreacion ? new Date(data.fechaCreacion) : new Date();
      if (fechaCreacion < inicio || fechaCreacion > fin) return;

      const calificacion = feedbacksMap.get(registroId) || null;
      const tipoComida = data.tipoComida || "Comida";
      const nombre = data.nombre || "";
      const fechaFormateada = formatearFecha(fechaCreacion);
      const descripcion = nombre
        ? `${tipoComida} - ${nombre} - ${fechaFormateada}`
        : `${tipoComida} - ${fechaFormateada}`;

      consumos.push({
        id: registroId,
        calificacion,
        descripcion,
        fechaCreacion: data.fechaCreacion || new Date().toISOString(),
        tipoComida,
        nombre,
        imagenUrl: data.imagenUrl || undefined,
        energia: data.energia || undefined,
        carb: data.carb || undefined,
        proteina: data.proteina || undefined,
        fibra: data.fibra || undefined,
        grasa: data.grasa || undefined,
        cantidad: data.cantidad || undefined,
      });
    });

    consumos.sort(
      (a, b) => new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime()
    );
    return consumos;
  } catch (error) {
    console.error("Error al obtener consumos por rango:", error);
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

