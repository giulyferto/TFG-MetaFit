import { auth, db } from "@/firebase";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";

export type FeedbackParaGuardar = {
  texto: string;
  calificacion: "Muy saludable" | "Equilibrada" | "Poco nutritiva";
  registroComidaId: string;
};

/**
 * Guarda un feedback nutricional en Firebase
 * @param feedback - Datos del feedback a guardar
 * @returns Promise con el ID del documento creado
 */
export async function guardarFeedback(feedback: FeedbackParaGuardar): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No hay usuario autenticado");
  }

  try {
    const feedbackRef = collection(db, "feedback");
    const datosParaGuardar = {
      texto: feedback.texto,
      calificacion: feedback.calificacion,
      registroComidaId: feedback.registroComidaId,
      userId: user.uid,
      fechaCreacion: new Date().toISOString(),
    };

    const docRef = await addDoc(feedbackRef, datosParaGuardar);
    return docRef.id;
  } catch (error) {
    console.error("Error al guardar feedback:", error);
    throw error;
  }
}

export async function obtenerFeedbackDeRegistro(
  registroComidaId: string
): Promise<{ texto: string; calificacion: string } | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const q = query(
    collection(db, "feedback"),
    where("userId", "==", user.uid),
    where("registroComidaId", "==", registroComidaId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const data = snapshot.docs[0].data();
  return {
    texto: data.texto || "",
    calificacion: data.calificacion || "",
  };
}

