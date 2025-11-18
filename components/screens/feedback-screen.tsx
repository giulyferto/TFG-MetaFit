import type { DatosComida } from "@/components/formulario-comida/DetallesComidaCard";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { MetaFitColors } from "@/constants/theme";
import { guardarFeedback } from "@/utils/feedback";
import { generarFeedbackNutricional } from "@/utils/openai";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import Markdown from "react-native-markdown-display";

const FeedbackFoodImage = require("@/assets/images/feedback-food-image.png");

type FeedbackScreenProps = {
  onGuardarPress?: () => void;
  datosComida?: DatosComida;
  tipoComida?: string;
  registroComidaId?: string;
};

export function FeedbackScreen({ onGuardarPress, datosComida, tipoComida, registroComidaId }: FeedbackScreenProps) {
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [calificacion, setCalificacion] = useState<"Alta" | "Media" | "Baja" | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarFeedback = async () => {
      if (!datosComida) {
        setError("No se proporcionaron datos de la comida");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const feedback = await generarFeedbackNutricional(datosComida, tipoComida);
        setFeedbackText(feedback.texto);
        setCalificacion(feedback.calificacion);
      } catch (err: any) {
        console.error("Error al cargar feedback:", err);
        setError(err.message || "Error al generar el feedback");
        // Usar un feedback por defecto en caso de error
        setFeedbackText(
          "No se pudo generar el feedback en este momento. Por favor, verifica tu conexión a internet e intenta nuevamente."
        );
        setCalificacion(null);
      } finally {
        setIsLoading(false);
      }
    };

    cargarFeedback();
  }, [datosComida, tipoComida]);

  const handleGuardar = async () => {
    try {
      // Validar que tengamos los datos necesarios
      if (!registroComidaId) {
        Alert.alert("Error", "No se encontró el registro de comida asociado");
        return;
      }

      if (!feedbackText || !calificacion) {
        Alert.alert("Error", "No hay feedback para guardar");
        return;
      }

      // Guardar el feedback en Firebase
      await guardarFeedback({
        texto: feedbackText,
        calificacion: calificacion,
        registroComidaId: registroComidaId,
      });

      // Si hay un callback personalizado, llamarlo
      if (onGuardarPress) {
        onGuardarPress();
      } else {
        // Navegar directamente a la pantalla principal después de guardar
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error("Error al guardar feedback:", error);
      Alert.alert("Error", `No se pudo guardar el feedback: ${error.message || "Error desconocido"}`);
    }
  };

  return (
    <ThemedView style={styles.container} lightColor={MetaFitColors.background.white}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            name="chevron.left"
            size={24}
            color={MetaFitColors.text.primary}
          />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} lightColor={MetaFitColors.text.primary}>
          Feedback
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}
      >
        {/* Calificación - Solo mostrar cuando esté disponible */}
        {calificacion && (
          <View style={styles.calificacionContainer}>
            <ThemedText style={styles.calificacionLabel} lightColor={MetaFitColors.text.primary}>
              Calificación:{" "}
            </ThemedText>
            <ThemedText
              style={styles.calificacionValue}
              lightColor={
                calificacion === "Alta"
                  ? MetaFitColors.calificacion.alta
                  : calificacion === "Media"
                  ? MetaFitColors.calificacion.media
                  : calificacion === "Baja"
                  ? MetaFitColors.calificacion.baja
                  : MetaFitColors.text.secondary
              }
            >
              {calificacion}
            </ThemedText>
          </View>
        )}

        {/* Ilustración del plato */}
        <View style={styles.platoContainer}>
          <View style={styles.plato}>
            <Image
              source={FeedbackFoodImage}
              style={styles.platoImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Texto de feedback */}
        <View style={styles.feedbackContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={MetaFitColors.button.primary} />
              <ThemedText
                style={styles.loadingText}
                lightColor={MetaFitColors.text.secondary}
              >
                Generando feedback nutricional...
              </ThemedText>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <ThemedText style={styles.errorText} lightColor={MetaFitColors.text.secondary}>
                {error}
              </ThemedText>
            </View>
          ) : (
            <Markdown style={markdownStyles}>
              {feedbackText}
            </Markdown>
          )}
        </View>

        {/* Botón Guardar Feedback */}
        <TouchableOpacity style={styles.guardarButton} onPress={handleGuardar}>
          <ThemedText style={styles.guardarButtonText} lightColor={MetaFitColors.text.white}>
            Guardar Feedback
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MetaFitColors.background.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: MetaFitColors.border.divider,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  calificacionContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  calificacionLabel: {
    fontSize: 16,
    fontWeight: "400",
  },
  calificacionValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  platoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  plato: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: MetaFitColors.background.beige,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: MetaFitColors.border.light,
    overflow: "hidden",
  },
  platoImage: {
    width: "100%",
    height: "100%",
  },
  feedbackContainer: {
    backgroundColor: MetaFitColors.background.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: MetaFitColors.border.light,
  },
  feedbackText: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 22,
    color: MetaFitColors.text.primary,
  },
  feedbackBold: {
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: "center",
  },
  errorContainer: {
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  guardarButton: {
    backgroundColor: MetaFitColors.button.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  guardarButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },
});

// Estilos para Markdown
const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 22,
    color: MetaFitColors.text.primary,
  },
  heading1: {
    fontSize: 20,
    fontWeight: "700",
    color: MetaFitColors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    fontSize: 18,
    fontWeight: "700",
    color: MetaFitColors.text.primary,
    marginTop: 14,
    marginBottom: 6,
  },
  heading3: {
    fontSize: 16,
    fontWeight: "600",
    color: MetaFitColors.text.primary,
    marginTop: 12,
    marginBottom: 6,
  },
  heading4: {
    fontSize: 15,
    fontWeight: "600",
    color: MetaFitColors.text.primary,
    marginTop: 10,
    marginBottom: 4,
  },
  heading5: {
    fontSize: 14,
    fontWeight: "600",
    color: MetaFitColors.text.primary,
    marginTop: 8,
    marginBottom: 4,
  },
  heading6: {
    fontSize: 14,
    fontWeight: "600",
    color: MetaFitColors.text.primary,
    marginTop: 6,
    marginBottom: 4,
  },
  strong: {
    fontWeight: "600",
    color: MetaFitColors.text.primary,
  },
  em: {
    fontStyle: "italic",
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: MetaFitColors.text.primary,
  },
  bullet_list: {
    marginTop: 8,
    marginBottom: 8,
  },
  ordered_list: {
    marginTop: 8,
    marginBottom: 8,
  },
  list_item: {
    marginBottom: 4,
  },
  paragraph: {
    marginTop: 8,
    marginBottom: 8,
  },
});

